# Deploy

Scope: putting the site on the home network at https://mealplanner.home/, and the one-time setup the router and each device need. Why it is shaped this way is [0022](decisions/0022-the-site-is-also-served-on-the-home-network.md).

## Deploying

```
Deploy.bat
```

Runs the [gate](testing.md). When it is green, ships `site/` and `Server/` to `~/mealplanner` on `jeremi@192.168.1.31` (onee-chan, by address), starts Caddy or reloads its config, and restarts the shelf. Nothing ships when the gate fails. It exits non-zero on any failure, and keeps its window open when double-clicked.

| File | Is |
|---|---|
| `Deploy.bat` | The gate, then the release packed with Windows' `tar` and unpacked over `ssh` |
| `Server/compose.yaml` | The Caddy container: port 443 on IPv4 only, the folder mounted read-only, the CA in a named volume. The shelf's container: no port, the shelf in its own volume |
| `Server/Caddyfile` | The site, its certificate from Caddy's own CA, `/ca.crt`, `/api/` forwarded to the shelf, and the private-network-only rule |
| `Server/shelf.py` | The shelf of premade meals ([0023](decisions/0023-the-shelf-is-kept-on-the-server.md)) |
| `Server/install.sh` | Runs on the server: swaps the new `site/` in whole, then `docker compose up`, a reload and a restart of the shelf |

## Once: the network

1. **On the router (192.168.1.1), under DHCP, reserve 192.168.1.31 for onee-chan.** `Deploy.bat` and the name both point at that address.
2. **On the router, under DNS, set onee-chan's DNS name to `mealplanner`.** The router answers only for one name per device, under its own `.home` domain, so the server is then `mealplanner.home`; `onee-chan` still resolves. A dotted name such as `mealplanner.home.arpa` is not served.

Check it with `nslookup mealplanner.home 192.168.1.1`. A computer can take a hosts line instead, `192.168.1.31 mealplanner.home`, in `C:\Windows\System32\drivers\etc\hosts`; a phone cannot.

A device that sends its DNS elsewhere cannot find the name: Android's Private DNS set to a hostname, a browser's secure DNS set to a custom provider, or a VPN that hands Windows its own DNS server. Set the first two to automatic or off.

## Once: each device

Open https://mealplanner.home/ca.crt. The browser warns on this first visit, since the device does not yet trust the CA. Check the root's SHA-256 fingerprint is

```
59:63:64:22:5A:70:82:3B:A8:FE:F8:E7:B7:F1:0E:63:EF:E2:85:09:01:D1:A5:5B:DF:A2:1D:03:6A:53:1A:DD
```

then trust it as a root:

- **Windows** — in PowerShell, `curl.exe -k -o "$env:TEMP\mealplanner-ca.crt" https://mealplanner.home/ca.crt; Import-Certificate -FilePath "$env:TEMP\mealplanner-ca.crt" -CertStoreLocation Cert:\CurrentUser\Root`. Windows' warning shows the SHA-1 thumbprint, `0699CCFF11B332DED28535CCA3EA1EDA22C354E3`. Close every browser window afterwards. Firefox reads the Windows store by default.
- **Android** — Settings → Security → Encryption & credentials → Install a certificate → *CA certificate*.
- **iPhone, iPad** — open it in Safari, allow the profile, install it under Settings → Profile Downloaded, then turn it on under Settings → General → About → Certificate Trust Settings.
- **Mac** — open it in Keychain Access, in *System*, and set it to Always Trust.

## On the server

```
ssh jeremi@192.168.1.31 "docker compose -f ~/mealplanner/compose.yaml logs caddy"
```

`logs shelf` in place of `logs caddy` shows the shelf's. `down` stops the site and keeps the CA and the shelf. **`down -v` deletes both**: every device then has to trust a new root, and every premade meal is gone ([P2](todo/P2/back-up-the-shelf.md)).

## See also
- [0022](decisions/0022-the-site-is-also-served-on-the-home-network.md) — why Caddy, Docker and `mealplanner.home`
- [0005](decisions/0005-state-lives-in-the-browser.md) — why the LAN copy starts with no meals
- [0023](decisions/0023-the-shelf-is-kept-on-the-server.md) — why the shelf is the one thing it keeps
- [Testing](testing.md) — the gate a deploy runs first
