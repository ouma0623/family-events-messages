"use strict";
/**
 * フェッチャーファクトリー
 * Phase8: WalkerPlus（HTML）のみ対応
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HtmlFetcher = exports.BaseFetcher = void 0;
exports.createFetcher = createFetcher;
const base_1 = require("./base");
Object.defineProperty(exports, "BaseFetcher", { enumerable: true, get: function () { return base_1.BaseFetcher; } });
const html_1 = require("./html");
Object.defineProperty(exports, "HtmlFetcher", { enumerable: true, get: function () { return html_1.HtmlFetcher; } });
/**
 * ソースに応じたフェッチャーを生成
 */
function createFetcher(source) {
    if (source.format === 'html') {
        return new html_1.HtmlFetcher(source);
    }
    throw new Error(`Unsupported format: ${source.format}`);
}
//# sourceMappingURL=index.js.map