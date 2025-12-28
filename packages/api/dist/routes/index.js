"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApiRouter = createApiRouter;
const express_1 = require("express");
const events_1 = require("./events");
const weekend_1 = require("./weekend");
const settings_1 = require("./settings");
const line_1 = require("./line");
const auth_1 = require("../middleware/auth");
/**
 * APIルーターを作成
 */
function createApiRouter(repository) {
    const router = (0, express_1.Router)();
    // イベント検索API（認証不要）
    router.use('/events', (0, events_1.createEventsRouter)(repository));
    // 週末イベントAPI（認証不要）
    router.use('/weekend', (0, weekend_1.createWeekendRouter)(repository));
    // ユーザー設定API（認証必要）
    router.use('/users/me/settings', auth_1.authenticate, (0, settings_1.createSettingsRouter)());
    // LINE連携API（認証必要）
    router.use('/line', auth_1.authenticate, (0, line_1.createLineRouter)());
    return router;
}
//# sourceMappingURL=index.js.map