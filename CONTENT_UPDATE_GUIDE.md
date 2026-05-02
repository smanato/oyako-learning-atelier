# AI教育ラボ Members コンテンツ更新ガイド

Claude Code側で更新する主ファイルは `content.js` です。ページ構成やナビゲーションは `shell.js`、見た目は `styles.css` に分かれています。

## ページ構成

- `index.html`: ホーム
- `library.html`: 教材
- `start.html`: はじめてガイド
- `rescue.html`: 悩み別レスキュー
- `questions.html`: アンケート質問から作った解決策
- `prompts.html`: プロンプト集
- `age-prompts.html`: 幼稚園生から大学4年までの年齢別プロンプト
- `tools.html`: ツール設定
- `live.html`: Zoom・質問
- `rules.html`: ルール・安心

ナビはテキストアンカーではなく、各HTMLページへ移動します。

## プロンプトを追加する

1. `prompts` に新しい key を追加します。
2. `promptCards` に同じ key の表示ボタンを追加します。

```js
prompts: {
  newPromptKey: {
    title: "表示タイトル",
    body: `ここにプロンプト本文`
  }
}
```

```js
promptCards: [
  { key: "newPromptKey", category: "study", label: "表示名" }
]
```

`category` は以下を使います。

- `study`: 教科学習、教材活用
- `system`: AIの役割を固定するシステムプロンプト
- `fewshot`: 例示つきプロンプト
- `cot`: 内部で段階的に検討させるプロンプト
- `parent`: 保護者の声かけ、習慣化
- `age`: 年齢別プロンプト
- `make`: アプリや教材を作る

`cot` は詳細な思考過程を出力させず、「内部で検討し、出力は根拠要約と次の一手だけ」と指定してください。

## 教材カードを追加する

`modules` に1件追加します。`promptKey` を入れると、カードのボタンから `prompts.html?prompt=...` へ移動します。

```js
{
  badge: "新着",
  title: "教材タイトル",
  description: "カード説明",
  image: "./assets/generated/画像名.png",
  alt: "画像の説明",
  tags: "検索に引っかけたい単語",
  promptKey: "newPromptKey"
}
```

## 悩み別カードを追加する

`rescueItems` に1件追加します。`promptKey` を入れるとプロンプト集に連動します。`dark: true` を付けると濃い背景のカードになります。

## ツール設定ガイドを追加する

`tools` は上部の短い役割カード、`toolSetups` は下部の詳しい設定手順カードです。公式ヘルプURLと関連プロンプトを入れると、カード内にリンクとボタンが出ます。

```js
{
  title: "ツール名",
  badge: "役割ラベル",
  bestFor: "どんな家庭・用途に向くか",
  officialUrl: "https://...",
  officialLabel: "公式ヘルプ",
  promptKey: "関連プロンプトkey",
  setupSteps: ["初期設定1", "初期設定2"],
  firstUse: ["最初の使い方1", "最初の使い方2"],
  safety: ["安全ルール1", "安全ルール2"],
  parentCheck: ["親の確認1", "親の確認2"],
  tags: "検索語"
}
```

## 質問解決策を追加する

`questionSolutions` に1件追加します。アンケートやLINEの具体文は個人が特定されないように匿名化・要約してから載せます。

```js
{
  badge: "習慣化",
  title: "言わないと始めない",
  question: "代表的な質問を匿名化して1文で要約",
  insight: "見立て",
  solution: "解決策",
  steps: ["今日やること1", "今日やること2"],
  tool: "ChatGPT / Gemini",
  promptKey: "habit",
  tags: "宿題 習慣"
}
```

## ライブ予定を追加する

日程は未確定なので、確定するまで `date` は入れません。

```js
timeline: [
  { title: "NotebookLMで音声復習を作る" }
]
```

確定後だけ、必要に応じて `label` に「次回」などの短い表示を入れます。具体日付は確定してから追加してください。

## 画像を追加する

画像は `assets/generated/` に置き、`image` に相対パスを書きます。

例: `./assets/generated/new-card.png`

## 反映方法

`content.js` を保存してブラウザをリロードすれば反映されます。GitHub Pages等に載せる場合は、Claude Codeで変更をcommit/pushすれば公開側にも反映されます。
