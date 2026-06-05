# AI教育ラボ Members コンテンツ更新ガイド

Claude Code側で更新する主ファイルは `content.js` です。ページ構成やナビゲーションは `shell.js`、見た目は `styles.css` に分かれています。

## ページ構成

- `index.html`: ホーム
- `library.html`: 教材
- `start.html`: はじめてガイド
- `rescue.html`: 悩み別レスキュー
- `questions.html`: アンケート質問から作った解決策
- `prompts.html`: プロンプト集
- `master-prompts.html`: 長文の最強プロンプトDocs
- `subject-prompts.html`: 教科別AI学習プロンプト完全版
- `test-prep-prompts.html`: ミス予報型テスト対策プロンプト集（小・中・高 全教科 + テスト前日/答案再現/万能版）
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

## 長文プロンプトDocsを追加する

`master-prompts.html` に出す長文プロンプトは `master-prompts-content.js` の `masterPromptDocs` に追加します。短いカードではなく、役割、入力欄、禁止事項、出力形式、品質チェックまで入れるドキュメント型です。

```js
{
  id: "unique-id",
  category: "カテゴリ",
  title: "表示タイトル",
  lead: "説明文",
  tools: "ChatGPT / Claude",
  useCases: ["使う場面"],
  outputs: ["作れるもの"],
  body: `そのままコピーできる長文プロンプト`
}
```

## 教科別プロンプト完全版を更新する

`subject-prompts.html` は `subject-prompts-content.js` の `subjectPromptMarkdown` を読み込んで、Markdown全文をドキュメント表示します。元Markdownを差し替える場合は、割愛せず全文を `subject-prompts-content.js` に再生成してください。

## テスト対策プロンプト集（ミス予報型）を更新する

`test-prep-prompts.html` は `test-prep-prompts-content.js` の `testPrepPromptMarkdown`（`window.AI_EDU_LAB_TEST_PREP_CONTENT` 名前空間）を読み込み、`subject-prompts.html` と同じMarkdown→TOC/コードブロック単位コピーで描画します。差し替え時は割愛せず全文を再生成してください。`testPrepPromptMeta` の `codeBlockCount / headingCount / lineCount` は省略可（未指定時は自動計算）。

Markdown構造のルール:

- `# 見出し`（h1）= セクション区切り（TOCの "Section" バッジ）
- `## 見出し`（h2）= 個別プロンプトのタイトル（TOCの "Prompt" バッジ）
- 各プロンプト本文は \`\`\`text フェンスのコードブロックで囲む（コードブロック単位でコピー可能）

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

## Zoomアーカイブを追加する

`content.js` の `liveArchives` 配列に新着順で1件追加します。`live.html` の上部「Zoomアーカイブ」セクションにYouTube埋め込みカードとして並びます。

\`\`\`js
liveArchives: [
  {
    title: "Zoomアーカイブ #2",
    date: "2026-06-15",
    description: "回の内容を1〜2文で説明",
    youtubeId: "YouTubeの動画ID（例: Kocm4rh4hCo）",
    tags: "検索に引っかけたい単語"
  }
]
\`\`\`

- `youtubeId` は YouTubeのURL `https://youtu.be/XXXXXXXXXXX` または `https://www.youtube.com/watch?v=XXXXXXXXXXX` の `XXXXXXXXXXX` 部分
- `date` は任意。入れると `YYYY-MM-DD` 形式が見出し上に表示される
- `description` も任意。入れない場合は説明文が消えるだけで他に影響なし
- 動画は YouTube埋め込みプレイヤーで表示され、「YouTubeで開く」ボタンから別タブで本家へ飛べます

## 質問フォームURLを差し替える

会員からの質問受付フォーム（Googleフォーム）は `live.html` の「質問を投稿する」ボタンに直接書いています。フォームURLが変わったら、`live.html` の `href="https://forms.gle/..."` を新しいURLに差し替えてください。`<a class="primary" ... target="_blank">` の構造は維持します（モバイルで別タブで開き、誤タップで他ページに飛ばないように `<button>` ではなく `<a>` にしてあります）。

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
