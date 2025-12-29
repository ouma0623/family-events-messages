# データ比較：収集バッチ vs フロントエンド表示

## 1. 収集バッチから取得できているデータ（DynamoDB保存データ）

### 1.1 全カラム一覧（28カラム）

| カラム名 | データ型 | 説明 | 例 |
|---------|---------|------|-----|
| `eventId` | String | イベントID（一意キー） | `S8_WALKERPLUS:ar0623e17539` |
| `title` | String | イベントタイトル | `星が丘テラス ウインターイルミネーション2025` |
| `description` | String | イベント説明 | `愛知県名古屋市の星が丘テラスで毎年開催されるイルミネーション...` |
| `startAt` | String | 開始日時（ISO8601形式） | `2025-11-15T00:00:00+09:00` |
| `endAt` | String | 終了日時（ISO8601形式） | `2026-02-01T00:00:00+09:00` |
| `timeText` | String | 時間情報（テキスト） | `点灯時間 日没～22:30(予定)` |
| `venueName` | String | 会場名 | `星が丘テラス` |
| `venueAddress` | String | 会場住所 | `愛知県名古屋市千種区星が丘元町16-50` |
| `venueCity` | String | 会場市 | `愛知県名古屋市` |
| `venuePref` | String | 会場都道府県 | `愛知県` |
| `accessText` | String | アクセス情報 | `【電車】名古屋市営地下鉄星ヶ丘駅(6番出口)から徒歩1分` |
| `parkingText` | String | 駐車場情報 | `1200台 250円/30分、買物利用で30分～120分無料` |
| `contactTel` | String | 連絡先電話番号 | `052-781-1266` |
| `url` | String | 公式URL | `https://www.hoshigaoka-terrace.com/` |
| `imageUrls` | List[String] | 画像URLリスト | `["https://ms-cache.walkerplus.com/..."]` |
| `categories` | List[String] | カテゴリリスト | `["季節イベント（祭り・フェア）"]` |
| `category` | String | メインカテゴリ | `季節イベント（祭り・フェア）` |
| `sourceId` | String | ソースID | `S8_WALKERPLUS` |
| `sourceEventId` | String | ソース側のイベントID | `ar0623e17539` |
| `durationDays` | Number | 開催期間（日数） | `78` |
| `displayOrder` | Number | 表示順序 | `51` |
| `recommendScore` | Number | おすすめ度スコア | `50` |
| `recommendReasons` | List[String] | おすすめ理由リスト | `[]` |
| `dataConfidence` | Number | データ信頼度 | `0.9` |
| `isFree` | Boolean | 無料フラグ | （DynamoDBには保存されていないが、EventNormalized型には存在） |
| `priceText` | String | 料金情報 | （DynamoDBには保存されていないが、EventNormalized型には存在） |
| `applyStartAt` | String | 申込開始日時 | （DynamoDBには保存されていないが、EventNormalized型には存在） |
| `applyEndAt` | String | 申込終了日時 | （DynamoDBには保存されていないが、EventNormalized型には存在） |
| `raw` | Map | 生データ（JSON-LD + data.html） | （詳細な構造データ） |
| `ingestedAt` | String | 取り込み日時 | `2025-12-28T15:38:56.421Z` |
| `updatedAt` | String | 更新日時 | `2025-12-28T15:38:56.421Z` |
| `ttl` | Number | TTL（Time To Live） | `1772463600` |

### 1.2 生データ（raw）の構造

`raw`フィールドには、以下の構造で生データが保存されています：

```json
{
  "jsonLd": {
    "@type": "Event",
    "name": "イベント名",
    "description": "イベント説明",
    "startDate": "2025-11-15",
    "endDate": "2026-02-01",
    "location": {
      "name": "会場名",
      "address": {
        "streetAddress": "住所",
        "addressLocality": "市",
        "addressRegion": "都道府県"
      }
    },
    "image": "画像URL",
    "url": "公式URL",
    "telephone": "電話番号",
    "offers": {
      "price": "0",
      "priceCurrency": "JPY"
    }
  },
  "dataPage": {
    "venueName": "会場名",
    "venueAddress": "住所",
    "accessText": "アクセス情報",
    "parkingText": "駐車場情報",
    "timeText": "時間情報",
    "contactTel": "電話番号",
    "categories": ["カテゴリ"],
    "eventPeriod": "開催期間テキスト",
    "officialUrl": "公式URL",
    "viewPoint": "見どころ",
    "reservationText": "予約情報",
    "illuminationCount": "イルミネーション数",
    "nearStation": true/false
  }
}
```

