"""Tests for Server/shelf.py: the changes it takes and refuses, and the HTTP it answers.
Run by Scripts/TestServer.ps1. See docs/testing.md."""

import contextlib
import importlib.util
import io
import json
import os
import shutil
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
from http.server import ThreadingHTTPServer

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('shelf', os.path.join(HERE, '..', 'Server', 'shelf.py'))
shelf = importlib.util.module_from_spec(spec)
spec.loader.exec_module(shelf)

MEAL = {'op': 'add', 'name': 'Skyr & berries', 'row': 'Breakfast', 'items': [{'id': 'skyr', 'ml': 200}, {'id': 'strawberries', 'ml': 200}]}


def read(path):
    with open(path, encoding='utf-8') as f:
        return f.read()


def fresh():
    return shelf.apply({'meals': []}, MEAL)


def names(s):
    return [m['name'] for m in s['meals']]


def rows(s):
    return [(m['name'], m['row']) for m in s['meals']]


def three_rows():
    """Rows A, B and C, holding A1 A2, B1 B2 and C1 in that order."""
    s = {'meals': []}
    for n in ['C1', 'B2', 'B1', 'A2', 'A1']:
        shelf.apply(s, dict(MEAL, name=n, row=n[0]))
    shelf.apply(s, {'op': 'placeRow', 'row': 'C', 'before': None})
    shelf.apply(s, {'op': 'placeRow', 'row': 'B', 'before': 'C'})
    return s


