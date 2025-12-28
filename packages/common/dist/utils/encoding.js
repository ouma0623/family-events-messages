"use strict";
/**
 * 文字コード判定・デコードユーティリティ
 * 16_MAPPING_RULES.md セクション5 に準拠
 */
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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectAndDecode = detectAndDecode;
exports.decodeBuffer = decodeBuffer;
exports.getEncodingFromXMLDeclaration = getEncodingFromXMLDeclaration;
const iconv = __importStar(require("iconv-lite"));
/**
 * 文字コードの候補（優先順位順）
 */
const ENCODINGS = ['utf-8', 'cp932'];
/**
 * UTF-8 BOMのバイト列
 */
const UTF8_BOM = Buffer.from([0xef, 0xbb, 0xbf]);
/**
 * バイト列から文字コードを判定してデコード
 * @param buffer バイト列
 * @returns デコードされた文字列と使用した文字コード
 */
function detectAndDecode(buffer) {
    // UTF-8 BOMをチェック
    if (buffer.length >= 3 && buffer.subarray(0, 3).equals(UTF8_BOM)) {
        try {
            const text = buffer.subarray(3).toString('utf-8');
            if (isValidText(text)) {
                return { text, encoding: 'utf-8-sig' };
            }
        }
        catch (error) {
            // 次のエンコーディングを試す
        }
    }
    // UTF-8（BOMなし）とShift-JISを試行
    for (const encoding of ENCODINGS) {
        try {
            let text;
            if (encoding === 'cp932') {
                // cp932はiconv-liteを使用
                text = iconv.decode(buffer, 'cp932');
            }
            else {
                // utf-8は標準のBuffer.toStringを使用
                text = buffer.toString(encoding);
            }
            // デコードが成功したか確認（不正な文字が含まれていないか）
            if (isValidText(text)) {
                return { text, encoding };
            }
        }
        catch (error) {
            // 次のエンコーディングを試す
            continue;
        }
    }
    throw new Error('Failed to detect encoding. Tried: utf-8-sig, utf-8, cp932');
}
/**
 * 指定されたエンコーディングでバッファをデコード
 * @param buffer バイト列
 * @param encoding 文字コード
 * @returns デコードされた文字列
 */
function decodeBuffer(buffer, encoding) {
    if (encoding === 'cp932') {
        return iconv.decode(buffer, 'cp932');
    }
    else if (encoding === 'utf-8-sig') {
        // UTF-8 BOMを除去
        if (buffer.length >= 3 && buffer.subarray(0, 3).equals(UTF8_BOM)) {
            return buffer.subarray(3).toString('utf-8');
        }
        return buffer.toString('utf-8');
    }
    else {
        return buffer.toString(encoding);
    }
}
/**
 * テキストが有効かどうか確認
 */
function isValidText(text) {
    // 基本的なチェック（制御文字が含まれていないか等）
    // より厳密なチェックが必要な場合は追加
    return text.length > 0 && !text.includes('\0');
}
/**
 * XML宣言から文字コードを取得
 * @param xmlText XML文字列
 * @returns 文字コード（見つからない場合はnull）
 */
function getEncodingFromXMLDeclaration(xmlText) {
    const match = xmlText.match(/<\?xml[^>]*encoding\s*=\s*["']([^"']+)["']/i);
    if (match) {
        const encoding = match[1].toLowerCase();
        // 一般的なエンコーディング名を正規化
        if (encoding === 'shift-jis' || encoding === 'shift_jis') {
            return 'cp932';
        }
        if (encoding === 'utf-8') {
            return 'utf-8';
        }
        return encoding;
    }
    return null;
}
//# sourceMappingURL=encoding.js.map