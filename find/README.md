# Find Kunal

A pixel town to explore, with me hidden in it. Served at `/find`.

This folder is a **build output**, committed so the site stays build-free like `desk/`. The source lives on the `experiment/find-kunal` branch (Vite + TypeScript, everything drawn in code).

## Move in

Visitors can add their own NPC for $5 (Venmo @kunalbhat, with a code in the note). It's backed by:

- `api/npcs.mjs` – public: list residents, submit a new one, check a code's status
- `api/admin.mjs` – private: approve / reject / remove (needs `ADMIN_TOKEN`)
- `shared/npc.mjs` – the schema both the page and the API validate against
- Upstash Redis (`KV_REST_API_URL` / `KV_REST_API_TOKEN`, from the Vercel Marketplace)

Approve new residents at `/find/admin.html`, signing in with `ADMIN_TOKEN`.

## Updating

    git checkout experiment/find-kunal
    npm install && npm run build
    # then on main:
    #   replace find/index.html, find/admin.html and find/assets/ with dist/
    #   (rewrite ./assets/ and ./favicon.ico to /find/...)
    #   copy api/*.mjs and shared/npc.mjs to the repo root
