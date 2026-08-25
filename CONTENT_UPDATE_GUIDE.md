# AI教育ラボ Members コンテンツ更新ガイド

Claude Code側で更新する主ファイルは `content.js` です。ページ構成やナビゲーションは `shell.js`、見た目は `styles.css` に分かれています。

## ページ構成

- `index.html`: ホーム
- `library.html`: 教材
- `start.html`: はじめてガイド
- `rescue.html`: 悩み別レスキュー
- `questions.html`: アンケート質問から作った解決策
- `qa.html`: オプチャQ&A（オープンチャットの質問と回答のアーカイブ。`qa.html?id=○○` で個別ページ）
- `prompts.html`: プロンプト集
- `master-prompts.html`: 長文の最強プロンプトDocs
- `subject-prompts.html`: 教科別AI学習プロンプト完全版
- `test-prep-prompts.html`: ミス予報型テスト対策プロンプト集（小・中・高 全教科 + テスト前日/答案再現/万能版）
- `age-prompts.html`: 幼稚園生から大学4年までの年齢別プロンプト
- `tools.html`: ツール設定
- `live.html`: Zoom・質問
- `materials.html`: 資料ダウンロード（セミナー資料・配布シートの保管庫）
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

## オプチャQ&Aを追加する

オープンチャットで回答した質問は `qa-content.js` の `qaItems` に1件追加すると、`qa.html`（オプチャQ&A）に一覧カードと個別ページが自動で作られます。並びは `date` の新しい順に自動ソートされます。

```js
{
  id: "20260819-kokugo-yumejuya",
  date: "2026-08-19",
  subject: "国語",
  grade: "中学生",
  tools: "ChatGPT / Claude / NotebookLM",
  title: "カードと個別ページの見出し",
  question: "質問文を匿名化して載せる",
  sections: [
    { heading: "見出し", body: "本文。\n\nで段落分け、\nで改行" },
    { heading: "プロンプト見出し", body: "説明文", prompt: "コピーして使うプロンプト本文" }
  ],
  links: [{ label: "リンク名", url: "https://..." }],
  tags: "検索に引っかけたい単語をスペース区切りで"
}
```

- `id`: 個別ページのURL（`qa.html?id=○○`）になるので英数字とハイフンのみ。**後から変えるとオプチャに貼ったリンクが切れるので変えない**。おすすめは `日付-教科-内容` 形式
- `subject`: `国語` `数学・算数` `英語` `理科` `社会` `全教科・その他` のいずれか。絞り込みチップはデータから自動生成されるので、表記ゆれ（「算数」と「数学・算数」など）があるとチップが分裂します
- `grade`: `小学生` `中学生` `高校生` `全学年` のいずれか（同上）
- `sections`: 回答本文。`heading` + `body`（自由文）+ `prompt`（コピー可能なコードブロックとして表示）を自由に組み合わせる。`prompt` だけ・`body` だけのセクションも可
- `body` の書き方: `\n\n` で段落、`\n` で改行、`**ここ**` で太字。ここぞという1文だけに太字を使うと効きます（多用すると効果が薄れます）
- `links`: 任意。`http://` `https://` 以外のURLはボタンを出しません
- `tags`: 検索ボックス対策。本文に出てこない言い換え（例:「読書感想文」「テス勉」）を入れておくと探しやすくなります
- `compare`: 任意。セクションに比較表を出したいときに使う（下記）
- **質問文は必ず匿名化する**（個人名・学校名・特定できる状況を削る）。このリポジトリは公開なので、Q&Aの内容は誰でも閲覧できる前提で書くこと
- 回答したらオプチャに個別ページのURL（例: `https://○○/qa.html?id=20260819-kokugo-yumejuya`）を貼っておくと、「あの話どこだっけ？」にリンクで答えられます

### セクションに比較表を出す

「AとBとCのどれを使うか」のような話は、文章より表のほうが伝わります。`sections` の1件に `compare` を足すと表になります。`questionSolutions`（質問解決策）でも同じ書き方が使えます。

```js
{
  heading: "公開する方法は3つ",
  body: "表の前に置く説明文（任意）",
  compare: {
    headers: ["ツール", "作る側", "見る側", "パスワード"],
    rows: [
      ["Canva Code", "無料でOK", "ログイン不要", "かけられる"],
      ["Claude", "無料でOK", "ログイン不要", "かけられない"]
    ],
    note: "表の下に出る補足（任意）。どれを選べばいいかの一言を入れると親切です"
  }
}
```