class Changes(unittest.TestCase):
    def test_add_keeps_the_meal_and_gives_it_an_id(self):
        s = fresh()
        self.assertEqual(len(s['meals']), 1)
        m = s['meals'][0]
        self.assertRegex(m['id'], shelf.MEAL_ID)
        self.assertEqual((m['name'], m['row'], m['items']), (MEAL['name'], MEAL['row'], MEAL['items']))

    def test_names_are_trimmed_and_their_spaces_collapsed(self):
        s = shelf.apply({'meals': []}, dict(MEAL, name='  Tuna   salad ', row=' Lunch '))
        self.assertEqual((s['meals'][0]['name'], s['meals'][0]['row']), ('Tuna salad', 'Lunch'))

    def test_a_malformed_meal_is_refused(self):
        bad = [
            dict(MEAL, name=''), dict(MEAL, name='x' * 61), dict(MEAL, row='   '), dict(MEAL, items=[]),
            dict(MEAL, items=[{'id': 'skyr', 'ml': 0}]), dict(MEAL, items=[{'id': 'skyr', 'ml': '200'}]),
            dict(MEAL, items=[{'id': 'skyr', 'ml': True}]), dict(MEAL, items=[{'id': 'skyr', 'ml': float('inf')}]),
            dict(MEAL, items=[{'id': 'Skyr!', 'ml': 100}]), dict(MEAL, items=[{'id': 'skyr', 'ml': 1}, {'id': 'skyr', 'ml': 2}]),
            {'op': 'explode'}, ['add'],
        ]
        for op in bad:
            with self.assertRaises(shelf.Refused, msg=repr(op)):
                shelf.apply({'meals': []}, op)

    def test_rename_place_copy_and_remove(self):
        s = fresh()
        mid = s['meals'][0]['id']
        shelf.apply(s, {'op': 'rename', 'id': mid, 'name': 'Berry bowl'})
        shelf.apply(s, {'op': 'place', 'id': mid, 'row': 'Snacks', 'before': None})
        shelf.apply(s, {'op': 'copy', 'id': mid})
        self.assertEqual([(m['name'], m['row']) for m in s['meals']], [('Berry bowl', 'Snacks'), ('Berry bowl (copy)', 'Snacks')])
        self.assertNotEqual(s['meals'][0]['id'], s['meals'][1]['id'])
        s['meals'][1]['items'][0]['ml'] = 1
        self.assertEqual(s['meals'][0]['items'][0]['ml'], 200, 'a copy shares no rows with its original')
        shelf.apply(s, {'op': 'remove', 'id': mid})
        self.assertEqual([m['name'] for m in s['meals']], ['Berry bowl (copy)'])

    def test_a_change_to_a_meal_not_on_the_shelf_is_404(self):
        for op in ({'op': 'rename', 'id': 'm000000000000', 'name': 'x'}, {'op': 'remove', 'id': 'nope'},
                   {'op': 'renameRow', 'from': 'Nowhere', 'to': 'x'},
                   {'op': 'place', 'id': 'nope', 'row': 'Breakfast', 'before': None},
                   {'op': 'placeRow', 'row': 'Nowhere', 'before': None}, {'op': 'placeRow', 'row': 'Breakfast', 'before': 'Nowhere'}):
            with self.assertRaises(shelf.Refused) as e:
                shelf.apply(fresh(), op)
            self.assertEqual(e.exception.status, 404)

    def test_renaming_a_row_moves_every_meal_in_it_and_only_those(self):
        s = fresh()
        shelf.apply(s, dict(MEAL, name='Oats'))
        shelf.apply(s, dict(MEAL, name='Tuna salad', row='Lunch'))
        shelf.apply(s, {'op': 'renameRow', 'from': 'Breakfast', 'to': 'Mornings'})
        self.assertEqual([m['row'] for m in s['meals']], ['Mornings', 'Mornings', 'Lunch'])

    def test_a_new_meal_goes_first_in_its_row_and_a_copy_after_its_original(self):
        s = shelf.apply(shelf.apply(fresh(), dict(MEAL, name='Tuna salad', row='Lunch')), dict(MEAL, name='Oats'))
        self.assertEqual(names(s), ['Oats', 'Skyr & berries', 'Tuna salad'])
        shelf.apply(s, {'op': 'copy', 'id': s['meals'][0]['id']})
        self.assertEqual(names(s), ['Oats', 'Oats (copy)', 'Skyr & berries', 'Tuna salad'])

    def test_place_moves_a_meal_before_another_or_to_the_end_of_a_row(self):
        s = three_rows()
        ids = {m['name']: m['id'] for m in s['meals']}
        shelf.apply(s, {'op': 'place', 'id': ids['B2'], 'row': 'B', 'before': ids['B1']})
        self.assertEqual(names(s), ['A1', 'A2', 'B2', 'B1', 'C1'], 'within a row')
        shelf.apply(s, {'op': 'place', 'id': ids['A1'], 'row': 'A', 'before': None})
        self.assertEqual(names(s), ['A2', 'A1', 'B2', 'B1', 'C1'], 'the row keeps its place when its first meal moves')
        shelf.apply(s, {'op': 'place', 'id': ids['C1'], 'row': 'A', 'before': ids['A1']})
        self.assertEqual(rows(s), [('A2', 'A'), ('C1', 'A'), ('A1', 'A'), ('B2', 'B'), ('B1', 'B')], 'into another row, which goes when empty')
        shelf.apply(s, {'op': 'place', 'id': ids['A2'], 'row': 'D', 'before': None})
        self.assertEqual(rows(s)[-1], ('A2', 'D'), 'a row no meal is in starts at the end')

    def test_place_refuses_a_before_in_another_row_or_the_meal_itself(self):
        s = three_rows()
        ids = {m['name']: m['id'] for m in s['meals']}
        for before in (ids['B1'], ids['A1']):
            with self.assertRaises(shelf.Refused):
                shelf.apply(s, {'op': 'place', 'id': ids['A1'], 'row': 'A', 'before': before})

    def test_place_row_moves_every_meal_in_it_together(self):
        s = three_rows()
        shelf.apply(s, {'op': 'placeRow', 'row': 'C', 'before': 'A'})
        self.assertEqual(names(s), ['C1', 'A1', 'A2', 'B1', 'B2'])
        shelf.apply(s, {'op': 'placeRow', 'row': 'A', 'before': None})
        self.assertEqual(names(s), ['C1', 'B1', 'B2', 'A1', 'A2'])

    def test_a_row_renamed_to_one_in_use_joins_it(self):
        s = three_rows()
        shelf.apply(s, {'op': 'renameRow', 'from': 'C', 'to': 'A'})
        self.assertEqual(rows(s), [('A1', 'A'), ('A2', 'A'), ('C1', 'A'), ('B1', 'B'), ('B2', 'B')])

    def test_clean_groups_each_rows_meals_keeping_their_order(self):
        good = fresh()['meals'][0]
        doc = {'meals': [dict(good, id='m%012d' % i, name=n, row=n[0]) for i, n in enumerate(['A1', 'B1', 'A2', 'C1', 'B2'])]}
        self.assertEqual(names(shelf.clean(doc)), ['A1', 'A2', 'B1', 'B2', 'C1'])

    def test_clean_drops_malformed_meals_and_keeps_the_rest(self):
        good = fresh()['meals'][0]
        doc = {'meals': [good, {'id': 'bad'}, dict(good, id='m111111111111', items=[{'id': 'x', 'ml': -1}]), 'junk']}
        self.assertEqual(shelf.clean(doc), {'meals': [good]})
        self.assertEqual(shelf.clean(None), {'meals': []})


