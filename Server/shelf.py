"""The shelf of premade meals and the foods of your own, kept on the server so every device
sees the same ones, both in one JSON file.

Serves GET /api/shelf (the whole shelf) and POST /api/shelf (one change, answered with the
whole shelf), and the same for /api/foods. With --site it also serves the site's files, which
is how Serve.bat runs it; on onee-chan Caddy serves the files and forwards /api/ here.
Standard library only. See docs/decisions/0023-the-shelf-is-kept-on-the-server.md,
docs/decisions/0026-your-own-foods-are-kept-on-the-server.md and docs/deploy.md.
"""

import argparse
import functools
import json
import math
import os
import re
import secrets
import sys
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

NAME_MAX = 60
ROW_MAX = 40
ITEMS_MAX = 60
MEALS_MAX = 1000
ML_MAX = 20000
BODY_MAX = 64 * 1024
FOOD_ID = re.compile(r'^[a-z0-9-]{1,40}$')
MEAL_ID = re.compile(r'^m[0-9a-f]{12}$')

# A food of your own, held to what site/js/core/custom-foods.js holds it to.
MY_FOOD_ID = re.compile(r'^my-[0-9a-f]{12}$')
PICTURE = re.compile(r'^[a-z0-9-]{1,40}$')
CATEGORIES = ('protein', 'volume', 'fat', 'starch')
FOODS_MAX = 500
PREP_MAX = 80
UNIT_MAX = 20
VALUE_MAX = 5000
GRAMS_MAX = 20000
PORTION_ML_MAX = 5000
PER_MAX = 1000


class Refused(Exception):
    """A change the shelf will not take. `status` is the HTTP status that says why."""

    def __init__(self, message, status=400):
        super().__init__(message)
        self.status = status


def text(value, limit, what):
    if not isinstance(value, str) or not value.strip():
        raise Refused(what + ' is missing')
    value = ' '.join(value.split())
    if len(value) > limit:
        raise Refused(what + ' is longer than ' + str(limit) + ' characters')
    return value


def number(value, low, high, what, above=False):
    """`value` if it is a number from `low` to `high`, or above `low` when `above`."""
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) \
            or not (low < value if above else low <= value) or value > high:
        raise Refused(what + ' is not a number ' + ('above ' if above else 'from ') + str(low) + ' to ' + str(high))
    return value


def food(value):
    """A food of your own, checked, without its id: values per 100 ml, or per portion with
    `portionMl` and `unit`. Its category is the browser's to suggest and the user's to pick."""
    if not isinstance(value, dict):
        raise Refused('a food is malformed')
    prep = value.get('prep')
    out = {'name': text(value.get('name'), NAME_MAX, 'name'),
           'prep': text(prep, PREP_MAX, 'preparation') if isinstance(prep, str) and prep.strip() else ''}
    if value.get('category') not in CATEGORIES:
        raise Refused('the category is not one of ' + ', '.join(CATEGORIES))
    out['category'] = value['category']
    for k in ('kcal', 'protein', 'fat', 'carbs'):
        out[k] = number(value.get(k), 0, VALUE_MAX, k)
    out['grams'] = number(value.get('grams'), 0, GRAMS_MAX, 'the weight', above=True)
    icon = value.get('icon')
    out['icon'] = icon if isinstance(icon, str) and PICTURE.match(icon) else None
    unit = value.get('unit')
    if unit is not None:
        if not isinstance(unit, dict):
            raise Refused('a portion is malformed')
        out['portionMl'] = number(value.get('portionMl'), 0, PORTION_ML_MAX, "a portion's volume", above=True)
        step = unit.get('step')
        if isinstance(step, bool) or step not in (0.5, 1):
            raise Refused("a portion's step is not 0.5 or 1")
        out['unit'] = {'per': number(unit.get('per'), 0, PER_MAX, "a portion's count", above=True),
                       'name': text(unit.get('name'), UNIT_MAX, "a portion's unit"), 'step': step}
    return out


