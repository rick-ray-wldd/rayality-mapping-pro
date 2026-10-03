# Rayality Mapping Pro

[Live editor](https://rayality-mapping-pro.vercel.app) · [Guide](https://rayality-mapping-pro.vercel.app/guide.html) · [Privacy](https://rayality-mapping-pro.vercel.app/privacy.html)

Open-source browser projection mapping. Import local images/video, align four
corners, project from a separate window, and export a portable project. **No API
key is needed for the core workflow.** Optional Google Veo generation requires
your own paid-billing key and is not part of the offline verification.

## English quick start

1. Open the editor in desktop Chrome/Edge. Use one editor per origin/profile.
2. **Layers → Add Quad → 16:9**. Open **Media**, upload a file or choose
   **Load Calibration Sample**, then click its checkmark to assign it.
3. Drag the surface to move it; drag a corner to warp it. Shift + corner drag
   scales around the center. Numeric transform controls are on the right.
4. Use the projector button → **Open Link Directly**. Move the output tab onto
   your extended display. Press **F** or double-click for fullscreen, **B** for
   blackout, **H** to hide the cursor. Keep the editor open.
5. Wait for **Saved locally**. Use **Export Project** for a backup containing
   media and geometry; **Import Project** restores it after confirmation.

Local media types: PNG/JPEG/GIF/WebP/SVG and MP4/WebM/Ogg. Playback depends on the
browser's codec support. Import/export is versioned JSON with embedded media,
limited to 100 MB. Large videos may exhaust browser storage or memory; keep your
original files. Clearing site data deletes the local project. Changing origins
or profiles does not transfer browser storage; export first.

## 繁體中文快速開始

1. 使用桌面版 Chrome／Edge 開啟網站，同一瀏覽器設定檔只開一個編輯端。
2. **Layers → Add Quad → 16:9**。進入 **Media** 匯入圖片／影片，或點選
   **Load Calibration Sample**，再按素材上的勾勾指派至已選取表面。
3. 拖動表面可平移；拖動四角可校正透視；Shift 加拖角可從中心等比縮放。
   右側可輸入位置、寬高及調整透明度。請避免四角交叉或壓成直線。
4. 按投影機按鈕 → **Open Link Directly**，把新分頁移到延伸螢幕。
   **F／雙擊**切換全螢幕、**B** 黑屏、**H** 隱藏游標；編輯端須保持開啟。
5. **Saved locally** 表示自動存檔完成；請用 **Export Project** 下載包含素材的
   備份。**Import Project** 經確認後還原。檔案上限 100 MB，不是雲端同步。

核心流程完全不需要 AI 金鑰。AI 是選用付費功能；儲存 key 不呼叫 API，按 Generate
才會將提示與參考圖片送到 Google，可能計費。key 存在分頁 sessionStorage，
不是加密保管庫，關閉分頁／瀏覽器的清除行為取決於工作階段還原設定。
清除網站資料或更換網域前請先備份專案。

## Browser and device limits / 瀏覽器限制

- Chromium is the automated validation target. Desktop Chrome/Edge are expected
  to work; installed Chrome video-output validation timed out in this environment,
  while an isolated Chromium run passed. Firefox/Safari are not validated.
- Document Picture-in-Picture is experimental and Chromium-dependent. Its window
  may not support fullscreen; use a manual output tab for the projector.
- HTTPS or localhost is required for relevant browser APIs. Serve built files
  over HTTP; do not double-click `index.html` using `file://`.
- Output preserves the logical 1920×1080 aspect ratio with letterboxing. Geometry
  and media changes synchronize; separate video players are **not frame-locked**.
- Keyboard/mouse desktop UI; small screens and touch editing are not optimized.
- Browser tests do not verify physical projector alignment, OS display routing,
  live paid Veo generation or real PiP hardware behavior.
- 實體投影設備、付費 Veo、跨瀏覽器及作業系統顯示器配置仍需人工排練。

## Development and reproducible build

Node **22.12+**, npm, and desktop Google Chrome for tests:

```sh
npm ci
npm run dev
npm run typecheck
npm run build
npm run check:bundle
npm test
npm run preview
```

`package-lock.json` pins the dependency tree. `dist/` is the complete static site,
including CSS, sample, guides and license notices; no Tailwind CDN is needed.
Tests launch a local preview on port 4317 and an isolated browser profile.
They default to installed Chrome; set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to an
existing Chromium/headless-shell executable to use a separate test browser. The
core test blocks external HTTP requests and spends no API credits.

```sh
GEMINI_API_KEY=RAYALITY_SECRET_SENTINEL_2026 npm run build
npm run check:bundle
node scripts/third-party.mjs
```

The fake-key check ensures build-time credentials cannot reach the app bundle.
Do not set any owner API key in deployment environment variables. Runtime BYOK
is an explicit user action. Never commit `.env*`, project exports or credentials.

## Release, licensing and advertising

Original source, documentation and the calibration sample: [MIT](LICENSE).
Existing branding/screenshots are excluded from that grant; see
[provenance and third-party notices](THIRD_PARTY_NOTICES.md). User media has its
own rights. Contributions: [CONTRIBUTING.md](CONTRIBUTING.md).

[Release/deployment procedure](docs/RELEASING.md) ·
[AdSense readiness plan](docs/MONETIZATION.md).

**Ads are disabled. No publisher ID, approval or revenue is claimed.** The guide
has a disabled placement scaffold; the editor and output never load advertising.
The existing deployment uses Vercel Hobby, whose non-commercial restriction must
be resolved before monetization. Ray must complete any required AdSense identity,
tax and payment setup personally. No new paid services are needed for this build.
