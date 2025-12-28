"use strict";
/**
 * イベント検索API
 * 04_API_SPEC.md セクション1 に準拠
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEventsRouter = createEventsRouter;
const express_1 = require("express");
function createEventsRouter(repository) {
    const router = (0, express_1.Router)();
    /**
     * GET /api/events
     * イベント検索
     */
    router.get('/', async (req, res) => {
        try {
            const query = {
                city: req.query.cities,
                pref: req.query.prefectures,
                startDate: req.query.from ? `${req.query.from}T00:00:00+09:00` : undefined,
                endDate: req.query.to ? `${req.query.to}T23:59:59+09:00` : undefined,
                categories: req.query.categories ? req.query.categories.split(',') : undefined,
                indoorOutdoor: req.query.indoor,
                isFree: req.query.freeOnly === 'true' ? true : undefined,
                keyword: req.query.keyword,
                limit: req.query.limit ? parseInt(req.query.limit, 10) : 30,
                offset: req.query.offset ? parseInt(req.query.offset, 10) : 0,
            };
            const events = await repository.search(query);
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
    /**
     * GET /api/events/:id
     * イベント詳細
     */
    router.get('/:id', async (req, res) => {
        try {
            const event = await repository.getById(req.params.id);
            if (!event) {
                res.status(404).json({ error: 'Event not found' });
                return;
            }
            res.json(event);
        }
        catch (error) {
            const errorMessage = error?.message || error?.toString() || String(error);
            res.status(500).json({ error: errorMessage });
        }
    });
    return router;
}
//# sourceMappingURL=events.js.map