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
    deleted: '削除しました',
  },
  errors: {
    saveFailed: '保存に失敗しました',
    loadFailed: '読み込みに失敗しました',
    deleteFailed: '削除に失敗しました',
    piiDetected: '個人情報の可能性がある内容が含まれています',
    rateLimit: '短時間に同じ場所へ投稿しています',
  },
};

export type MessageKey = keyof typeof messages;