FOOD = {'name': 'Quark', 'prep': 'Plain, 0%', 'category': 'protein', 'kcal': 68, 'protein': 12, 'fat': 0.2, 'carbs': 4,
        'grams': 105, 'icon': 'bowl-with-spoon'}
PORTION = dict(FOOD, name='Rice cake', category='starch', portionMl=40, unit={'per': 1, 'name': 'cake', 'step': 1})


def foods():
    return {'meals': [], 'foods': []}


class Foods(unittest.TestCase):
    def test_add_keeps_the_food_and_gives_it_an_id(self):
        d = shelf.apply_food(foods(), {'op': 'add', 'food': FOOD})
        f = d['foods'][0]
        self.assertRegex(f['id'], shelf.MY_FOOD_ID)
        self.assertEqual({k: v for k, v in f.items() if k != 'id'}, FOOD)
        self.assertRegex(f['id'], shelf.FOOD_ID, 'a shelved meal can hold it')

    def test_a_portion_is_kept_with_its_volume_and_unit(self):
        f = shelf.apply_food(foods(), {'op': 'add', 'food': PORTION})['foods'][0]
        self.assertEqual((f['portionMl'], f['unit']), (40, PORTION['unit']))

    def test_edit_keeps_the_id_and_remove_takes_the_food(self):
        d = shelf.apply_food(foods(), {'op': 'add', 'food': FOOD})
        fid = d['foods'][0]['id']
        shelf.apply_food(d, {'op': 'edit', 'id': fid, 'food': dict(FOOD, name='Skyr', kcal=60)})
        self.assertEqual((d['foods'][0]['id'], d['foods'][0]['name'], d['foods'][0]['kcal']), (fid, 'Skyr', 60))
        shelf.apply_food(d, {'op': 'remove', 'id': fid})
        self.assertEqual(d['foods'], [])
        with self.assertRaises(shelf.Refused) as e:
            shelf.apply_food(d, {'op': 'remove', 'id': fid})
        self.assertEqual(e.exception.status, 404)

    def test_a_malformed_food_is_refused(self):
        bad = [dict(FOOD, name=''), dict(FOOD, name='x' * 61), dict(FOOD, category='dessert'), dict(FOOD, kcal=-1),
               dict(FOOD, protein='12'), dict(FOOD, fat=True), dict(FOOD, carbs=float('nan')), dict(FOOD, grams=0),
               dict(FOOD, prep='x' * 81), dict(PORTION, portionMl=0), dict(PORTION, unit={'per': 0, 'name': 'cake', 'step': 1}),
               dict(PORTION, unit={'per': 1, 'name': '', 'step': 1}), dict(PORTION, unit={'per': 1, 'name': 'cake', 'step': 2}),
               dict(PORTION, unit='cake'), 'junk']
        for f in bad:
            with self.subTest(f=f), self.assertRaises(shelf.Refused):
                shelf.apply_food(foods(), {'op': 'add', 'food': f})

    def test_an_unknown_picture_is_dropped_not_refused(self):
        f = shelf.apply_food(foods(), {'op': 'add', 'food': dict(FOOD, icon='<b>')})['foods'][0]
        self.assertIsNone(f['icon'])

    def test_clean_foods_drops_malformed_and_repeated_foods(self):
        good = shelf.apply_food(foods(), {'op': 'add', 'food': FOOD})['foods'][0]
        doc = {'foods': [good, dict(good), dict(good, id='my-bad'), dict(good, id='my-111111111111', kcal=-5), 'junk']}
        self.assertEqual(shelf.clean_foods(doc), {'foods': [good]})
        self.assertEqual(shelf.clean_foods(None), {'foods': []})


