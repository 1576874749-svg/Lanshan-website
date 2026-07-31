# 变更日志 · 蓝山工作室官网交互原型

本项目纯前端高保真原型，围绕蓝山工作室的品牌、部门、项目、毕业去向与招新信息展示。
所有改动记录在 `git` 中；本文件汇总关键里程碑与当前工作区未提交改动。
格式参考 [Keep a Changelog](https://keepachangelog.com/)，无版本号阶段以 `Unreleased` 标记当前工作区状态。

---

## [Unreleased]（当前工作区，未提交 git）

> 以下为工作区相对最近一次提交 `59a0691` 的未提交改动。

### 修复 / 还原
- **首页粒子山恢复为原版完整效果**（`app.js` `particleLogo` 段整体还原）
  - 多峰山脊、表面填充粒子、等高轮廓线、星空闪烁、指针视差、点击爆炸重组全部还原。
  - 关键修复：将 SVG `path` 临时挂到 DOM 后再调用 `getTotalLength()` / `getPointAtLength()`，
    兼容对"未挂载 path"返回 0 长度的浏览器/内置 webview（否则所有点塌缩成底部一条直线，即之前看到的"直线"）。
  - 山形 path 已字面量化，未改动全局 `LOGO_MOUNTAIN_PATH`（L3），不影响 intro/brand/network/about 其他 logo。
  - `app.js` lint 0 错误。
- **悬浮"加入蓝山"按钮可见性修正**（`app.js` 路由控制）
  - 原逻辑在 `route === "home"` 时隐藏按钮，已改回：在首页、项目页、about 等页均显示，仅在「加入」页（`join`）隐藏。
- **保留项目粒子星系**
- **去掉首页中的历年年刊和we重邮**
- **优化视觉体验**

### 改动（工作区其他既有未提交改动，非本次引入）
- `index.html`（+80/−部分）：页脚（footer）等内容调整。
- `styles.css`（+273/−96）：双主题（明暗）样式、背景/遮罩等大量样式补充。
- `data/site-data.json`（±2）：数据微调。
- `package.json`（+3）：新增脚本/依赖。
- 新增未跟踪资源：`assets/`（logo 宽/方图、B站/微信/小红书二维码 SVG、字体 `zixin.ttf`）、
  `vendor/`（tdesign/vue）、`prototype-blueprint.html`、`color-tokens.html`、`index-tdesign.html`、
  `apply-map.mjs`、`map-outline.txt` 等。

### 待办 / 已知
- 粒子观感（山形美观度、性能卡顿）需浏览器实机确认（硬指标为人工亲验）。
- 工作区改动尚未 `git commit`；若需归档请单独提交。

---

## 已提交历史（里程碑）

| 提交 | 说明 |
|------|------|
| `96fdb42` | 搭建蓝山工作室交互原型基础框架 |
| `4109903` | 新增 Sites worker 入口 |
| `88805a8` | 将静态原型打包进 Sites worker |
| `ce17f1d` | 修订组织关系图项目与 logo 几何 |
| `1a8dda5` | 优化 logo 与部门拓扑 |
| `4878174` | 重做品牌体验与团队结构 |
| `977bc1d` | 增加品牌故事与发光粒子山 |
| `59a0691` | 将星系美术融入双主题体验 |

---

## 体验边界（来自 README）
- 招新群二维码、邮箱、地址、成员信息仍为占位内容。
- 毕业去向使用匿名示例数据。
- 蓝妹 3D 形象暂不实现。
- 动画尊重系统的"减少动态效果"设置。
