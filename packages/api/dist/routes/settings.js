"use strict";
/**
 * ユーザー設定API
 * 04_API_SPEC.md セクション4, 5 に準拠
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSettingsRouter = createSettingsRouter;
const express_1 = require("express");
/**
 * ユーザー設定（簡易実装、実際はDBに保存）
 */
const userSettings = new Map();
function createSettingsRouter() {
    const router = (0, express_1.Router)();
    /**
     * GET /api/users/me/settings
     * ユーザー設定取得
     */
    router.get('/', async (req, res) => {
        try {
            // TODO: 認証ミドルウェアからuserIdを取得
            const userId = req.userId || 'anonymous';
            const settings = userSettings.get(userId) || {
                notifyEnabled: false,
            };
            res.json(settings);
        }
        catch (error) {
            const errorMessage = error?.message || error?.toString() || String(error);
            res.status(500).json({ error: errorMessage });
        }
    });
    /**
     * POST /api/users/me/settings
     * ユーザー設定保存
     */
    router.post('/', async (req, res) => {
        try {
            // TODO: 認証ミドルウェアからuserIdを取得
            const userId = req.userId || 'anonymous';
            const settings = {
                ...req.body,
                notifyEnabled: req.body.notifyEnabled ?? false,
            };
            userSettings.set(userId, settings);
            res.json(settings);
        }
        catch (error) {
            const errorMessage = error?.message || error?.toString() || String(error);
            res.status(500).json({ error: errorMessage });
        }
    });
    return router;
}
//# sourceMappingURL=settings.js.map