class Http(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.mkdtemp()
        self.path = os.path.join(self.dir, 'shelf.json')
        handler = type('H', (shelf.Handler,), {'store': shelf.Store(self.path), 'serve_files': False,
                                            'log_message': lambda *a: None})
        self.server = ThreadingHTTPServer(('127.0.0.1', 0), handler)
        threading.Thread(target=self.server.serve_forever, daemon=True).start()
        self.url = 'http://127.0.0.1:%d/api/shelf' % self.server.server_address[1]

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        shutil.rmtree(self.dir)

    def post(self, body, ctype='application/json'):
        req = urllib.request.Request(self.url, data=body, headers={'Content-Type': ctype}, method='POST')
        try:
            with urllib.request.urlopen(req) as r:
                return r.status, json.loads(r.read())
        except urllib.error.HTTPError as e:
            return e.code, json.loads(e.read())

    def test_a_change_is_saved_to_the_file_and_survives_a_restart(self):
        status, doc = self.post(json.dumps(MEAL).encode())
        self.assertEqual(status, 200)
        self.assertEqual(doc['meals'][0]['name'], MEAL['name'])
        with urllib.request.urlopen(self.url) as r:
            self.assertEqual(json.loads(r.read()), doc)
            self.assertEqual(r.headers['Cache-Control'], 'no-store')
        self.assertEqual(shelf.Store(self.path).read(), doc)

    def test_a_refused_change_leaves_the_file_alone(self):
        self.post(json.dumps(MEAL).encode())
        before = read(self.path)
        status, body = self.post(json.dumps(dict(MEAL, name='')).encode())
        self.assertEqual(status, 400)
        self.assertIn('error', body)
        self.assertEqual(read(self.path), before)

    def test_a_change_that_cannot_be_written_is_answered_and_not_kept(self):
        self.server.RequestHandlerClass.store.path = os.path.join(self.dir, 'gone', 'shelf.json')
        status, body = self.post(json.dumps(MEAL).encode())
        self.assertEqual(status, 500)
        self.assertIn('could not be written', body['error'])
        with urllib.request.urlopen(self.url) as r:
            self.assertEqual(json.loads(r.read()), {'meals': []})

    def test_foods_are_kept_in_the_shelfs_file_without_touching_the_shelf(self):
        self.post(json.dumps(MEAL).encode())
        foods_url = self.url.replace('/api/shelf', '/api/foods')
        req = urllib.request.Request(foods_url, data=json.dumps({'op': 'add', 'food': FOOD}).encode(),
                                     headers={'Content-Type': 'application/json'}, method='POST')
        with urllib.request.urlopen(req) as r:
            doc = json.loads(r.read())
        self.assertEqual([f['name'] for f in doc['foods']], ['Quark'])
        self.assertNotIn('meals', doc)
        with urllib.request.urlopen(foods_url) as r:
            self.assertEqual(json.loads(r.read()), doc)
        with urllib.request.urlopen(self.url) as r:
            self.assertEqual([m['name'] for m in json.loads(r.read())['meals']], [MEAL['name']])
        again = shelf.Store(self.path)
        self.assertEqual((again.read('/api/foods'), len(again.read()['meals'])), (doc, 1))

    def test_only_a_json_body_is_taken(self):
        self.assertEqual(self.post(json.dumps(MEAL).encode(), 'text/plain')[0], 415)
        self.assertEqual(self.post(b'{not json')[0], 400)
        self.assertFalse(os.path.exists(self.path))

    def test_files_are_not_served_without_a_site(self):
        with self.assertRaises(urllib.error.HTTPError) as e:
            urllib.request.urlopen(self.url.replace('/api/shelf', '/index.html'))
        self.assertEqual(e.exception.code, 404)

    def test_a_port_already_served_is_refused_rather_than_shared(self):
        port = str(self.server.server_address[1])
        with contextlib.redirect_stderr(io.StringIO()) as err:
            self.assertEqual(shelf.main(['--data', self.path, '--port', port]), 1)
        self.assertIn('Cannot serve', err.getvalue())


if __name__ == '__main__':
    unittest.main()