def items(value):
    if not isinstance(value, list) or not value:
        raise Refused('a meal needs at least one food')
    if len(value) > ITEMS_MAX:
        raise Refused('a meal holds at most ' + str(ITEMS_MAX) + ' foods')
    out, seen = [], set()
    for it in value:
        if not isinstance(it, dict):
            raise Refused('a food is malformed')
        fid, ml = it.get('id'), it.get('ml')
        if not isinstance(fid, str) or not FOOD_ID.match(fid) or fid in seen:
            raise Refused('a food id is malformed or repeated')
        if isinstance(ml, bool) or not isinstance(ml, (int, float)) or not math.isfinite(ml) or not 0 < ml <= ML_MAX:
            raise Refused('an amount is not a volume in ml')
        seen.add(fid)
        out.append({'id': fid, 'ml': ml})
    return out


def grouped(meals):
    """`meals` with each row's meals together, the rows in the order they first appear.
    The order of the list is the order the shelf shows."""
    order = {}
    for m in meals:
        order.setdefault(m['row'], len(order))
    return sorted(meals, key=lambda m: order[m['row']])


def clean_foods(doc):
    """The well-formed foods of your own in a stored file, the first of each id; anything malformed is dropped."""
    foods, seen = [], set()
    for f in (doc.get('foods') if isinstance(doc, dict) else None) or []:
        try:
            if not isinstance(f, dict) or not isinstance(f.get('id'), str) or not MY_FOOD_ID.match(f['id']) or f['id'] in seen:
                continue
            foods.append(dict({'id': f['id']}, **food(f)))
            seen.add(f['id'])
        except Refused:
            continue
    return {'foods': foods}


def clean(doc):
    """The well-formed meals of a stored shelf, grouped by row; anything malformed is dropped."""
    meals = []
    for m in (doc.get('meals') if isinstance(doc, dict) else None) or []:
        try:
            if not isinstance(m, dict) or not isinstance(m.get('id'), str) or not MEAL_ID.match(m['id']):
                continue
            meals.append({'id': m['id'], 'name': text(m.get('name'), NAME_MAX, 'name'),
                          'row': text(m.get('row'), ROW_MAX, 'row'), 'items': items(m.get('items'))})
        except Refused:
            continue
    return {'meals': grouped(meals)}


def find(meals, mid):
    for i, m in enumerate(meals):
        if m['id'] == mid:
            return i
    raise Refused('no such meal on the shelf', 404)


def slot(meals, row, before):
    """Where a meal put into `row` goes: before the meal `before`, which must be in that row, or
    after the row's last meal, or at the end, starting the row, when no meal is in it."""
    if before is not None:
        i = find(meals, before)
        if meals[i]['row'] != row:
            raise Refused('that meal is in another row')
        return i
    at = [i for i, m in enumerate(meals) if m['row'] == row]
    return at[-1] + 1 if at else len(meals)


def new_id(shelf):
    taken = {m['id'] for m in shelf['meals']}
    while True:
        mid = 'm' + secrets.token_hex(6)
        if mid not in taken:
            return mid


