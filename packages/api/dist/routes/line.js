"use strict";
/**
 * LINE連携API
 * 07_LINE_NOTIFICATION.md に準拠
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLineRouter = createLineRouter;
const express_1 = require("express");
function createLineRouter() {
    const router = (0, express_1.Router)();
    /**
     * POST /api/line/link
     * LINE連携
     */
    router.post('/link', async (req, res) => {
        try {
            // TODO: LINE Login OAuth処理
            // 1. 認可コードを受け取る
            // 2. LINE Access Tokenを取得
            // 3. LINE User IDを取得
            // 4. ユーザー設定にlineUserIdを保存
            const { code } = req.body;
            if (!code) {
                res.status(400).json({ error: 'Authorization code is required' });
                return;
            }
            // TODO: 実際のLINE Login処理を実装
            // const lineUserId = await getLineUserId(code);
            // await saveLineUserId(userId, lineUserId);
            res.json({
                success: true,
                message: 'LINE連携が完了しました',
            });
        }
        catch (error) {
            const errorMessage = error?.message || error?.toString() || String(error);
            res.status(500).json({ error: errorMessage });
        }
    });
    return router;
}
//# sourceMappingURL=line.js.map