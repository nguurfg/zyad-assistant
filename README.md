# 赵云与阿斗助手 · zyad-assistant

面向 4399 网页小游戏《赵云与阿斗》（`h.4399.com/play/262277.htm`）的**浏览器用户脚本**。

> ⚠️ **本仓库不包含任何游戏源码、美术或音频素材。**
> 游戏本体代码与素材的著作权属于原开发者，本仓库仅包含自主编写的脚本与分析文档。

---

## 功能

| 功能 | 说明 |
|---|---|
| 免广告 | 拦截 `h5api` 的激励视频调用，直接回调成功并发奖 |
| 馒头（体力）无限 | 真值锁定 `player._data._stamina`，不是改显示 |
| 铜币无限 | 存档层 `_gold` 锁定 |
| 战斗金币不减 | 战斗内 `Q2._gold` 拉满，征兵扣不完 |
| 消耗固定显示 | 左上角征兵消耗固定为 2（`defineProperty` 锁 `Q2.Gs`）|

全部逻辑在浏览器本地运行，不读取、不上传任何个人数据。

---

## 安装

### 方式一：一键安装页

打开 **`web/index.html`**（GitHub Pages 上即为仓库首页），
点「⬇ 安装脚本」，按页面图文步骤操作。

### 方式二：直接装脚本

```bash
# Tampermonkey / Violentmonkey
https://raw.githubusercontent.com/nguurfg/zyad-assistant/master/userscript/zyad-assistant.user.js
```

### 方式三：Via（免油猴）

Via 原生支持用户脚本，但要先开开关：

```
Via 菜单 → 设置 → 通用/脚本 → 打开「允许网页脚本」
```

不开这个脚本一行都不执行。

---

## ⚠ 已知浏览器限制（先看这段再装）

游戏是**三层嵌套**的，浏览器不一定往 iframe 注入脚本：

```
h.4399.com/play/262277.htm                  ← 脚本运行层（无游戏）
└─ iframe#gamelink → sda.4399.com/.../index.html        ← h5mini 壳
   └─ iframe → sda.4399.com/.../gameIndex.html          ← Laya 游戏本体
```

| 浏览器 | 能否正常用 | 说明 |
|---|---|---|
| Chrome / Edge / Firefox + Tampermonkey | ✅ 正常 | 最推荐 |
| Kiwi Browser + Tampermonkey | ✅ 正常 | Android 推荐 |
| Via 浏览器 | ⚠️ 看情况 | 见下 |
| iOS Safari | ❌ 不支持 | 需换 Stay / Browsers |

### Via 的两种处理

本脚本（v15.0 起）**不依赖 `@all-frames`**，而是由顶层脚本主动递归下钻注入，
所以在 Via 里通常能用。判断方法：

进游戏后按调试控制台执行：

```js
__ZYAD_TOP__.status()
```

看到 `gameIndex.html` 那一层 `hasCore: true, booted: true` 就是成功了。

若仍是 `false`，说明 Via 不允许跨域读 `contentDocument`，
此时只能换 Kiwi + Tampermonkey。

---

## 目录结构

```
.
├── web/index.html                       一键安装向导（GitHub Pages 首页）
├── userscript/
│   └── zyad-assistant.user.js           用户脚本本体
└── docs/
    ├── 01-数据定位.md                    字段定位过程
    └── 02-踩坑记录.md                    注入失败的各种原因
```

---

## 技术说明

### 为什么改真值而不是改显示

最初版本 Hook 了 Text 的 `text` setter 来伪装数字，
但游戏内部判定仍走真实字段，点几次就弹「馒头不足」。

后来定位到真实数据结构：

```js
// 战斗场景挂载点
Laya.stage._children[i]._children[j].Gw
  ├── Q2._gold      战斗内金币真值
  ├── Q2.Gs         征兵消耗（每帧重算）
  ├── Q2.Js         波次计数
  ├── _player._data._stamina   馒头真值（getter: player.stamina）
  └── _stamina.m2   体力上限（默认 30）
```

改成直接写这些字段后，界面与逻辑才一致。

### 「馒头不足」的真实含义

实测发现：馒头真值 9999 时仍会弹这个提示。
逐字段 diff 后确认——**征兵实际扣的是金币 `Q2._gold`**，
「馒头不足」只是复用的通用提示文案。

### 消耗数字压制

`Q2.Gs` 每帧被游戏重算，直接赋值无效，必须接管 setter：

```js
Object.defineProperty(Q2, 'Gs', {
  get: function () { return 2; },
  set: function () {}          // 拒绝写入
});
```

---

## 免责声明

本项目仅供学习研究浏览器存储机制、混淆代码分析与运行时注入技术。
请勿用于商业目的。使用者需自行确保符合当地法律法规与目标网站的服务条款。

游戏本体著作权属于原开发者，与本仓库无关。
