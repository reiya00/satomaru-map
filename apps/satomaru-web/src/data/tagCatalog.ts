import type { TagDef } from "../types/tag";

export const TAGS: Record<string, TagDef[]> = {
  // 住まい
  sumai: [
    { key: 'akiya',    label: '空き家である',           layer: 'sumai' },
    { key: 'dokyo',    label: '独居の人が住んでいる',   layer: 'sumai' },
    { key: 'uriboshu', label: '売却希望/検討中',        layer: 'sumai' },
    { key: 'chintai',  label: '賃貸可能性あり',         layer: 'sumai' },
    { key: 'roukyu',   label: '老朽化が進んでいる',     layer: 'sumai' },
    { key: 'akichi',   label: '空き地である',           layer: 'sumai' },
    { key: 'amamori',  label: '雨漏りの懸念',           layer: 'sumai' },
    { key: 'niwa',     label: '庭の手入れが必要',       layer: 'sumai' },
    { key: 'ido',      label: '井戸がある',             layer: 'sumai' },
  ],
  // 暮らし
  kurashi: [
    { key: 'gomiba',   label: 'ごみ集積所',             layer: 'kurashi' },
    { key: 'jidouhan', label: '移動販売が来る',         layer: 'kurashi' },
    { key: 'bouhan',   label: '防犯上の懸念',           layer: 'kurashi' },
    { key: 'kyotsu',   label: '共同菜園',               layer: 'kurashi' },
    { key: 'toilet',   label: '公衆トイレ',             layer: 'kurashi' },
    { key: 'kaigi',    label: '集会所',                 layer: 'kurashi' },
    { key: 'mihamori', label: '見守りが必要',           layer: 'kurashi' },
  ],
  // 学び
  manabi: [
    { key: 'rekichi',  label: '歴史的建物',             layer: 'manabi' },
    { key: 'densho',   label: '口伝/昔話の場所',        layer: 'manabi' },
    { key: 'shiseki',  label: '史跡',                   layer: 'manabi' },
    { key: 'shizen',   label: '自然観察ポイント',       layer: 'manabi' },
    { key: 'taiken',   label: '地場産業体験',           layer: 'manabi' },
    { key: 'gakkoato', label: '学校の跡',               layer: 'manabi' },
  ],
  // 遊び（関わり相当は asobi に割当て）
  asobi: [
    { key: 'vol',      label: 'ボランティア募集',        layer: 'asobi' },
    { key: 'event',    label: '地域行事',                layer: 'asobi' },
    { key: 'share',    label: 'おすそ分けスポット',      layer: 'asobi' },
    { key: 'hub',      label: '交流拠点',                layer: 'asobi' },
    { key: 'iju',      label: '移住相談窓口',            layer: 'asobi' },
    { key: 'keyshop',  label: '鍵預かり店',              layer: 'asobi' },
    { key: 'senpai',   label: 'キーマン/センパイ',        layer: 'asobi' },
  ],
  // その他
  other: [
    { key: 'mem',      label: '私の思い出',              layer: 'other' },
    { key: 'view',     label: 'ビューポイント',          layer: 'other' },
    { key: 'quiet',    label: '静かな場所',              layer: 'other' },
    { key: 'unclass',  label: '無分類',                  layer: 'other' },
  ],
};

// 互換エイリアス
export const TAGS_BY_LAYER = TAGS;
