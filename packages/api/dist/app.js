"use strict";
/**
 * Expressアプリケーション
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const routes_1 = require("./routes");
/**
 * Expressアプリケーションを作成
 */
function createApp(repository) {
    const app = (0, express_1.default)();
    // JSONパーサー
    app.use(express_1.default.json());
    // CORS設定（開発用）
    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        if (req.method === 'OPTIONS') {
            res.sendStatus(200);
        }
        else {
            next();
        }
    });
    // APIルーター
    app.use('/api', (0, routes_1.createApiRouter)(repository));
    // ヘルスチェック
    app.get('/health', (req, res) => {
        res.json({ status: 'ok' });
    });
    return app;
}
//# sourceMappingURL=app.js.map