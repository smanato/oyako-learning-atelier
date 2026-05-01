# AI教育ラボ Members コンテンツ更新ガイド

Claude Code側で更新する主ファイルは `content.js` です。

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

`category` は `study`、`parent`、`make` のどれかを使うと、既存タブに連動します。

## 教材カードを追加する

`modules` に1件追加します。`promptKey` を入れると、カードのボタンからプロンプトへ移動します。

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

`rescueItems` に1件追加します。`dark: true` を付けると濃い背景のカードになります。

## 画像を追加する

画像は `assets/generated/` に置き、`image` に相対パスを書きます。

例: `./assets/generated/new-card.png`

## 反映方法

`content.js` を保存してブラウザをリロードすれば反映されます。GitHub Pages等に載せる場合は、Claude Codeで変更をcommit/pushすれば公開側にも反映されます。
