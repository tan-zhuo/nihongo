# nihongo.ink 🇯🇵⌨️

专注的日语打字练习网站 — React 18 + Vite + TypeScript + Tailwind CSS，纯前端静态站点，可一键部署到 Vercel。

## 功能

- **文章打字练习**：58 篇 N5–N1 分级文章（40 篇原创短文 + 18 篇日本经典昔话与睡前小故事：桃太郎、浦島太郎、かぐや姫、七夕等），一行原文一行输入逐字实时比对，汉字带假名注音（可开关），IME 变换未确认的假名不计错。发现打错了可以退回上一行改：把当前行删空后再按一次退格键（手机上点行尾的「改上一行」）。完成后显示正确率、速度（字/分钟）、用时、错误次数。
- **单词词典**：4200 个 N5–N1 常用词汇（N5:700 / N4:800 / N3–N1:各900）做成可查的词典：一个搜索框同时认汉字、假名、罗马字（`gakkou`）、中文和英文；左侧五十音拇指索引 + 等级/词性筛选，默认五十音顺排列、分「あ・い・う…」小节，像翻纸质词典。点一个词条，右侧（手机上是底部抽屉）显示读音与东京声调、朗读、中英释义、配图、站内课文和语法例句里的真实例句、同字的词，以及它出现在哪些场景图里。
- **场景图（看图识字）**：100 张原创扁平风格场景插画（家・人・街・食・自然・文化六大类：厨房、车站、便利店、夏日祭……），画里每样东西都贴着日语标签，共 1600 多个词；点标签看详情并朗读，「全部朗读」按顺序念一遍，「自测」模式把标签盖住只留序号、想起来再点开；「打字」模式在图下面逐个打这张图的单词（看意思打读音，罗马字实时转假名，也可直接打假名或汉字），打对的词当场在图里亮起来，打完一张记录用时和一次打对的词数。每张图配三句看图说话的例句（带注音和中英译文）。
- **单词打字练习**：两种模式（看意思打日语 / 看日语打意思），可按 JLPT 等级和五十音行筛选，另有自动播放的浏览记忆模式。
- **标日课文**：6 册 104 课每课一篇 本文 + 会話，共 1760 行，430 行带句子解析，520 条语法点。页面左边课文、右边本课生词（sticky 跟随滚动）、下面语法点；点一句展开中英译文和解析，点右边的词在课文里高亮它出现的每一处，每行每词都能朗读，假名注音可开关。课文是按每课单词表和语法点新写的原创例文，不是教材课文原文（教材正文有版权），页面上每课都写明了这一点。
- **标日分课单词**：《新版中日交流标准日本语》初级上下册、中级上下册、高级上下册共 6 册 104 课、3988 个单词，按课分组。三种记法：**卡片**（翻面看答案，「记住了 / 没记住」分级，日→中与中→日双向）、**选择题**（四选一，看日语选意思 / 看意思选日语 / 看汉字选读音，答对自动进入下一题）、**词表**（整课浏览，可朗读）。答题结果写入 5 级记忆盒（Leitner），到期的词会在册页提示复习。全程不需要输入日语。
- **数字・日期**：数字、时刻、月日星期、期间与常用量词的读法。读法表标出所有不规则处（4時=よじ、20日=はつか、300=さんびゃく、8本=はっぽん），点一行可朗读；题目由读法规则现场生成，不会重复，三种练法：四选一、打读音（假名）、假名→数字反向填空。
- **语法・敬语**：608 个 N5–N1 语法点（接续 + 中英讲解 + 注音例句 + 易错提示），另有 45 课敬语专项（入門 → 尊敬語 → 謙譲語 → 商务实践 → 误用警示）。
- **JLPT 刷题**：617 道 N5–N1 真题风格原创模拟题（N5 277 题，N4 91，N3 87，N2 81，N1 81），覆盖汉字读音、表记、文脉规定、近义替换、用法、文法形式、句子排序（★）、读解八种笔试题型，另有 110 道听力题（课题理解・要点理解・即时应答・发话表达），每题一段男女双声道录音（Edge 神经语音），考试式播放「问题→对话→问题」，答完后显示原文，每题附中/英文解析，按等级和部分筛选，本地记录各级正确率。
- **三语界面**：中文 / 日本語 / English，根据浏览器语言自动选择，可手动切换（记忆在 localStorage）。

