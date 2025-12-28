/**
 * 文字コード判定・デコードユーティリティ
 * 16_MAPPING_RULES.md セクション5 に準拠
 */

import * as iconv from 'iconv-lite';

/**
 * 文字コードの候補（優先順位順）
 */
const ENCODINGS: Array<'utf-8' | 'cp932'> = ['utf-8', 'cp932'];

/**
 * UTF-8 BOMのバイト列
 */
const UTF8_BOM = Buffer.from([0xef, 0xbb, 0xbf]);

/**
 * バイト列から文字コードを判定してデコード
 * @param buffer バイト列
 * @returns デコードされた文字列と使用した文字コード
 */
export function detectAndDecode(buffer: Buffer): {
  text: string;
  encoding: string;
} {
  // UTF-8 BOMをチェック
  if (buffer.length >= 3 && buffer.subarray(0, 3).equals(UTF8_BOM)) {
    try {
      const text = buffer.subarray(3).toString('utf-8');
      if (isValidText(text)) {
        return { text, encoding: 'utf-8-sig' };
      }
    } catch (error) {
      // 次のエンコーディングを試す
    }
  }

  // UTF-8（BOMなし）とShift-JISを試行
  for (const encoding of ENCODINGS) {
    try {
      let text: string;
      if (encoding === 'cp932') {
        // cp932はiconv-liteを使用
        text = iconv.decode(buffer, 'cp932');
      } else {
        // utf-8は標準のBuffer.toStringを使用
        text = buffer.toString(encoding as BufferEncoding);
      }
      // デコードが成功したか確認（不正な文字が含まれていないか）
      if (isValidText(text)) {
        return { text, encoding };
      }
    } catch (error) {
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
export function decodeBuffer(buffer: Buffer, encoding: string): string {
  if (encoding === 'cp932') {
    return iconv.decode(buffer, 'cp932');
  } else if (encoding === 'utf-8-sig') {
    // UTF-8 BOMを除去
    if (buffer.length >= 3 && buffer.subarray(0, 3).equals(UTF8_BOM)) {
      return buffer.subarray(3).toString('utf-8');
    }
    return buffer.toString('utf-8');
  } else {
    return buffer.toString(encoding as BufferEncoding);
  }
}

/**
 * テキストが有効かどうか確認
 */
function isValidText(text: string): boolean {
  // 基本的なチェック（制御文字が含まれていないか等）
  // より厳密なチェックが必要な場合は追加
  return text.length > 0 && !text.includes('\0');
}

/**
 * XML宣言から文字コードを取得
 * @param xmlText XML文字列
 * @returns 文字コード（見つからない場合はnull）
 */
export function getEncodingFromXMLDeclaration(xmlText: string): string | null {
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
