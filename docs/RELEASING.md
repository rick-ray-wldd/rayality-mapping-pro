# Releasing and deploying

1. Start from a reviewed commit. Use Node 22.12+ and `npm ci` (never copy an old
   node_modules directory into a release).
2. `npm run typecheck`; `npm run build`; `npm run check:bundle`; `npm test`.
   For key isolation use the fake-key command in README. No real API requests.
3. Run `node scripts/third-party.mjs` after dependency changes and rebuild so
   the notices are included. Inspect `git diff --check`, license changes, and
   dependency audit. `npm audit --omit=dev` must be reviewed independently from
   development-tool findings. Tailwind 3 currently inherits 5 high-severity
   development-only glob/brace findings; only trusted local source paths are
   compiled. Do not expose a build service to untrusted input. A Tailwind 4
   migration needs separate visual validation and is not silently forced here.
4. Run `python3 scripts/package.py` (Python 3 standard library) to create a static
   ZIP and SHA-256 in `release/`. It packages **only `dist/`** plus public docs,
   LICENSE/README and notices, with fixed archive timestamps.
   Never archive the whole checkout: it contains ignored local credentials.
5. For the existing Vercel project use the already authenticated CLI. Prefer
   the explicit `.vercelignore` exclusions to keep uploads limited to public code.
   `vercel --prod --yes` updates the existing site; do not create or upgrade a
   plan or add build-time API keys. Keep ads off on Hobby.
6. Check the production HTTPS URL without authentication. Fetch its actual JS
   asset and run secret-marker checks. Verify `/guide.html`, `/privacy.html`,
   `/samples/calibration.svg`, and `/third-party.txt` return the intended files.
   Run `TEST_BASE_URL=https://your-domain npm test` in a fresh context, inspect
   screenshots, and rehearse real projector/PiP behavior separately.
7. Commit public changes and push normally (never force). Tag a release only after
   passing checks; attach the static archive and record SHA-256. Publish release
   notes with unverified hardware/AI and advertising status explicitly stated.

The static build also works on another static HTTPS host. Before changing origin,
export projects in the old origin: IndexedDB and session storage do not migrate.
No server rewrites are needed: the output uses `#output`, and content pages are
real HTML. Roll back to a known prior deployment via the host after checking for
credential exposure; do not roll back to a build known to embed secrets.

Release 0.1.0 does not add PWA/service-worker caching. Offline verification means
local media and no third-party network dependency after local files are served,
not a guarantee that an uncached public site will open with no connection.