def apply(shelf, op):
    """Applies one change to `shelf` in place. Raises Refused for one it will not take."""
    if not isinstance(op, dict):
        raise Refused('a change is an object')
    kind = op.get('op')
    meals = shelf['meals']
    if kind in ('add', 'copy') and len(meals) >= MEALS_MAX:
        raise Refused('the shelf is full', 409)
    if kind == 'add':
        row = text(op.get('row'), ROW_MAX, 'row')
        meal = {'id': new_id(shelf), 'name': text(op.get('name'), NAME_MAX, 'name'), 'row': row, 'items': items(op.get('items'))}
        # First in its row, or a new row at the end.
        meals.insert(next((i for i, m in enumerate(meals) if m['row'] == row), len(meals)), meal)
    elif kind == 'copy':
        i = find(meals, op.get('id'))
        src = meals[i]
        name = text(src['name'] + ' (copy)', NAME_MAX + 7, 'name')[:NAME_MAX]
        meals.insert(i + 1, {'id': new_id(shelf), 'name': name, 'row': src['row'], 'items': [dict(it) for it in src['items']]})
    elif kind == 'rename':
        meals[find(meals, op.get('id'))]['name'] = text(op.get('name'), NAME_MAX, 'name')
    elif kind == 'place':
        meal = meals.pop(find(meals, op.get('id')))
        meal['row'] = text(op.get('row'), ROW_MAX, 'row')
        meals.insert(slot(meals, meal['row'], op.get('before')), meal)
    elif kind == 'placeRow':
        row = text(op.get('row'), ROW_MAX, 'row')
        moving = [m for m in meals if m['row'] == row]
        rest = [m for m in meals if m['row'] != row]
        if not moving:
            raise Refused('no such row on the shelf', 404)
        at = len(rest)
        if op.get('before') is not None:
            before = text(op.get('before'), ROW_MAX, 'row')
            at = next((i for i, m in enumerate(rest) if m['row'] == before), None)
            if at is None:
                raise Refused('no such row on the shelf', 404)
        meals[:] = rest[:at] + moving + rest[at:]
    elif kind == 'remove':
        del meals[find(meals, op.get('id'))]
    elif kind == 'renameRow':
        old, new = text(op.get('from'), ROW_MAX, 'row'), text(op.get('to'), ROW_MAX, 'row')
        moved = [m for m in meals if m['row'] == old]
        if not moved:
            raise Refused('no such row on the shelf', 404)
        for m in moved:
            m['row'] = new
    else:
        raise Refused('unknown change')
    # A row renamed to one in use joins it there.
    meals[:] = grouped(meals)
    return shelf


def find_food(foods, fid):
    for i, f in enumerate(foods):
        if f['id'] == fid:
            return i
    raise Refused('no such food of your own', 404)


def new_food_id(doc):
    taken = {f['id'] for f in doc['foods']}
    while True:
        fid = 'my-' + secrets.token_hex(6)
        if fid not in taken:
            return fid


def apply_food(doc, op):
    """Applies one change to the foods of your own in `doc` in place: `add` one at the end, `edit`
    one by id, keeping its id, or `remove` one. Raises Refused for one it will not take. A shelved
    meal holding a removed food keeps it in the file, and the browser shows the meal without it."""
    if not isinstance(op, dict):
        raise Refused('a change is an object')
    kind = op.get('op')
    foods = doc['foods']
    if kind == 'add':
        if len(foods) >= FOODS_MAX:
            raise Refused('there are ' + str(FOODS_MAX) + ' foods of your own already', 409)
        foods.append(dict({'id': new_food_id(doc)}, **food(op.get('food'))))
    elif kind == 'edit':
        i = find_food(foods, op.get('id'))
        foods[i] = dict({'id': foods[i]['id']}, **food(op.get('food')))
    elif kind == 'remove':
        del foods[find_food(foods, op.get('id'))]
    else:
        raise Refused('unknown change')
    return doc


# Each address: the key of the file it answers with, and what applies a change to it.
PARTS = {'/api/shelf': ('meals', apply), '/api/foods': ('foods', apply_food)}


class Store:
    """The shelf and the foods of your own, in memory and in their one file. Every change is
    written before it is answered."""

    def __init__(self, path):
        self.path = path
        self.lock = threading.Lock()
        try:
            with open(path, encoding='utf-8') as f:
                doc = json.load(f)
        except FileNotFoundError:
            doc = {}
        self.doc = {'meals': clean(doc)['meals'], 'foods': clean_foods(doc)['foods']}

    def read(self, part='/api/shelf'):
        key = PARTS[part][0]
        with self.lock:
            return {key: json.loads(json.dumps(self.doc[key]))}

    def change(self, op, part='/api/shelf'):
        key, change = PARTS[part]
        with self.lock:
            draft = json.loads(json.dumps(self.doc))
            change(draft, op)
            tmp = self.path + '.tmp'
            with open(tmp, 'w', encoding='utf-8') as f:
                json.dump(draft, f, ensure_ascii=False, indent=1)
            os.replace(tmp, self.path)
            self.doc = draft
            return {key: json.loads(json.dumps(draft[key]))}


