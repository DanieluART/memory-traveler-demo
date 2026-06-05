# CHANGELOG

## v52-match3-goal-polish

- 提高三消完成目標：人物記憶 10、建築記憶 10、光之碎片 6。
- 三消剩餘步數調整為 30 步。
- 消除碎片時新增閃爍、發光外框與消散動畫。
- 三消達標後新增完成提示 Dialog。
- 完成提示內會顯示本局蒐集到的人物記憶、建築記憶、光之碎片數量。
- 玩家需點擊「前進下一關：卡牌戰鬥」才會進入原本卡牌戰鬥。
- 保留 v51 三消轉卡牌加成與 v50 卡牌戰鬥邏輯。

## v51-match3-github-test

- 依照使用者提供的 v50 `index.html` 整合。
- 新增三消蒐集記憶碎片階段。
- 修改 `startGame()`：開始遊戲先進入三消，不直接進卡牌戰鬥。
- 新增 `startCardBattleFromMatch3(match3Bonus)`：三消完成後才建立原本卡牌戰鬥。
- 新增三消轉卡牌加成資料：起始手牌、開場格擋、噬憶獸開場削弱、能量上限。
- 保留 v50 主要 UI、卡牌、音效、階段戰鬥與結果畫面邏輯。


## v53 - Match-3 Art & Audio Polish

- Improved match-3 tile art with lightweight SVG assets.
- Added dedicated clear, combo, and objective-complete sound effects using Web Audio.
- Enhanced tile clear sparkle and board flash animation.
- Added completion dialog glow/pop visual treatment.


## v54 - Card battle UI restore
- 修正 v53 加入三消後，卡牌戰鬥畫面資訊列在部分螢幕寬度下直向堆疊。
- 將卡牌戰鬥 HUD、階段/靈感/侵蝕/抽牌/棄牌資訊列恢復為橫向一行。
- 壓縮上方標題列與夥伴技能列高度，避免遮擋戰鬥場景與手牌區。
- 此修正僅作用於 #gameScreen，不影響三消流程、美術元件、消除音效與完成提示。


## v55 BGM 更新
- 新增 3 首背景音樂檔案至 `assets/audio/`。
- `00Luke Bergs - Aurora`：開場故事與三消遊戲循環播放。
- `01Aylex - Live It`：卡牌戰鬥第 1、2 階段循環播放。
- `02Aylex - Where We Belong`：卡牌戰鬥第 3 階段循環播放。
- 背景音樂音量設定為 24%，低於音效回饋，避免壓過消除、完成與戰鬥音效。
