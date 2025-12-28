"use strict";
/**
 * 週末イベントAPI
 * 04_API_SPEC.md セクション3 に準拠
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWeekendRouter = createWeekendRouter;
const express_1 = require("express");
function createWeekendRouter(repository) {
    const router = (0, express_1.Router)();
    /**
     * GET /api/weekend
     * 週末イベント取得
     */
    router.get('/', async (req, res) => {
        try {
            const userPref = {
                city: req.query.cities,
                pref: req.query.prefectures,
                ageRanges: req.query.ageRanges ? req.query.ageRanges.split(',') : undefined,
                indoorPreferred: req.query.indoorPreferred === 'true',
            };
            const events = await repository.listWeekendRecommendations(userPref);
            res.json({
                items: events,
                total: events.length,
            });
        }
        catch (error) {
            const errorMessage = error?.message || error?.toString() || String(error);
            res.status(500).json({ error: errorMessage });
        }
    });
    return router;
}
//# sourceMappingURL=weekend.js.map