- `headers` と各 `rows` の列数は揃える。**各行の1列目は見出し扱い**になり、太字で表示されます
- 該当なしのセルは `"—"` と書きます（空文字だと表が歪んで見えます）
- `title` は任意。`questionSolutions` 側で使う場合は表の見出しになります
- **列は5つまでを目安に。** セルは折り返さない設定なので、増やすほどスマホで横スクロールが長くなります
- 画面より広い表は、ページごとではなく**表だけが横スクロール**します。スマホでも他の部分は崩れません

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
- `youtubeId` が空のときは埋め込みと「YouTubeで開く」ボタンを出しません。動画の準備ができる前に資料だけ先に公開したい回で使えます

### アーカイブカードに資料ボタンを付ける

`material` を足すと、「YouTubeで開く」の横に資料ボタンが並びます。その回を見ながらすぐ資料を開けるようにするためのもので、資料ダウンロードページ（`materials`）と併用します。

```js
{
  title: "教育×AI 第3回アーカイブ",
  youtubeId: "9wxrK-9DQDI",
  material: {
    url: "https://drive.google.com/file/d/xxxxx/view",
    label: "第3回の資料を見る",
    note: "PDF / 32枚"
  }
}
```

- `url`: Googleドライブの共有リンク。`materials` と同じく、空、または `./` `/` `http://` `https://` 以外で始まる値のときはボタンを出しません
- `label` は任意（既定は「資料を見る」）、`note` も任意（ボタン横に小さく出る補足）
- 同じ資料を `materials` 側にも登録しておくと、資料ダウンロードページからも探せます

## 資料ダウンロードを追加する

オープンチャットに投稿した資料は期限切れでダウンロードできなくなるため、`materials.html`（資料ダウンロード）に保管します。`content.js` の `materials` 配列に1件追加すると、カードが並びます。

```js
materials: [
  {
    category: "セミナー資料",
    badge: "第2回",
    title: "教育×AI 第2回 セミナー資料",
    date: "2026-06-15",
    description: "カードの説明を1〜2文で",
    fileType: "PDF",
    fileSize: "3.2MB",
    file: "./assets/docs/kyoiku-ai-02.pdf",
    tags: "検索に引っかけたい単語"
  }
]
```

- `category`: グループ見出し。同じ文字列のものが1つのブロックにまとまり、**最初に出てきた順**でセクションが並ぶ。省略すると「資料」になる
- `file`: リポジトリ内のファイル。`assets/docs/` に置いて `./assets/docs/ファイル名.pdf` で参照する。`download` 属性が付くのでタップで保存できる
- `url`: Googleドライブなど外部リンク。`file` がない場合に使われ、別タブで開く（ボタン文言は「資料を開く」）
- `file` と `url` の両方がある場合は `file` を優先
- `badge` / `date` / `description` / `fileType` / `fileSize` / `buttonLabel` はすべて任意
- `file` / `url` が空、または `./` `/` `http://` `https://` 以外で始まる値の場合はボタンを出さない（安全対策）
- `materials` が空配列のときは「資料は順次追加しています」というプレースホルダーが出る

**ファイル名は英数字にしてください。** 日本語ファイル名でも動きますが、URLエンコードで環境によって崩れることがあります。

**注意: このリポジトリは公開（public）です。** `assets/docs/` に置いたファイルはURLを知っていれば誰でもダウンロードでき、GitHub上でも閲覧できます。会員限定にしたい資料はリポジトリに置かず、Googleドライブ側で共有範囲を設定して `url` で参照してください。

現在のセミナー資料（第1〜3回）は、まりさんのGoogleドライブ「セミナー資料」フォルダに置いて `url` で参照しています。フォルダの共有設定は「リンクを知っている全員が閲覧可」です。会員だけに絞りたくなったら、ドライブ側で閲覧者を個別指定に変更してください（サイト側の記述は変更不要です）。

**PPTXはPDFに変換してから置いてください。** PowerPointの `名前を付けて保存` → `PDF` で、サイズが概ね1/8程度になります（実測：168MB → 19MB）。PPTXのままだとスマホで開けない保護者が出ます。

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
