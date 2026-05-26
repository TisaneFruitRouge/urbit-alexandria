# Alexandria

An open, federated PDF library for Urbit. Each ship hosts its own books and can subscribe to other ships — when you subscribe to a ship, their catalog merges into yours. No central server, no accounts, no moderation layer.

## How it works

The backend is a single Gall agent (`%alexandria`) that handles three things:

- **Local storage** — PDFs are written directly into Clay (Urbit's filesystem) as `%mime` pages under `/books/<id>/pdf/mime`. Metadata lives in the agent state.
- **Federation** — ships subscribe to each other over Ames on the `/books` path. When a remote ship adds, removes, or edits a book, it broadcasts a `%alexandria-update` fact that all subscribers receive and merge locally. Books are keyed by `[source ship, id]` so there are no collisions.
- **HTTP bridge** — the agent binds `/alexandria` via Eyre so the frontend can POST raw PDF bytes and GET them back without going through the poke/scry system. `/apps/alexandria` is reserved for the Landscape docket/glob frontend.

The frontend is React + Vite, talking to the ship via `@urbit/http-api` for subscriptions/pokes and plain `fetch` for file transfers. In dev mode, Vite runs two separate instances proxied to two different fake ships so you can test federation locally in the browser.

State has been versioned once (`state-0` → `state-1`) to add content hashes (SHA-256 via `shay`). The upgrade path backfills hashes from Clay for locally hosted books.

## Running the full stack locally

You need two fake ships (`~zod` and `~bus`) running side by side.

**1. Boot the ships**

```bash
# in one terminal
./urbit -F zod

# in another
./urbit -F bus
```

By default `~zod` listens on port `8080` and `~bus` on port `80`. If your `~bus` is on a different port, set `BUS_URL` below.

**2. Install the app on both ships**

In each ship's dojo:

```
|new-desk %alexandria
|mount %alexandria
```

Copy the desk files into `zod/alexandria/` and `bus/alexandria/`, then in each dojo:

```
|commit %alexandria
|install our %alexandria
```

**3. Start the frontend**

```bash
cd web
yarn install
yarn dev
```

This starts two Vite servers in parallel:

| URL | Ship |
|-----|------|
| `zod.localhost:5173` | `~zod` |
| `bus.localhost:5174` | `~bus` |

Open both in the browser. You can upload a book on one ship, subscribe to it from the other, and watch the catalog sync in real time.

**Optional: override ship URLs**

```bash
ZOD_URL=http://localhost:8080 BUS_URL=http://localhost:8081 yarn dev
```

## Installing on `~hidrel`

The live app has two separate install steps:

1. Install the desk code.
2. Upload the frontend glob with `%docket`.

For first-time installation only:

```bash
make deploy-initial
make commit
```

Then in the dojo:

```hoon
|install our %alexandria
```

Build the glob payload locally:

```bash
make glob
```

Open `https://hidrel.thewendlings.com/docket/upload`, select desk `%alexandria`, and upload the `web/dist` folder. The Globulator writes the real `glob-ames` hash into `desk.docket-0` on the ship.

After that, normal code updates should use:

```bash
make deploy
make commit
```

Do not push `desk.docket-0` during normal deploys, or the Globulator hash can be reset to `0v0`.
