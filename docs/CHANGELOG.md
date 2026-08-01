# 变更日志 · 蓝山工作室官网交互原型

本项目纯前端高保真原型，围绕蓝山工作室的品牌、部门、项目、毕业去向与招新信息展示。
所有改动记录在 `git` 中；本文件汇总关键里程碑与当前工作区未提交改动。
格式参考 [Keep a Changelog](https://keepachangelog.com/)，无版本号阶段以 `Unreleased` 标记当前工作区状态。

---

## [Unreleased]（当前工作区，未提交 git）

> 以下为工作区相对最近一次提交 `a451d0d` 的未提交改动。

### 整理（本轮）
- **项目文件架构整理**
  - 设计规范与原型文档（`color-tokens.html`、`prototype-blueprint.html`、`index-tdesign.html`、`map-outline.txt`）归入新建 `docs/design/`；`CHANGELOG.md`、`PROGRESS.md` 归入 `docs/`；根目录 `README.md` 保留。
  - 新增 `docs/README.md` 作为文档索引，与项目级 `README.md` 区分定位。
  - 同步更新 `apply-map.mjs` 对 `map-outline.txt` 的路径引用为 `docs/design/map-outline.txt`，构建不受影响。

### 界面文案与英文标识（本轮）
- **「发展历程」区块恢复原始英文标识**（`index.html`）
  - 加回区块 kicker `OUR JOURNEY` 与三个里程碑的英文阶段标签 `2017` / `NOW` / `NEXT`（中文标题与描述保持不变）。
  - 依据本地备份 `lanshan-studio-website -8月1日/index.html` 还原；对应 `about-journey` 样式规则与备份一致，无需改动 `styles.css`。
- **移除部门相关英文代码标识**（`app.js`）
  - 删除部门详情面板、招新卡片上的 `DEPARTMENT 0X / code`，部门节点上的 `code · N GROUPS`，以及子团队树上的 `team.code`。
  - 仅保留中文部门名，节点 / 卡片版式不变；`app.js` 搜索复验 0 命中。

### 项目星系视图与交互（本轮）
- **项目点位置基于全量固定索引计算**（`app.js` `renderProjects` / `projectRipple.refreshCoordinates`）
  - 根因：原逻辑用「过滤后数组的局部 index」重算椭圆环角度，且 `refreshCoordinates` 用 `index%2` 角度抖动、`index%3` 半径抖动，导致切到「进行中 / 已完成」时同项目 index 改变 → 角度重排 → 与「全部」不对应、分布不均。
  - 改为按项目在**全量列表**中的固定 index 计算角度（`-π/2 + i/n·2π`），去掉抖动、固定半径，环上各点等距均匀。
  - 效果：「全部 / 进行中 / 已完成」三态下，同一项目停在同一位置，仅其余点消失；布局恢复为均匀椭圆环。
- **删除项目计数文本**（`index.html` / `app.js`）
  - 移除 `<p><span id="projectCount">…</span> PROJECTS</p>` 及其在 `renderProjects` 中的赋值（`app.js` 选择器不再引用，避免空引用报错），保留上方筛选 tabs。
- **修复移动端项目详情页滚动锁定**（`styles.css`）
  - `.project-explorer` 的 `touch-action: none` → `pan-y`：恢复移动端在星系区域的垂直下滑滚动，水平手势仍交应用（桌面星系拖拽不受影响）。`projectRipple` 的 `pointerdown` 无 `preventDefault`，不二次锁死；`scroll-locked` 仅菜单态使用，与项目页无关。

### 浮动「加入蓝山」按钮样式优化（本轮）
- **重做 `.floating-join` 视觉**（`styles.css`）
  - 背景由纯深蓝改为 `135°` 渐变（亮蓝→深蓝），加 `inset` 内高光，质感更立体。
  - 新增 hover 光泽扫过动画（`::after` 高光，`overflow:hidden` 裁剪）与箭头 `↗` 右上微动，按钮上抬 `-5px`。
  - 尺寸改由内容自适应（`padding:11px 19px`），移除原临时硬编码宽高，文字不再被截断。
  - 补 `:focus-visible` 蓝色描边（键盘可访问）与 `body.dark` 浅蓝渐变 + 深色文字适配。
  - 清理失效的 `.floating-join span` 规则（HTML 已无该元素）。

### 移动端导航栏与页脚布局修复（本轮）
- **导航栏操作按钮右对齐**（`styles.css`）
  - 根因：桌面端靠 `.desktop-nav` 的 `margin-left:auto` 把主体按钮推到右侧；移动端 `.desktop-nav` 隐藏后，`.header-actions`（主题按钮 + 汉堡菜单）失去推力，紧贴 logo 居左。
  - 在 `@media (max-width:920px)` 给 `.header-inner` 加 `justify-content:space-between`、`.header-actions` 加 `margin-left:auto`，确保 logo 居左、操作按钮居右；桌面端布局不受影响。
- **移动端页脚链接断行修复**（`styles.css`）
  - 根因：`.footer-links` 在移动端仍沿用桌面端 `repeat(2, max-content)`，列宽过窄使「关于蓝山」「毕业去向」等被竖向折行，且列间距不均。
  - 在 `@media (max-width:920px)` 与 `@media (max-width:600px)` 两档均将 `.footer-links` 改为单列 `1fr`（`gap:28px; justify-content:flex-start`），消除突兀换行、保持统一间距与可读性。

---

## [a451d0d] - 2026-07-31

> 暗色模式视觉问题修复（已提交）。

### Added
- `assets/logo-lanshan-wide-dark.png`：页脚 logo 暗色专用变体（黑字提亮为近白，山脊蓝与薄荷绿保留原色，透明底贴合暗色背景）。

### Changed
- **毕业去向地图与页脚衔接、区块分界**（`styles.css`）
  - 地图底部加向 `--bg` 渐隐蒙版，消除蓝绿调地图硬撞白色 footer 的割裂感；
  - 地图区块顶部加分界细线（蓝色渐隐线，沿用页脚细线语言）并加极淡薄荷底色，使标题栏与地图连成同色系区块、与上方 hero 明确分界。
- **开屏“蓝山工作室”标题修正**（`styles.css`）：强制白色并改用自定义书法字体 `ZXF XuanYa Trial`（深蓝背景上原深色字看不清）。
- **标题强调色统一**（双主题对齐）：首页 hero 与毕业去向 hero 中的“蓝山”均设为 `var(--blue)`，与「加入我们」中“真正有用”的强调色保持一致。
- **页脚 logo 暗色模式重做**（`index.html` / `styles.css`）：移除与暗底不搭的白色衬底卡片，改用暗色专用图。

### Fixed
- **首页粒子山恢复为原版完整效果**（`app.js` `particleLogo` 段整体还原）
  - 多峰山脊、表面填充粒子、等高轮廓线、星空闪烁、指针视差、点击爆炸重组全部还原。
  - 关键修复：将 SVG `path` 临时挂到 DOM 后再调用 `getTotalLength()` / `getPointAtLength()`，兼容对“未挂载 path”返回 0 长度的浏览器/内置 webview（否则所有点塌缩成底部一条直线）。
  - `app.js` lint 0 错误。
- **悬浮“加入蓝山”按钮可见性修正**（`app.js` 路由控制）：在首页、项目页、about 等页均显示，仅在「加入」页（`join`）隐藏。
- **项目页重做，首页、毕业去向页删减，视觉优化**（`app.js` / `index.html` / `styles.css` / `data/site-data.json`）。

### 待办 / 已知
- 粒子观感（山形美观度、性能卡顿）需浏览器实机确认（硬指标为人工亲验）。

---

## 已提交历史（里程碑）

| 提交 | 说明 |
|------|------|
| `a451d0d` | 修复暗色模式视觉问题：页脚 logo 暗色重做、开屏标题、强调色统一、地图与页脚分界 |
| `dffe029` | 项目页重做，首页、毕业去向页删减，视觉优化 |
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
- 动画尊重系统的“减少动态效果”设置。