class Handler(SimpleHTTPRequestHandler):
    store = None
    serve_files = False

    def end_headers(self):
        # Revalidate every file, as Caddy does on the server, so an edit shows on the next reload.
        self.send_header('Cache-Control', 'no-store' if self.path.startswith('/api/') else 'no-cache')
        super().end_headers()

    def answer(self, status, body):
        data = json.dumps(body, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        part = self.path.split('?')[0]
        if part in PARTS:
            return self.answer(200, self.store.read(part))
        if self.path.startswith('/api/') or not self.serve_files:
            return self.answer(404, {'error': 'not found'})
        return super().do_GET()

    def do_HEAD(self):
        if self.path.startswith('/api/') or not self.serve_files:
            return self.answer(404, {'error': 'not found'})
        return super().do_HEAD()

    def do_POST(self):
        part = self.path.split('?')[0]
        if part not in PARTS:
            return self.answer(404, {'error': 'not found'})
        # Only a JSON body: a page on another site cannot send one without asking first, and nothing here says yes.
        if self.headers.get('Content-Type', '').split(';')[0].strip() != 'application/json':
            return self.answer(415, {'error': 'send JSON'})
        try:
            length = int(self.headers.get('Content-Length', ''))
        except ValueError:
            return self.answer(411, {'error': 'length required'})
        if not 0 < length <= BODY_MAX:
            return self.answer(413, {'error': 'too large'})
        try:
            op = json.loads(self.rfile.read(length).decode('utf-8'))
            return self.answer(200, self.store.change(op, part))
        except Refused as e:
            return self.answer(e.status, {'error': str(e)})
        except (ValueError, UnicodeDecodeError):
            return self.answer(400, {'error': 'not JSON'})
        except OSError as e:
            # Answered with a reason, so the browser shows the change as not saved and stays online.
            return self.answer(500, {'error': 'the file could not be written (' + type(e).__name__ + ')'})


def main(argv=None):
    p = argparse.ArgumentParser(description='The shelf of premade meals and the foods of your own, and optionally the site.')
    p.add_argument('--data', required=True, help='the JSON file the shelf and the foods of your own are kept in')
    p.add_argument('--site', help='also serve this folder, as Serve.bat does')
    p.add_argument('--bind', default='127.0.0.1')
    p.add_argument('--port', type=int, default=int(os.environ.get('PORT', '8737')))
    args = p.parse_args(argv)

    try:
        store = Store(args.data)
    except (OSError, ValueError) as e:
        print('Cannot read the shelf and foods at ' + args.data + ': ' + str(e), file=sys.stderr)
        return 1
    handler = type('ShelfHandler', (Handler,), {'store': store, 'serve_files': bool(args.site)})
    if args.site:
        handler = functools.partial(handler, directory=args.site)
    # On Windows, SO_REUSEADDR lets a second server bind a port already served and lose every
    # request to the first, so a busy port has to fail here instead.
    server_class = type('ShelfServer', (ThreadingHTTPServer,), {'allow_reuse_address': os.name != 'nt'})
    try:
        server = server_class((args.bind, args.port), handler)
    except OSError as e:
        print('Cannot serve on ' + args.bind + ':' + str(args.port) + ', something else may be using it: ' + str(e), file=sys.stderr)
        return 1
    print('Serving' + (' ' + args.site + ' and' if args.site else '') + ' the shelf on http://' + args.bind + ':' + str(args.port), flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == '__main__':
    sys.exit(main())
