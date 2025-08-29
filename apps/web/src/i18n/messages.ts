export const messages = {
  app: {
    title: 'さとまるマップ',
  },
  layers: {
    sumai: '住まい',
    kurashi: '暮らし',
    manabi: '学び',
    asobi: '遊び',
    other: 'その他',
  },
  visibility: {
    personal: 'パーソナル',
    group: 'グループ',
    public: 'パブリック',
  },
  actions: {
    save: '保存',
    cancel: 'キャンセル',
    edit: '編集',
    delete: '削除',
    close: '閉じる',
  },
  messages: {
    saved: '保存しました：公開={{visibility}}',
    selectTagFirst: 'まずタグを選択してください',
    noteOptional: 'メモ（任意）',
    selectVisibility: '公開範囲を選択',
  },
  errors: {
    saveFailed: '保存に失敗しました',
    loadFailed: '読み込みに失敗しました',
  },
};

export type MessageKey = keyof typeof messages;
