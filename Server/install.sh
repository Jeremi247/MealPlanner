#!/bin/sh
# Runs on onee-chan once Deploy.bat has unpacked a release into ~/mealplanner/incoming.
# Swaps in the new site, then starts Caddy or reloads its config. See docs/deploy.md.
set -e
cd ~/mealplanner

# Check the new Caddyfile with the new compose.yaml before either replaces the old: a bad one left
# on disk would stop Caddy at its next restart. Nothing has moved yet if this fails.
if ! out=$(docker compose -f incoming/compose.yaml run --rm --no-deps -T --quiet-pull caddy caddy validate --config /srv/Caddyfile --adapter caddyfile 2>&1); then
	echo "$out" >&2
	echo "The new Caddyfile is invalid: nothing deployed." >&2
	exit 1
fi

mv incoming/compose.yaml incoming/Caddyfile incoming/shelf.py .
rm -rf site.old
if [ -d site ]; then mv site site.old; fi
mv incoming/site site
rm -rf incoming site.old

docker compose up -d --quiet-pull
# The shelf reads shelf.py once, at start, so a new one needs a restart; the shelf itself is in its volume.
docker compose restart shelf

# A container started a moment ago may not be listening for a reload yet.
for try in 1 2 3 4 5; do
	if docker compose exec -T caddy caddy reload --config /srv/Caddyfile --adapter caddyfile >/dev/null 2>&1; then exit 0; fi
	sleep 1
done
echo "Caddy did not take the new Caddyfile. Its log: docker compose -f ~/mealplanner/compose.yaml logs caddy" >&2
exit 1
