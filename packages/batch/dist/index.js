"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyHandler = exports.ingestHandler = void 0;
// Batch package entry point
__exportStar(require("./weekly-ingest"), exports);
__exportStar(require("./friday-notify"), exports);
var ingest_1 = require("./handlers/ingest");
Object.defineProperty(exports, "ingestHandler", { enumerable: true, get: function () { return ingest_1.handler; } });
var notify_1 = require("./handlers/notify");
Object.defineProperty(exports, "notifyHandler", { enumerable: true, get: function () { return notify_1.handler; } });
//# sourceMappingURL=index.js.map