---

## 2. フロントエンドで表示しているデータ

### 2.1 イベントカード（EventCard.tsx）で表示している項目

| 表示項目 | データソース | 表示形式 | 備考 |
|---------|------------|---------|------|
| **タイトル** | `event.title` | テキスト（2行まで） | `line-clamp-2` |
| **無料バッジ** | `event.isFree === true` | バッジ（💰 無料） | 条件付き表示 |
| **短期イベントバッジ** | `event.durationDays <= 3` | バッジ（⚡ N日間） | 条件付き表示 |
| **WalkerPlusバッジ** | `event.sourceId === 'S8_WALKERPLUS'` | バッジ（WalkerPlus） | 条件付き表示 |
| **説明** | `event.description` | テキスト（2行まで） | `line-clamp-2`、条件付き表示 |
| **開催日** | `event.startAt`, `event.endAt` | 日付フォーマット | 同日の場合は1日のみ、異なる場合は範囲表示 |
| **会場名** | `event.venueName` | テキスト（1行まで） | `line-clamp-1`、条件付き表示 |
| **会場市** | `event.venueCity` | テキスト | `unknown`の場合は非表示 |
| **カテゴリ** | `event.categories` | バッジ（最大2個） | 3個以上は`+N`表示 |
| **おすすめ度** | `event.recommendScore` | 数値表示 | スコアのみ表示 |

### 2.2 イベント詳細ページ（events/page.tsx）で表示している項目

| 表示項目 | データソース | 表示形式 | 備考 |
|---------|------------|---------|------|
| **タイトル** | `event.title` | 見出し（h1） | |
| **無料バッジ** | `event.isFree === true` | バッジ（💰 無料） | 条件付き表示 |
| **おすすめ度** | `event.recommendScore` | 数値表示 | |
| **カテゴリ** | `event.categories` | バッジ（全件表示） | |
| **イベント概要** | `event.description` | テキスト（改行保持） | `whitespace-pre-wrap` |
| **開催期間** | `event.startAt`, `event.endAt` | 日付フォーマット | 同日の場合は1日のみ、異なる場合は範囲表示 |
| **時間** | `event.timeText` | テキスト | 条件付き表示 |
| **開催期間（日数）** | `event.durationDays` | テキスト（N日間） | WalkerPlusイベントのみ、条件付き表示 |
| **会場名** | `event.venueName` | テキスト | 条件付き表示 |
| **住所** | `event.venueAddress` | テキスト | 条件付き表示 |
| **場所** | `event.venueCity` | テキスト | `unknown`の場合は非表示 |
| **料金** | `event.priceText` | テキスト | 条件付き表示 |
| **アクセス** | `event.accessText` | テキスト（改行保持） | `whitespace-pre-wrap`、条件付き表示 |
| **駐車場** | `event.parkingText` | テキスト（改行保持） | `whitespace-pre-wrap`、条件付き表示 |
| **申込期間** | `event.applyStartAt`, `event.applyEndAt` | 日付フォーマット | 条件付き表示 |
| **お問い合わせ** | `event.contactTel` | 電話リンク | `tel:`リンク付き、条件付き表示 |
| **公式サイトリンク** | `event.url` | 外部リンクボタン | `target="_blank"`、条件付き表示 |

---

## 3. データの比較と課題

### 3.1 収集バッチで取得できているが、フロントエンドで未使用のデータ

| データ項目 | DynamoDB保存 | EventNormalized型 | フロント表示 | 課題 |
|-----------|------------|------------------|------------|------|
| `imageUrls` | ✅ | ✅ | ❌ | **画像が表示されていない** |
| `recommendReasons` | ✅ | ✅ | ❌ | **おすすめ理由が表示されていない** |
| `dataConfidence` | ✅ | ✅ | ❌ | **データ信頼度が表示されていない** |
| `sourceEventId` | ✅ | ✅ | ❌ | **ソース側IDが表示されていない** |
| `displayOrder` | ✅ | ✅ | ❌ | **表示順序が使用されていない（ソートに使用されているが、表示されていない）** |
| `raw` | ✅ | ✅ | ❌ | **生データが表示されていない** |
| `ingestedAt` | ✅ | ✅ | ❌ | **取り込み日時が表示されていない** |
| `updatedAt` | ✅ | ✅ | ❌ | **更新日時が表示されていない** |

