/**
 * サーバー起動スクリプト
 */

import { createApp } from './app';
import { MemoryEventRepository } from './repositories';

const PORT = process.env.PORT || 3000;

// Repositoryの初期化
const repository = new MemoryEventRepository();

// Expressアプリケーションを作成
const app = createApp(repository);

// サーバー起動
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
