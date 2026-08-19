# AI教育ラボ Members（わが子の可能性コミュニティ 会員サイト）

まりさんとまなさんが共同運営する有料コミュニティの会員サイト。静的HTML＋JSのGitHub Pagesサイトで、ビルド工程なし。push すると https://smanato.github.io/oyako-learning-atelier/ に公開される。

**まりさん側・まなさん側それぞれのClaudeが編集する共有リポジトリです。** 変更の経過は git log に残すのがルール：コミットメッセージには「何をなぜ変えたか」を日本語で書く。作業前に `git pull`、作業後は速やかに commit/push して衝突を防ぐ。

## 構成の基本

- コンテンツはHTMLに直接書かず、JSデータファイルで管理（`content.js` ほか `*-content.js`）
- ページの見た目・描画は `app.js` / `shell.js`（ナビ） / `styles.css`
- **各コンテンツの追加・更新手順はすべて [CONTENT_UPDATE_GUIDE.md](CONTENT_UPDATE_GUIDE.md) に記載。編集前に必ず該当セクションを読むこと。** 新しい仕組みを追加したら同ガイドにも追記する

## 特に注意すること

- **このリポジトリは公開（public）。** 会員向けサイトだが内容は誰でも閲覧できる。質問・相談ごとの掲載は必ず匿名化（個人名・学校名・特定できる状況を削る）。会員限定にしたい資料はリポジトリに置かず、Googleドライブの共有リンクで参照する
- オプチャQ&A（`qa.html` / `qa-content.js`）の `id` は個別ページURLになっており、オープンチャットにリンクとして配布済みのものがある。**既存の id は変更しない**（リンク切れになる）
- ナビ項目は `shell.js` の `navItems`。ページを増やしたらここと CONTENT_UPDATE_GUIDE.md の両方を更新する

## 主なページ

| ページ | 内容 | データファイル |
|---|---|---|
| `qa.html` | オプチャQ&Aアーカイブ（一覧＋ `?id=○○` で個別ページ） | `qa-content.js` |
| `questions.html` | フォームアンケートの質問から作った解決策 | `content.js` |
| `prompts.html` ほか | プロンプト集各種 | `content.js` / `master-prompts-content.js` など |
| `live.html` | Zoomアーカイブ・質問フォーム | `content.js` |
| `materials.html` | 配布資料の保管庫 | `content.js` |

## 動作確認

ローカル確認は `npx --yes http-server -p 4173 -c-1 .` でサーバーを立てて行う（`file://` 直開きだとJSデータが描画されない環境がある）。