### 3.2 EventNormalized型に定義されているが、DynamoDBに保存されていないデータ

| データ項目 | EventNormalized型 | DynamoDB保存 | フロント表示 | 課題 |
|-----------|------------------|------------|------------|------|
| `isFree` | ✅ | ❌ | ✅（条件付き） | **DynamoDBに保存されていないため、常に未定義** |
| `priceText` | ✅ | ❌ | ✅（条件付き） | **DynamoDBに保存されていないため、常に未定義** |
| `applyStartAt` | ✅ | ❌ | ✅（条件付き） | **DynamoDBに保存されていないため、常に未定義** |
| `applyEndAt` | ✅ | ❌ | ✅（条件付き） | **DynamoDBに保存されていないため、常に未定義** |

### 3.3 フロントエンドの表示の課題

1. **画像が表示されていない**
   - `imageUrls`が取得できているが、フロントエンドで表示されていない
   - イベントカードや詳細ページに画像がない

2. **おすすめ理由が表示されていない**
   - `recommendReasons`が取得できているが、フロントエンドで表示されていない
   - おすすめ度スコアのみ表示されている

3. **データ信頼度が表示されていない**
   - `dataConfidence`が取得できているが、フロントエンドで表示されていない
   - データの品質がユーザーに伝わらない

4. **料金情報が表示されない**
   - `priceText`がEventNormalized型に定義されているが、DynamoDBに保存されていない
   - フロントエンドでは条件付き表示だが、常に未定義のため表示されない

5. **無料フラグが機能しない**
   - `isFree`がEventNormalized型に定義されているが、DynamoDBに保存されていない
   - フロントエンドでは条件付き表示だが、常に未定義のため表示されない

6. **申込期間が表示されない**
   - `applyStartAt`、`applyEndAt`がEventNormalized型に定義されているが、DynamoDBに保存されていない
   - フロントエンドでは条件付き表示だが、常に未定義のため表示されない

7. **生データ（raw）が活用されていない**
   - `raw`フィールドに詳細な情報が保存されているが、フロントエンドで使用されていない
   - 例：`raw.dataPage.viewPoint`（見どころ）、`raw.dataPage.reservationText`（予約情報）など

---

## 4. 改善提案

### 4.1 優先度：高

1. **画像の表示**
   - `imageUrls`をイベントカードと詳細ページに表示
   - 画像がない場合のフォールバック画像を用意

2. **料金情報の取得と表示**
   - `raw.jsonLd.offers.price`から`priceText`を生成
   - `raw.jsonLd.offers.price === "0"`の場合は`isFree = true`を設定
   - DynamoDB保存時に`priceText`と`isFree`を設定

3. **無料フラグの設定**
   - `raw.jsonLd.offers.price === "0"`の場合は`isFree = true`を設定
   - DynamoDB保存時に`isFree`を設定

### 4.2 優先度：中

4. **おすすめ理由の表示**
   - `recommendReasons`を詳細ページに表示
   - おすすめ度スコアと一緒に表示

5. **生データの活用**
   - `raw.dataPage.viewPoint`（見どころ）を詳細ページに表示
   - `raw.dataPage.reservationText`（予約情報）を詳細ページに表示

6. **データ信頼度の表示**
   - `dataConfidence`を詳細ページに表示（開発者向けまたは詳細表示）

### 4.3 優先度：低

7. **申込期間の取得と表示**
   - `raw`から申込期間を抽出して`applyStartAt`、`applyEndAt`を設定
   - DynamoDB保存時に設定

8. **メタデータの表示**
   - `ingestedAt`、`updatedAt`を詳細ページに表示（開発者向けまたは詳細表示）
   - `sourceEventId`を詳細ページに表示（開発者向けまたは詳細表示）

---

## 5. 次のステップ

この比較結果を基に、`/Plan`フェーズで以下を検討：

1. **フロントエンドの表示改善**
   - 画像表示の実装
   - 料金情報・無料フラグの表示改善
   - おすすめ理由の表示
   - 生データの活用

2. **データ収集バッチの改善**
   - `priceText`、`isFree`の生成と保存
   - `applyStartAt`、`applyEndAt`の生成と保存

3. **データ構造の最適化**
   - DynamoDB保存時のデータ正規化
   - 不要なデータの削除または圧縮

