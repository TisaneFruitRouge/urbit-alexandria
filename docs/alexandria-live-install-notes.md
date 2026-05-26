# Alexandria Live Install Notes

Date: 2026-05-26

## Problem

The Alexandria desk installed on `~hidrel`, but the frontend did not load from:

```text
https://hidrel.thewendlings.com/apps/alexandria/
```

Instead, that URL returned the Gall agent health marker:

```text
alexandria-agent BUILD-MARKER-0526 ok
```

This showed that `/apps/alexandria/` was being handled by the backend Gall agent instead of Landscape/Docket serving the uploaded glob.

## Root Cause

The backend agent had previously bound Eyre routes under `/apps/alexandria`. That path should be reserved for the frontend glob installed through Docket.

Correct route ownership:

```text
/alexandria/               backend Gall agent API
/alexandria/upload         backend PDF upload endpoint
/alexandria/download       backend PDF download endpoint
/apps/alexandria/          Landscape/Docket frontend glob
/apps/alexandria/index.html frontend entrypoint
```

The app and the glob were competing for the same `/apps/alexandria` route.

## Failed Intermediate Fix

We tried adding a redirect from the stale agent route:

```hoon
(redirect-reply:do id "/apps/alexandria/index.html")
```

That caused:

```text
[%error-building /app/alexandria/hoon]
```

The exact Hoon issue was that double quotes create a tape, while `redirect-reply` expected a cord. The fixed form is:

```hoon
(redirect-reply:do id '/apps/alexandria/index.html')
```

The redirect response body/header shape also had to match what Eyre expects:

```hoon
[[307 ['location' loc]~] ~]
```

## Final Fix

The agent now disconnects the old `/apps/alexandria` Eyre bindings and binds the backend only under `/alexandria`.

Because the stale `/apps/alexandria` route can still hit the running agent until Eyre fully drops it, the agent redirects any request whose first two path segments are `apps` and `alexandria`:

```text
307 Location: /apps/alexandria/index.html
```

The path check had to be broad enough to catch `/apps/alexandria/` and related paths, not only an exact two-segment match.

## Deployment Commands

Normal code deploy:

```bash
make deploy
```

Then in the Urbit dojo:

```hoon
|commit %alexandria
```

Do not use `make commit` until its HTTP/Lens helper is fixed; it can return a generic `500` and hide the real dojo compiler output.

Build the frontend glob:

```bash
make glob
```

Upload `web/dist` through:

```text
https://hidrel.thewendlings.com/docket/upload
```

Do not run `make deploy-initial` after the glob is uploaded, because it can overwrite `desk.docket-0` and reset the glob hash.

## Verification

Backend marker:

```bash
curl -i https://hidrel.thewendlings.com/alexandria/
```

Expected body:

```text
alexandria-agent BUILD-MARKER-0526-redirect ok
```

Frontend route redirect:

```bash
curl -i https://hidrel.thewendlings.com/apps/alexandria/
```

Expected status/header:

```text
HTTP/2 307
location: /apps/alexandria/index.html
```

Frontend entrypoint:

```bash
curl -i https://hidrel.thewendlings.com/apps/alexandria/index.html
```

Unauthenticated `curl` may return `403 unauthorized`; browser access should work when logged into the ship.
