# Rayality Mapping Pro 

[English](#english) | [繁體中文](#traditional-chinese)

---

<a name="english"></a>
# 🇬🇧 Rayality Mapping Pro - Professional Web-Based Projection Mapping Tool

**Rayality Mapping Pro** is a cutting-edge, browser-based projection mapping application. It combines traditional geometric warping tools with modern Generative AI (Google Veo) to create dynamic textures instantly. Designed for artists, VJs, and event designers who need a lightweight, no-install solution.

## 🚀 Key Features

### 1. Geometric Warping & Surface Management
*   **Quad Surfaces**: Create rectangular, square, or circular projection surfaces.
*   **4-Point Corner Pinning**: Drag individual corners to match the projection surface to physical objects (Perspective Warping).
*   **Shift-Scaling**: Hold `Shift` while dragging a corner to scale the entire surface proportionally from the center.
*   **Layer Management**: Reorder, hide, lock, or delete surfaces via the "Layers" panel.
*   **Blending Modes**: Support for Screen, Multiply, Overlay, and Lighten modes for seamless compositing.

### 2. AI Video Generation (Google Veo)
*   **Text-to-Video**: Generate high-quality, loopable video textures using natural language prompts.
*   **Image-to-Video**: Upload a reference image to guide the video generation (structure preservation).
*   **Style Presets**: Built-in prompts optimized for projection mapping (e.g., Internal Energy, External Aura).
*   **BYOK (Bring Your Own Key)**: Securely use your own Google Gemini API Key. Keys are stored locally in your browser.

### 3. Media Library & Editor
*   **Drag & Drop Upload**: Support for MP4, WebM, PNG, JPG, and GIF.
*   **Video Trimming**: Non-destructive video timeline editing. Set custom Start and End times for playback loops.
*   **Auto-Looping**: Trimmed videos automatically loop seamlessly within the selected range.

### 4. Professional Output System
*   **Dual-Window Architecture**: Separate the Editor window from the Output window.
*   **Floating Window (PiP)**: Use the modern Document Picture-in-Picture API to create an always-on-top output window.
*   **Manual Output Mode**: Robust fallback for browsers that block popups. Simply open a new tab and switch it to "Receiver Mode".
*   **Auto-Scaling**: The output view automatically scales the canvas to fit any projector resolution (720p, 1080p, 4k) without distortion.
*   **Real-time Sync**: Instant synchronization between Editor and Output windows via BroadcastChannel and LocalStorage.

## 🎮 Controls & Shortcuts

| Action | Control |
| :--- | :--- |
| **Select Surface** | Left Click on Quad |
| **Move Surface** | Drag Surface Body |
| **Warp Corner** | Drag Corner Handle |
| **Scale from Center** | Hold `Shift` + Drag Corner |
| **Toggle Fullscreen** | Press `F` (in Output Window) |
| **Hide Cursor** | Press `H` (in Output Window) |
| **Blackout** | Press `B` (in Output Window) |
| **Zoom Canvas** | Mouse Wheel / Zoom Controls |
| **Pan Canvas** | Spacebar + Drag (Coming soon) |

## 🛠️ Getting Started

1.  **Open the App**: Launch `index.html` in a modern browser (Chrome/Edge recommended).
2.  **Setup AI**: Go to the **AI** tab (Sparkles icon) and paste your Google Gemini API Key.
3.  **Add Surface**: Click "Add Quad" in the **Layers** tab.
4.  **Assign Media**:
    *   Go to **Media** tab.
    *   Upload a file or Generate one with AI.
    *   Click the "Check" icon on a media card to assign it to the selected surface.
5.  **Edit Media**: Click the "Scissors" icon on a media card to trim video duration.
6.  **Launch Output**: Click the **Projector Icon** (bottom left).
    *   Choose **"Floating Window"** (if available) or **"Manual New Tab"**.
    *   Drag the output window to your projector.
    *   Click **"ENTER FULLSCREEN"** on the output window.

## ⚠️ Troubleshooting

*   **Popup Blocked**: If the output window doesn't open, use the "Manual New Tab" method. Copy the link, open a new tab, paste it, and click "ENTER RECEIVER MODE".
*   **Black Screen Video**: Ensure your network allows access to Google Cloud Storage. The app uses a direct URL method to bypass CORS issues.
*   **PiP Not Working**: Document PiP API is currently only supported in Chromium-based browsers (Chrome, Edge) on Desktop.

---

<a name="traditional-chinese"></a>
# 🇹🇼 Rayality Mapping Pro - 專業網頁版光雕投影工具

**Rayality Mapping Pro** 是一款基於網頁技術的專業投影映射應用程式。它結合了傳統的幾何變形工具與現代生成式 AI (Google Veo)，讓創作者能即時生成動態素材並投影到實體物體上。無需安裝任何軟體，打開瀏覽器即可開始創作。

## 🚀 主要功能

### 1. 幾何變形與表面管理 (Geometric Warping)
*   **四邊形表面 (Quad)**：支援新增 16:9、9:16、1:1 或圓形投影面。
*   **四點透視校正 (Corner Pinning)**：可獨立拖曳四個角落，將畫面精準對位到不規則的實體物體上。
*   **中心等比縮放**：按住 `Shift` 鍵拖曳角落，可相對於中心點進行等比縮放。
*   **圖層管理**：透過圖層面板調整前後順序、隱藏、鎖定或刪除表面。
*   **混合模式 (Blend Modes)**：支援 Screen (濾色)、Multiply (色彩增值) 等模式，方便進行影像疊加與去背。

### 2. AI 影片生成 (Google Veo)
*   **文字轉影片 (Text-to-Video)**：輸入提示詞，即時生成高品質、可無縫循環的影片素材。
*   **圖生影 (Image-to-Video)**：上傳參考圖片（如 Logo 或線稿），讓 AI 根據圖片結構生成動態效果。
*   **風格預設 (Presets)**：內建專為投影設計的提示詞（如：內部能量、外部光暈），確保生成結果邊緣乾淨。
*   **BYOK (自帶 Key)**：支援輸入您個人的 Google Gemini API Key，密鑰僅儲存於您的瀏覽器端，安全無虞。

### 3. 媒體庫與編輯器 (Media Editor)
*   **拖放上傳**：支援常見格式 MP4, WebM, PNG, JPG, GIF。
*   **影片剪輯 (Trimming)**：非破壞性時間軸編輯。可設定影片的「開始時間」與「結束時間」。
*   **自動循環**：設定好剪輯範圍後，影片會在該區段內自動循環播放。

### 4. 專業輸出系統 (Output System)
*   **雙視窗架構**：編輯畫面與投影輸出畫面完全分離。
*   **懸浮視窗 (PiP)**：利用最新的 Document Picture-in-Picture API，建立一個永遠置頂的預覽視窗，零延遲同步。
*   **手動分頁模式**：針對阻擋彈窗的瀏覽器提供的穩健備案。手動開啟新分頁並切換為「接收端模式 (Receiver Mode)」。
*   **自動縮放 (Auto-Scaling)**：輸出視窗會自動偵測投影機解析度，將畫布完美縮放至全螢幕，不會變形。
*   **即時同步**：透過 BroadcastChannel 與 LocalStorage 雙重機制，確保編輯端的任何操作（位移、換色、換影片）毫秒級同步到投影端。

## 🎮 操作與快捷鍵

| 動作 | 操作方式 |
| :--- | :--- |
| **選取表面** | 左鍵點擊 Quad |
| **移動表面** | 拖曳表面中心 |
| **變形角落** | 拖曳四個角落控制點 |
| **中心縮放** | 按住 `Shift` + 拖曳角落 |
| **切換全螢幕** | 按 `F` (在輸出視窗中) |
| **隱藏滑鼠** | 按 `H` (在輸出視窗中) |
| **黑屏 (Blackout)** | 按 `B` (在輸出視窗中) |
| **畫布縮放** | 滑鼠滾輪 / 右上角縮放按鈕 |

## 🛠️ 快速開始指南

1.  **開啟應用**：使用 Chrome 或 Edge 瀏覽器開啟網站。
2.  **設定 AI**：點擊左側 **AI** 分頁 (閃光圖示)，貼上您的 Google Gemini API Key。
3.  **新增表面**：在 **Layers** 分頁點擊 "Add Quad"，選擇您要的形狀。
4.  **指派素材**：
    *   切換到 **Media** 分頁。
    *   上傳影片或使用 AI 生成。
    *   點擊素材卡片上的 "勾勾 (Assign)" 圖示，將其貼到目前選取的表面上。
5.  **編輯素材**：點擊素材卡片上的 "剪刀 (Edit)" 圖示，調整影片播放範圍。
6.  **啟動投影**：點擊左下角的 **投影機圖示**。
    *   選擇 **"Floating Window"** (推薦) 或 **"Manual New Tab"**。
    *   將新視窗拖曳到投影機螢幕。
    *   在該視窗點擊 **"ENTER FULLSCREEN"**。

## ⚠️ 常見問題排除

*   **視窗被阻擋 (Popup Blocked)**：如果點擊啟動沒反應，請改用 "Manual New Tab" 模式。複製連結 -> 開新分頁 -> 貼上 -> 點擊 "ENTER RECEIVER MODE"。
*   **影片黑屏**：請確認您的網路環境可以存取 Google Cloud Storage。應用程式使用 Direct URL 方式讀取影片，這需要公開網路權限。
*   **PiP 按鈕無法點擊**：懸浮視窗 (PiP) 功能目前僅支援 Chromium 系列瀏覽器 (Chrome, Edge)，Firefox 或 Safari 請使用手動分頁模式。

---
**Rayality Mapping** © 2025