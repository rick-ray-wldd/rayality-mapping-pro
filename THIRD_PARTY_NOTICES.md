# Rights and provenance audit — 2026-10-03

The repository history has one original contributor; the project documentation
identifies Ray Tsai as the author. The owner has authorized open-source release.
The original TypeScript application and new documentation are released under MIT.
There was no pre-existing LICENSE. This is a source/provenance review, not a
claim that every historical asset's authorship has been independently proven.

- `public/samples/calibration.svg`: authored in this release from geometric
  primitives and labels; MIT, no external footage or font files.
- `public/samples/solid.webm`: synthetic two-second solid cyan video generated
  with FFmpeg color source and libvpx; no captured or third-party footage; MIT.
  Recipe: `ffmpeg -f lavfi -i color=c=0x22d3ee:s=160x90:r=10 -t 2 -c:v libvpx -an solid.webm`.
- Existing `Rayality_logo.png`, `Rayality_full_logo.png` and historical screenshots:
  provenance is not documented independently; retained as project branding and
  excluded from the MIT grant. Forks should replace branding. No trademark grant.
- Removed remote transparenttextures.com patterns, which had no bundled notice.
- Replaced the remote Tailwind runtime with locally built CSS.
- React/react-dom, lucide-react, Google GenAI and transitive runtime packages retain
  their own MIT, ISC, Apache-2.0, BSD or other package license terms. Generated
  [full production package notices](public/third-party.txt) ship with the website.
  Regenerate with `node scripts/third-party.mjs` after lockfile changes.
- User-imported media and Google-generated media are not licensed by this project.
  Their users must determine applicable rights and provider terms.

No third-party demonstration images or videos are included. MIT permits commercial
forks without source-sharing obligations; it does not grant exclusive control over
future forks or their ad revenue. AdSense approval is separate from code licensing.
