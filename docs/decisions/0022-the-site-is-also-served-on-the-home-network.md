# 0022 — The site is also served on the home network

Scope: where the site is served besides `Serve.bat`, under what name, and how a new version gets there. It does not change what the site is made of ([0002](0002-no-build-step-and-no-dependencies.md)) or where state lives ([0005](0005-state-lives-in-the-browser.md)). The steps are in [deploy](../deploy.md).

## Decision

- **`Deploy.bat` runs the gate, then copies `site/` and `Server/` to `~/mealplanner` on onee-chan** (192.168.1.31, Ubuntu), by address. Nothing is copied when the gate fails. `Serve.bat` stays the way to work on the site; the home network sees what was last deployed.
- **Caddy, in a Docker container, serves it at `https://mealplanner.home/`**, on port 443 only, with a certificate from Caddy's own CA. Each device trusts that CA's root once.
- **The name is the router's**: onee-chan's DNS name on the Orange router is `mealplanner`, under the router's `.home` domain. `onee-chan` still resolves.
- **It is reachable over IPv4 only, and requests from outside the private address ranges are dropped**, so a router forwarding 443 later does not publish the site. Over IPv6, Docker's proxy can hand Caddy each client as its bridge's private address, which would let any client past the rule.
- **Every file is sent `Cache-Control: no-cache`**, so a deploy shows on the next reload.
- **A deploy swaps `site/` whole**: a file deleted locally is gone from the server too.

## Why

Jeremi wanted the site on the home network, over HTTPS, under a name. The account on onee-chan has no password-less `sudo` but is in the `docker` group, so a container is what can be installed and updated without a password. Caddy issues and renews its own certificates.

## Rejected

- **`mealplanner.dev`**, the name first asked for. It is someone else's registered domain, and `.dev` is HSTS-preloaded: a device using secure DNS reaches the real site, and no public CA would sign it for this server.
- **A subdomain of Jeremi's OVH domain, with a Let's Encrypt certificate.** No device setup, but an OVH API key on the server and a Caddy build with the OVH DNS module. Jeremi chose a local name.
- **`mealplanner.home.arpa`**, the name reserved for home networks. The router serves one name per device, only under `.home`, and sends `home.arpa` upstream, where it times out.
- **A public A record to 192.168.1.31 on the OVH domain.** It needs no router support, but some routers drop public answers that point at private addresses. Jeremi chose the router's name.
- **Port 80.** An orphaned Apache holds it: its package is removed but the process still runs as root. HTTPS alone needs no port 80.

## Consequences

- **Each device needs the root installed and the name resolvable** ([deploy](../deploy.md)). The CA lives in the `mealplanner_caddy_data` volume; losing it means every device trusts a new root.
- **State is per origin** ([0005](0005-state-lives-in-the-browser.md)): what was entered at 127.0.0.1:8737 does not appear at `mealplanner.home`, and each device starts empty.
- **The server stores nothing a user enters**, so [local, private, zero-install](../architecture/critical-assumptions.md#local-private-and-zero-install) holds. The site still requests nothing but its own files.
- The deploy is not under test. A green gate proves the site, not the copy on the server.