## 本地运行

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # 产物在 dist/
npm run preview    # 本地预览构建产物
```

## 部署到 Vercel

方式一（推荐，Git 集成）：

1. 把仓库推到 GitHub。
2. 在 [vercel.com](https://vercel.com) → Add New Project → 导入该仓库。
3. Vercel 会自动识别 Vite 项目（Build Command: `npm run build`，Output: `dist`），直接 Deploy 即可。

方式二（CLI）：

```bash
npm i -g vercel
vercel          # 首次部署，按提示操作
vercel --prod   # 生产部署
```

仓库中的 `vercel.json` 已配置 SPA 路由重写（所有路径回退到 `index.html`），刷新 `/practice/xxx` 等深层路由不会 404。

## 数据结构与扩展

### 文章 `src/data/articles/n5.json` … `n1.json`

```json
{
  "id": "n5-a1",
  "level": "N5",
  "title": "わたしの一日",
  "content": "わたしは毎朝六時に起きます。…"
}
```

- `content` 为连续的一段日文（不含换行），字数在列表页自动统计。
- 新增文章：往对应等级的 JSON 数组里追加对象即可（`id` 不要重复）；新增等级文件需在 `src/data/articles/index.ts` 中 import。

### 标日课文 `src/data/textbook/texts/*.json`

每课一个 `{ n, passages, points }`：`passages` 是 本文 和 会話 两段，每行 `{ sp?, ja, zh, en, note_zh?, note_en? }`，`ja` 里汉字按 `{漢字|かんじ}` 注音；`points` 是该课语法点和例句。

`node scripts/check-textbook-texts.mjs` 做校验：初级按逐课累计的汉字预算卡生词（初学者只见过这些），中级和高级放宽到整套六册的字表，但要求课文至少用上本课单词表里的 8 个词；另外校验假名注音覆盖每个汉字、注音只含假名、中英译文齐全。

### 标日单词 `src/data/textbook/elementary-1.json` … `advanced-2.json`

```json
{
  "id": "elementary-1",
  "series": "elementary",
  "volume": 1,
  "title": "初級 上", "title_zh": "初级 上册", "title_en": "Elementary I",
  "themed": false,
  "lessons": [
    {
      "n": 1,
      "title": "李さんは中国人です",
      "title_zh": "小李是中国人",
      "words": [
        { "id": "elementary-1-01-01", "w": "私", "r": "わたし", "p": "pron", "zh": "我", "en": "I; me" },
        { "id": "elementary-1-01-14", "w": "違います", "r": "ちがいます", "p": "verb", "g": 1, "zh": "不是", "en": "that's wrong" }
      ]
    }
  ]
}
```

- `w` 表记 / `r` 假名读音（纯假名词与 `w` 相同）/ `p` 词性（同下方 vocab 的取值）/ `g` 动词类别（動1・動2・動3，仅动词有）。
- `themed`：初级两册用教材本身的课题（`false`）；中级、高级按教材主题顺序分课，课题为自拟主题名（`true`），界面会注明。
- 新增一册或一课：改对应 JSON 后无需其他改动，`/textbook` 列表、SEO 元信息和 `sitemap.xml` 都由 `src/data/textbook/index.ts` 与 `scripts/prerender.mjs` 自动生成。
- 学习进度存在 localStorage 的 `nihongo.textbook.srs.v1`（每词一个 1–5 级记忆盒 + 上次作答时间），间隔为 1/2/4/8/16 天。

### 场景图 `src/data/scenes/<id>.json` + `src/data/scenes/art/<id>.svg`

```json
{
  "id": "kitchen", "n": 4, "group": "home",
  "title": "台所", "title_zh": "厨房", "title_en": "Kitchen",
  "words": [
    { "w": "冷蔵庫", "r": "れいぞうこ", "zh": "冰箱", "en": "refrigerator", "x": 120, "y": 300 }
  ],
  "sentences": [
    { "ja": "{母|はは}は{台所|だいどころ}で{料理|りょうり}をしています。", "zh": "妈妈在厨房做饭。", "en": "Mom is cooking in the kitchen." }
  ]
}
```

- 插画是 `viewBox="0 0 800 500"` 的纯 SVG（不含文字、图片、脚本），标签由页面按 `x,y` 叠在图上；每个词对应画里一个 `<g data-w="N">`（N 为词在 `words` 里的 1 起序号），悬停单词时其他组会变淡。
- 词若在 4200 词表里（按 `w`+`r` 匹配），自动借用它的音频、声调和等级；不在也可以用，只是改用系统语音朗读，声调查 `src/data/vocab/scene-accents.json`（键为 `表記|よみ`）。
- 声调表由 `python scripts/build-accents.py path/to/accents.txt`（[Kanjium](https://github.com/mifunetoshiro/kanjium) 的 NHK/大辞林数据）生成，同时产出词表的 `src/data/vocab/accents.json` 和场景词的 `scene-accents.json`；Kanjium 没有的固定短语、同音歧义词写在 `scripts/accents-overrides.json` 里手工定。加了新场景后重跑一次，脚本会列出还缺声调的词。
- `group` 取 `home / people / town / food / nature / culture`；例句汉字一律 `{漢字|かんじ}` 注音。
- `node scripts/check-scenes.mjs [id]` 校验：字段、标签坐标与互相重叠、注音覆盖、SVG 自包含且每个词有对应 `data-w` 组。新增场景只需加这两个文件，列表、SEO 元信息和 `sitemap.xml` 自动生成；看过的场景记在 localStorage 的 `nihongo.scenes.seen.v1`。

### 单词 `src/data/vocab/n5.json` … `n1.json`

```json
{
  "id": "n5-0001",
  "word": "学校",
  "reading": "がっこう",
  "meaning_zh": "学校",
  "meaning_en": "school",
  "level": "N5",
  "pos": "noun"
}
```

- `pos` 取值：`noun / verb / i-adj / na-adj / adv / particle / conj / pron / interj / expr / counter / prenoun / num`（界面按语言翻译显示）。
- `meaning_zh` / `meaning_en` 多义用 `；` / `; ` 分隔——「打意思」模式判定时任意一个义项即算对。
- 五十音行筛选按 `reading` 首假名自动归类（浊音/拗音归入清音行），无需额外字段。

## 目录结构

```
src/
├── main.tsx / App.tsx        # 入口与路由
├── i18n/                     # 中/日/英三语文案
├── types.ts                  # Level / Article / VocabWord 类型
├── data/
│   ├── articles/  n5~n1.json + index.ts
│   ├── textbook/  标日六册 json + index.ts
│   ├── scenes/    100 张场景图：<id>.json + art/<id>.svg
│   └── vocab/     n5~n1.json + index.ts
├── hooks/useTyping.ts        # IME 感知的打字判定核心逻辑
├── lib/kana.ts               # 五十音行归类、释义模糊匹配
├── lib/dictionary.ts         # 词典检索（汉字/假名/罗马字/中英释义）与五十音排序
├── lib/romaji.ts             # 罗马字 → 平假名
├── lib/examples.ts           # 从课文和语法例句里找某个词的例句
├── lib/srs.ts                # 标日单词的 Leitner 记忆盒
├── lib/wordquiz.ts           # 选择题生成（干扰项按词性挑选，错误读音由正确读音变形而来）
├── components/               # Layout(语言切换) / LevelFilter / ResultModal
└── pages/                    # Home / Articles / Practice / Vocab(词典・场景图・打字练习)
```

## 语音生成（可选，仅在修改文章后需要重跑）

站内音频是**预先合成的静态 MP3**，运行时不加载任何模型、不调用任何 API、也不需要服务器。

- 引擎：[VOICEVOX](https://voicevox.hiroshiba.jp/) ENGINE（本地 CPU 版），配音「四国めたん（ノーマル）」
- 授权：商用・非商用均可，条件是页面标注「VOICEVOX:四国めたん」——已写在页脚
- 产物：`public/audio/<article-id>.mp3`（58 篇，含逐句时间轴）与 `public/audio/kana/<romaji>.mp3`（102 个假名），合计约 20MB
- 时间轴记录在 `src/data/audio-manifest.json`，前端据此高亮正在朗读的句子

重新生成：

```bash
# 1) 启动 VOICEVOX ENGINE（仅生成时需要，生成完即可关闭）
cd voicevox/linux-cpu-x64 && ./run --host 127.0.0.1 --port 50021 --cpu_num_threads 8

# 2) 生成（已存在的文件会跳过；--force 强制重来）
python scripts/generate-audio.py --kana

# 常用参数
python scripts/generate-audio.py --only n5-a1      # 只重做某一篇
python scripts/generate-audio.py --speaker 16      # 换配音（九州そら）
python scripts/generate-audio.py --engine kokoro   # 换引擎（Kokoro，Apache-2.0 无需署名）
```

浏览器语音合成仍作为兜底：没有对应 MP3 的内容（如 4200 个单词）会自动改用系统语音朗读。
