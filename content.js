/*
  Claude Code運用メモ:
  - プロンプトを追加する: prompts に key を追加し、promptCards に同じ key のボタンを追加。
  - 教材カードを追加する: modules に1件追加。promptKey を入れるとボタンから該当プロンプトへ飛びます。
  - 悩み別カードを追加する: rescueItems に1件追加。promptKey を入れるとプロンプト集へ連動します。
  - 画像を追加する: assets/generated/ に置き、image を "./assets/generated/ファイル名.png" にする。
*/

window.AI_EDU_LAB_CONTENT = {
  defaultPrompt: "pdfTutor",
  prompts: {
    pdfTutor: {
      title: "写真/PDF家庭教師",
      body: `あなたは子どもに答えを丸ごと教えない家庭教師です。

【子ども】小学校5年生
【教材】添付した写真/PDF
【目的】今日の内容を理解して、確認問題まで進める

次の順番でお願いします。
1. まず、教材の内容を小学生にもわかる言葉で3行にまとめる
2. 子どもがつまずきそうなポイントを3つ挙げる
3. 答えを直接言わず、ヒントを3段階で出す
4. 最後に5問の確認クイズを作る
5. 間違えたら、どこで考え違いをしたか優しく説明する`
    },
    firstStep: {
      title: "最初の3分スタート",
      body: `子どもが宿題を始めるまで時間がかかります。
学年は【小学校高学年】、今日やる内容は【算数の宿題】です。

親が今すぐ言える声かけを3つ作ってください。
条件:
- 命令口調にしない
- 3分だけ始める形にする
- 終わった後に褒める言葉もセットにする
- 子どもが嫌がった時の返しも用意する`
    },
    habit: {
      title: "宿題を始めるまでが長い",
      body: `子どもが宿題をなかなか始めません。
以下をもとに、今日だけ試せる「3分ミッション」に変えてください。

学年:
教科:
今日やる宿題:
子どもが好きなもの:

出力:
1. 最初の一言
2. 3分で終わる最小タスク
3. 終わった後の褒め方
4. 明日につなげる一言`
    },
    screenRule: {
      title: "スマホ・ゲーム脱線対策",
      body: `子どもがYouTubeやゲームに流れて、学習が続きません。
AI学習を始める前のルールを、親子で揉めにくい形にしてください。

条件:
- 禁止ではなく、順番を決める
- 勉強をゲーム風のミッションにする
- 15分以内で終わる
- できたらゲーム時間と交換できる形にする

家庭の状況:
子どもの年齢:
今日の学習内容:`
    },
    careless: {
      title: "ケアレスミス見直し",
      body: `子どもがわかっている問題でケアレスミスをします。
添付した間違いまたは以下の内容から、本人専用の見直しチェックリストを作ってください。

条件:
- 責める言葉を使わない
- 見直し項目は5つ以内
- 子どもが自分で確認できる短い言葉にする
- 最後に同じタイプの練習問題を3問作る`
    },
    weakness: {
      title: "苦手単元のつまずき診断",
      body: `子どもが【単元名】でつまずいています。
答えを教える前に、どこで止まっているか確認したいです。

次の形式でお願いします。
1. つまずき候補を3つ
2. それぞれを見分ける質問
3. 子どもに出すヒント
4. 5分でできる復習ワーク
5. 親が言うとよい声かけ`
    },
    testPlan: {
      title: "定期テスト逆算計画",
      body: `定期テストまで【14日】です。
提出課題で終わらず、解き直しまでできる計画を作ってください。

教科:
提出課題:
苦手単元:
部活や習い事で使えない曜日:
1日に使える時間:

条件:
- 1日ごとのタスクに分ける
- 予備日を入れる
- 暗記、演習、解き直しを分ける
- 親が確認するポイントも書く`
    },
    english: {
      title: "親子英会話ロールプレイ",
      body: `親は英語が苦手ですが、子どもに英語を楽しく始めさせたいです。
子どもの年齢は【小学校低学年】です。

次を作ってください。
1. 今日のテーマ
2. 親子で使う短い英会話10往復
3. カタカナ読みの補助
4. 褒め言葉
5. 3分で終わる復習ゲーム`
    },
    typing: {
      title: "タイピングできない子のAI入力",
      body: `子どもがまだタイピングできません。
AIに質問したいことを、紙・写真・音声入力で進める方法を作ってください。

子どもの年齢:
聞きたい内容:
使える端末: スマホ / タブレット / PC

出力:
- 紙に書くテンプレート
- 写真で送る時の親の一言
- 音声入力するときの短い台本
- タイピング練習につなげる遊び`
    },
    support: {
      title: "発達特性・登校しぶりの小さな成功",
      body: `子どもに発達特性または登校しぶりがあり、学習への自信が落ちています。
負荷を下げつつ、今日できる小さな成功体験に分けてください。

注意:
- 医療判断はしない
- 無理に長時間やらせない
- 子どもの好きなものを入り口にする
- できた事実を言葉にする

状況:
好きなもの:
今日の学習内容:`
    },
    quiz: {
      title: "NotebookLMクイズ化",
      body: `添付した教材から、子どもが楽しく復習できるクイズを作ってください。
難易度は【学年相当】で、以下の形式にしてください。

- 4択問題 5問
- 一問一答 5問
- 間違えやすいポイント 3つ
- 親子で話す確認質問 3つ
- 5分で聞ける音声解説の台本`
    },
    praise: {
      title: "褒め方・声かけ変換",
      body: `次の親の言葉を、子どものやる気を削らない声かけに変換してください。

言ってしまいがちな言葉:
「なんでまだやってないの？」

条件:
- 子どもを責めない
- 次の行動がわかる
- 低学年向け、中学生向けの2種類
- うまくいかなかった時の二の矢も作る`
    },
    typingApp: {
      title: "推し単語タイピングアプリ",
      body: `子どもが好きな単語でタイピング練習できる、シンプルなWebアプリを作りたいです。

条件:
- 単語リストを親が自由に変更できる
- 正解したら褒める
- タイムではなく、連続正解数を表示
- スマホでも使える
- HTML/CSS/JavaScriptだけで動く

単語リスト:
【ここに好きなキャラクター名や興味のある単語を入れる】`
    },
    reviewApp: {
      title: "間違い復習アプリ",
      body: `子どもが間違えた問題だけを繰り返せる復習アプリを作りたいです。

機能:
- 問題を追加できる
- 正解/不正解を記録
- 間違えた問題だけ再出題
- 教科タグをつけられる
- 親が問題文を編集できる

まずは1ファイルで動くHTMLを作ってください。`
    },
    audio: {
      title: "5分音声復習",
      body: `添付した教材を、子どもが聞きたくなる5分の音声復習台本にしてください。

条件:
- ラジオのように楽しい会話形式
- 例え話を入れる
- 下品・怖い表現は避ける
- 最後に確認クイズ3問
- 学年は【小学校高学年】`
    }
  },
  promptCards: [
    { key: "pdfTutor", category: "study", label: "写真/PDF家庭教師" },
    { key: "quiz", category: "study", label: "NotebookLMクイズ化" },
    { key: "praise", category: "parent", label: "褒め方・声かけ変換" },
    { key: "typingApp", category: "make", label: "推し単語タイピングアプリ" },
    { key: "reviewApp", category: "make", label: "間違い復習アプリ" },
    { key: "audio", category: "study", label: "5分音声復習" }
  ],
  modules: [
    {
      badge: "今月の必修",
      title: "スマホで教科書を撮って、AI家庭教師にする",
      description: "写真でも始められる。複数ページはPDF化すると読み取りが安定します。",
      image: "./assets/generated/photo-pdf-tutor.png",
      alt: "写真やPDFをAI家庭教師に変える教材",
      tags: "写真 PDF AI家庭教師 ChatGPT Gemini NotebookLM 教科書",
      promptKey: "pdfTutor",
      featured: true
    },
    {
      badge: "計画",
      title: "定期テスト逆算計画",
      description: "提出課題で終わらず、暗記・演習・解き直しまで日割りに。",
      image: "./assets/generated/test-planning.png",
      alt: "定期テストの逆算計画",
      tags: "定期テスト 受験 計画 部活"
    },
    {
      badge: "見直し",
      title: "ケアレスミス見直し",
      description: "責めずに、本人が使えるチェックリストへ変換します。",
      image: "./assets/generated/mistake-review.png",
      alt: "ケアレスミスの見直し",
      tags: "ケアレス 計算 漢字 見直し"
    },
    {
      badge: "脱線対策",
      title: "スマホ・ゲームルール",
      description: "禁止より先に、親子で納得しやすい順番を決める。",
      image: "./assets/generated/screen-rules.png",
      alt: "スマホやゲームのルールづくり",
      tags: "スマホ ゲーム YouTube ルール"
    },
    {
      badge: "英語",
      title: "親子英会話ロールプレイ",
      description: "親が英語に自信がなくても、短い会話から始めます。",
      image: "./assets/generated/english-practice.png",
      alt: "親子英会話練習",
      tags: "英語 英会話 音声"
    },
    {
      badge: "作る",
      title: "親子で復習アプリを作る",
      description: "間違えた問題だけを残し、次の練習に使える小さなアプリへ。",
      image: "./assets/generated/review-app.png",
      alt: "親子で復習アプリを作る教材",
      tags: "アプリ 作成 復習 タイピング AI Studio"
    }
  ],
  rescueItems: [
    {
      badge: "習慣化",
      title: "宿題を始めるまでが長い",
      description: "3分だけ着手するミッションに変換。親の声かけもセットで出します。",
      image: "./assets/generated/start-guide.png",
      alt: "宿題を始める習慣化",
      tags: "習慣 集中 宿題",
      promptKey: "habit"
    },
    {
      badge: "脱線対策",
      title: "スマホ・ゲームに流れる",
      description: "禁止ではなく順番を決め、ゲーム要素を学習側へ移します。",
      image: "./assets/generated/screen-rules.png",
      alt: "スマホやゲームの脱線対策",
      tags: "スマホ ゲーム YouTube 集中",
      promptKey: "screenRule"
    },
    {
      badge: "見直し",
      title: "ケアレスミスが減らない",
      description: "間違いを責めず、本人専用の見直しチェックリストを作ります。",
      image: "./assets/generated/mistake-review.png",
      alt: "ケアレスミスの見直し",
      tags: "ケアレス 計算 漢字 見直し",
      promptKey: "careless"
    },
    {
      badge: "苦手克服",
      title: "どこでつまずいたかわからない",
      description: "理解度を診断して、答えではなく段階ヒントに分解します。",
      image: "./assets/generated/photo-pdf-tutor.png",
      alt: "苦手単元のつまずき診断",
      tags: "苦手 単元 算数 理科 社会 国語 英語",
      promptKey: "weakness"
    },
    {
      badge: "計画",
      title: "テスト前に課題だけで終わる",
      description: "提出課題、暗記、解き直しを日割りにして現実的な計画へ。",
      image: "./assets/generated/test-planning.png",
      alt: "定期テストの逆算計画",
      tags: "定期テスト 受験 計画 部活",
      promptKey: "testPlan",
      dark: true
    },
    {
      badge: "英語",
      title: "親が英語苦手で始め方が不安",
      description: "ChatGPTやGeminiで、短い親子英会話ロールプレイを作ります。",
      image: "./assets/generated/english-practice.png",
      alt: "親子英会話",
      tags: "英語 英会話 音声",
      promptKey: "english"
    },
    {
      badge: "入力",
      title: "子どもがタイピングできない",
      description: "紙に書く、写真で渡す、音声入力する。アナログとAIをつなぎます。",
      image: "./assets/generated/tool-setup.png",
      alt: "入力方法とツール設定",
      tags: "タイピング 音声入力 紙 写真",
      promptKey: "typing"
    },
    {
      badge: "個別対応",
      title: "発達特性・登校しぶりで進まない",
      description: "負荷を小さくして、できた感を失わない成功体験へ分解します。",
      image: "./assets/generated/safety-guide.png",
      alt: "個別対応と安心ガイド",
      tags: "発達特性 不登校 ADHD 個別",
      promptKey: "support"
    }
  ],
  tools: [
    { title: "NotebookLM", description: "教科書、プリント、PDFからクイズ、要約、音声復習を作る。", tags: "NotebookLM PDF 教科書 音声復習 クイズ" },
    { title: "Gemini", description: "スマホ中心の相談、教材化、Google連携。最初の1本にしやすい。", tags: "Gemini スマホ Google NotebookLM 相談" },
    { title: "ChatGPT", description: "学習モード、英会話、声かけ例、親の相談壁打ちに。", tags: "ChatGPT 学習モード 英会話 声かけ" },
    { title: "Claude", description: "図解、文章の読み解き、復習アプリのたたき台作成に。", tags: "Claude 図解 文章 復習アプリ" },
    { title: "Google AI Studio", description: "親子用の小さな学習アプリを作る練習に。", tags: "Google AI Studio アプリ 作成 タイピング" }
  ],
  timeline: [
    { date: "5/1", title: "スタートガイド: スマホだけでAI家庭教師" },
    { date: "5/8", title: "Claudeで苦手単元を図解する" },
    { date: "5/15", title: "NotebookLMで音声復習を作る" },
    { date: "5/22", title: "親子で復習アプリを作る入門" }
  ]
};
