# CHANGELOG

## v51-match3-github-test

- 依照使用者提供的 v50 `index.html` 整合。
- 新增三消蒐集記憶碎片階段。
- 修改 `startGame()`：開始遊戲先進入三消，不直接進卡牌戰鬥。
- 新增 `startCardBattleFromMatch3(match3Bonus)`：三消完成後才建立原本卡牌戰鬥。
- 新增三消轉卡牌加成資料：起始手牌、開場格擋、噬憶獸開場削弱、能量上限。
- 保留 v50 主要 UI、卡牌、音效、階段戰鬥與結果畫面邏輯。
