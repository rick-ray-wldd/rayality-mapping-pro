# Contributing

Use Node 22.12+ and `npm ci`. Run `npm run build`, `npm run check:bundle`, and
`npm test` before proposing a change. Browser tests use installed desktop Chrome;
install Chrome or adjust the Playwright channel for your environment.

Keep the editor and projection output independent. Never put ads or navigation
in the output. Do not introduce environment-based API keys or commit `.env`,
credentials, personal project exports, or deployment account settings. Use fake
keys and locally authored fixtures in tests; do not spend model API credits.

Open an issue describing the user-visible problem, then a focused pull request
with steps to reproduce, validation, and screenshots for UI changes. Contributions
must be yours to license under MIT; identify any third-party assets and licenses.
Do not include copyrighted demo footage without permission.

繁體中文：請先描述問題與重現步驟，再提交範圍明確的 PR。不得提交金鑰、私人
專案或無授權素材；請附測試結果。核心功能測試不需要 AI 金鑰或付費 API。
