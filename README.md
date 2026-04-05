# imMBA 網站

## 公告資料（雙語單一檔）

- **`data/announcements.json`**：每筆含 `titleZh`、`titleEn`、`urlZh`、`urlEn`、`date`、`isTop`、`id`
- **`assets/announcements-embed.js`**：與上列相同內容，供 `fetch` 失敗（如 `file://`）時後援
- 中文／英文首頁與公告頁皆讀**同一檔**，依語系顯示對應欄位（`assets/announcements-feed.js`）

## 公告後台（純 HTML，免 Node）

開啟 **`admin/index.html`**（本機伺服器或 Live Server，例如 `http://localhost:3000/admin/`）。

- **介面**：頂部藍色標題區、雙欄卡片表單（中文／英文標題與連結）、粉紅色「新增／儲存」、「自動翻譯英文」、「批次補齊空白英文」、底部「重新匯入官網清單」「匯出」「清空」。（使用 Tailwind CDN）
- **localStorage 鍵名**：`vibe2026_immba_announcements`（若曾使用舊鍵會自動遷移一次）
- **翻譯**：MyMemory 免費 API（`zh→en`），僅供參考請自行校稿
- **連結**：儲存前驗證 `http(s)` 格式或留空
- 匯出 **`announcements.json`** 覆蓋 **`data/announcements.json`**，並同步 **`assets/announcements-embed.js`**（或僅用 `http` 讀 JSON）

---

## 選用：Node 伺服器（`npm start`）

```bash
npm install
npm start
```

瀏覽：http://localhost:3000/index.html  

（後台已改為純 HTML，不依賴 Node API。）

## 環境變數（僅在使用 `server/index.js` 時）

| 變數 | 說明 | 預設 |
|------|------|------|
| `PORT` | 埠號 | `3000` |
