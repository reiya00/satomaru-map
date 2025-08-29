import { TagData } from '../types';

export const tagData: TagData = {
  "layers": [
    { "key": "sumai",  "name": "住まい",  "order": 1 },
    { "key": "kurashi","name": "暮らし", "order": 2 },
    { "key": "manabi", "name": "学び",  "order": 3 },
    { "key": "asobi",  "name": "遊び",  "order": 4 },
    { "key": "other",  "name": "その他", "order": 5 }
  ],
  "tags": {
    "sumai": [
      { "key": "akiya_hint",   "label": "あそこが空き家" },
      { "key": "dokukyo",      "label": "独居の方の家" },
      { "key": "renov_need",   "label": "修繕が必要そう" },
      { "key": "sora_chiseki", "label": "空き地っぽい" },
      { "key": "kagi_fuan",    "label": "鍵が心配" },
      { "key": "ameyadori",    "label": "雨漏りかも" },
      { "key": "kusa_shigeru", "label": "草木が茂ってる" },
      { "key": "hikari_mado",  "label": "昼でも暗い家" },
      { "key": "pets_ki",      "label": "動物の気配" },
      { "key": "oto_nashi",    "label": "人の気配がない" },
      { "key": "kanban_ochi",  "label": "表札が外れてる" },
      { "key": "souko",        "label": "納屋/倉庫" }
    ],
    "kurashi": [
      { "key": "bousai_spot", "label": "防災の集合場所" },
      { "key": "machi_help",  "label": "手助けが必要" },
      { "key": "gomi_basho",  "label": "ごみ置き場" },
      { "key": "miuchi_batake","label": "うちの畑" },
      { "key": "mizuba",      "label": "水場・井戸" },
      { "key": "henro",       "label": "よく通る道" },
      { "key": "yasumi_doko", "label": "いつも休む場所" },
      { "key": "kouban",      "label": "見守りポイント" },
      { "key": "kosodate",    "label": "子育てスポット" },
      { "key": "kaimono",     "label": "買い物しやすい" },
      { "key": "fureai",      "label": "ご近所の憩い" }
    ],
    "manabi": [
      { "key": "kiseki",     "label": "地域の歴史" },
      { "key": "shizen",     "label": "自然の学び" },
      { "key": "denketsu",   "label": "口伝・昔話" },
      { "key": "bunka",      "label": "民俗/祭事" },
      { "key": "shokubutsu", "label": "植物メモ" },
      { "key": "chiri",      "label": "地形の気づき" },
      { "key": "sanpai",     "label": "祈りの場所" },
      { "key": "kinenseki",  "label": "記念碑/石仏" },
      { "key": "gakkou_ato", "label": "学校の跡" },
      { "key": "kouba_ato",  "label": "工場の跡" }
    ],
    "asobi": [
      { "key": "kankou",     "label": "観光の見どころ" },
      { "key": "event_memo", "label": "イベントの思い出" },
      { "key": "keshiki",    "label": "景色がいい" },
      { "key": "hinan_bi",   "label": "日の出/日の入り" },
      { "key": "asobi_ba",   "label": "子どもの遊び場" },
      { "key": "sanpo",      "label": "散歩コース" },
      { "key": "taberu",     "label": "好きなごはん" },
      { "key": "onssen",     "label": "温泉/入浴" },
      { "key": "camp",       "label": "キャンプできそう" }
    ],
    "other": [
      { "key": "my_memory",  "label": "わざわざ言わない私の思い出" },
      { "key": "todo_check", "label": "やることメモ" },
      { "key": "lost_found", "label": "落とし物/忘れ物" }
    ]
  }
};
