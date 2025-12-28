---
name: "Action: Closeチェック（補助）"
about: "Plan Close前の最終チェック。必要なら作る。"
title: "[Action] Closeチェック：<テーマ/対応名>"
labels: ["phase:action"]
assignees: []
---

## 対象
- Plan Issue：#<親Issue番号>
- Notion：<URL>

---

## 1. Task完了確認
- [ ] 親PlanのTask表が全て✅になっている
- [ ] 子Task Issue が全てClose済み

---

## 2. docs更新確認
- [ ] docs/03_AI_KNOWLEDGE/knowledge.md 追記済み
- [ ] docs/02_OPERATIONS/runbook.md 追記済み
- [ ] docs/01_REQUIREMENTS/changes.md 追記済み
- [ ] docs/00_INDEX.md リンク更新済み

---

## 3. Notion更新確認
- [ ] notion-template構造で最終まとめが埋まっている
- [ ] Plan/Taskリンクが貼られている

---

## 4. Close宣言
- [ ] Plan Issue を更新した（実績/振り返り/改善）
- [ ] Plan Issue をCloseする
