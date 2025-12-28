"use strict";
/**
 * 屋内/屋外判定
 * 08_RULE_TAGGING.md セクション5 に準拠
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.tagIndoorOutdoor = tagIndoorOutdoor;
/**
 * テキストを正規化
 */
function normalizeText(text) {
    return text.toLowerCase();
}
/**
 * 屋内/屋外を判定
 */
function tagIndoorOutdoor(event) {
    const description = event.description ? normalizeText(event.description) : '';
    const venueName = event.venueName ? normalizeText(event.venueName) : '';
    const allText = `${description} ${venueName}`;
    const indoorKeywords = [
        '屋内',
        'ホール',
        '館内',
        '室内',
        '体育館',
        '会議室',
        '多目的室',
        '展示室',
    ];
    const outdoorKeywords = ['屋外', '公園', '広場', '河川敷', '野外', 'キャンプ', '芝生'];
    let indoorCount = 0;
    let outdoorCount = 0;
    for (const keyword of indoorKeywords) {
        if (allText.includes(keyword)) {
            indoorCount++;
        }
    }
    for (const keyword of outdoorKeywords) {
        if (allText.includes(keyword)) {
            outdoorCount++;
        }
    }
    if (indoorCount > 0 && outdoorCount > 0) {
        return 'both';
    }
    if (indoorCount > 0) {
        return 'indoor';
    }
    if (outdoorCount > 0) {
        return 'outdoor';
    }
    return 'unknown';
}
//# sourceMappingURL=indoor.js.map