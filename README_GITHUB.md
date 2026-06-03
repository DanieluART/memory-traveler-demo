memory_traveler_github_pages_v38

# 記憶旅人 Mobile DEMO v37

這是 **GitHub Pages 專用版本**。  
本版以手機與行動裝置介面為主，使用純靜態檔案，不需要 Node build、不需要 Vercel。

## 檔案結構

```text
index.html      # GitHub Pages 入口
style.css       # 手機優先版樣式
game.js         # 遊戲邏輯
assets/         # 全部遊戲美術與卡牌資產
.nojekyll       # 停用 Jekyll，讓靜態資產直接被 GitHub Pages 讀取
```

## GitHub Pages 上傳方式

### 方法 A：直接上傳到 GitHub 網頁介面

1. 在 GitHub 建立新 repository。
2. 將本資料夾中的所有檔案上傳到 repository 根目錄。
3. 進入 repository 的 `Settings`。
4. 進入 `Pages`。
5. Source 選擇 `Deploy from a branch`。
6. Branch 選擇 `main`，資料夾選 `/ root`。
7. 儲存後等待 GitHub Pages 部署完成。

完成後網址通常會是：

```text
https://你的帳號.github.io/你的repository名稱/
```

## 本機測試

直接開啟：

```text
index.html
```

或使用簡單靜態伺服器：

```bash
python -m http.server 8000
```

然後開啟：

```text
http://localhost:8000
```

## 注意事項

- 請不要只上傳 `index.html`，必須連同 `assets/`、`style.css`、`game.js` 一起上傳。
- 若圖片無法顯示，通常是 `assets/` 沒有一起上傳，或資料夾層級不正確。
- 本版本不需要 `package.json`、`vercel.json` 或任何 build command。
