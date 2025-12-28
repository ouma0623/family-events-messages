"use strict";
/**
 * サーバー起動スクリプト
 */
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const repositories_1 = require("./repositories");
const PORT = process.env.PORT || 3000;
// Repositoryの初期化
const repository = new repositories_1.MemoryEventRepository();
// Expressアプリケーションを作成
const app = (0, app_1.createApp)(repository);
// サーバー起動
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
//# sourceMappingURL=server.js.map