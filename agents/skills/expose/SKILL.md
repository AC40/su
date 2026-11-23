---
name: expose
description: >
  Run Collatio on this machine and open it to the user's other devices over
  Tailscale (`tailscale serve`), with hot reload working. Use when the user
  asks to start the dev server, host, share, expose or tunnel the app, or
  mentions Tailscale, a tailnet or a ts.net address.
---

# Host the app and expose it over Tailscale

Only on request: the dev server on port 3000 is the user's own (Collatio's AGENTS.md).

## Steps

1. **Check the ground.** `tailscale status --self --peers=false` shows the
   machine is signed in. `ss -ltnp | grep ':3000\b'` must print nothing; if
   it does, that server is the user's, so ask instead of killing it.
2. **Start the app**, from the Collatio repo root, in the background:

   ```bash
   pnpm dev > /tmp/collatio-dev.log 2>&1 &            # dev, hot reload
   pnpm build && pnpm start -p 3000 > /tmp/collatio-dev.log 2>&1 &   # or a production build
   ```

   Wait for `Ready in` in the log.

3. **Expose it on the tailnet:**

   ```bash
   tailscale serve --bg 3000
   ```

   It prints the address, `https://<machine>.<tailnet>.ts.net/`, with a
   trusted certificate, reachable by devices signed into the tailnet only.
   `tailscale funnel` would publish to the whole internet: never use it
   unless the user asks for exactly that.

4. **Prove it**, then give the user the address:

   ```bash
   curl -s -o /dev/null -w '%{http_code}\n' -L https://<addr>/          # 200 (the login page)
   curl -s -i -N --http1.1 -H 'Connection: Upgrade' -H 'Upgrade: websocket' \
     -H 'Sec-WebSocket-Version: 13' -H 'Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==' \
     -H 'Origin: https://<addr>' https://<addr>/_next/webpack-hmr | head -n 1   # 101 Switching Protocols
   ```

   The first page takes a while: Turbopack compiles each route on its first
   visit. `--http1.1` matters: HTTP/2 has no Upgrade, so curl over it gets a
   404 that means nothing.

## The WebSocket problem, solved

Next's dev server blocks its own `/_next/*` resources and the hot-reload
socket for any host but localhost: the page loads through the tunnel, but
styles, chunks and `wss://…/_next/webpack-hmr` get `403 Unauthorized`, and
the log prints `Blocked cross-origin request to Next.js dev resource`.
`next.config.ts` allows every tailnet host:

```ts
allowedDevOrigins: ["*.*.ts.net"],
```

Two stars on purpose: a `*` matches one DNS label, and a tailnet address is
`<machine>.<tailnet>.ts.net`. A config change needs a dev server restart.
A production build (`next start`) has no such check, and Tailscale itself
proxies WebSockets fine.

## Stop

```bash
tailscale serve --https=443 off
kill $(ps -o ppid= -p $(ss -ltnp | grep ':3000\b' | grep -oE 'pid=[0-9]+' | cut -d= -f2))
```

The kill goes to the port holder's parent, the `next dev` process: killing
`next-server` itself only makes `next dev` spawn a new one on the port.

## Gotchas

- Sign-in uses the Supabase project in `.env`. A magic link or confirm
  flow that lands on localhost instead of the ts.net address is that
  project's redirect allow-list, not the server.
- `tailscale serve status` shows what is exposed; a stale entry from an
  earlier session still points at port 3000, so a fresh server just works.
