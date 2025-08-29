# さとまるマップ (Satomaru Map)

地域の記憶を2タップで地図に記録するマップアプリケーション

## プロジェクト構成

```
/satomaru-map
├─ apps/web            # Next.js + TS + MapLibre（フロント）
├─ services/api        # FastAPI（/pins, /export.csv）
├─ packages/ui         # 共通UI（ボタン/チップ/モーダル）
├─ packages/config     # 型・i18nキー・タグ定義の型
├─ seed/tags.json      # タグ初期データ
├─ docs/openapi.yaml   # API定義
├─ scripts/            # seed投入・CSV出力CLI
└─ .github/            # Issueテンプレ/CI
```

## 開発環境

- Frontend: React + TypeScript + MapLibre GL JS
- Backend: FastAPI + Python
- Database: In-memory (MVP)
- UI: Tailwind CSS + shadcn/ui

## 主要機能

- 2タップ投稿（タグ選択 → 地図タップ）
- レイヤー別タグ（住まい/暮らし/学び/遊び/その他）
- 公開範囲（パーソナル/グループ/パブリック）
- 地図上でのピン表示・フィルタリング
- CSV出力機能
