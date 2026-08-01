---
name: heading-font-unification
overview: 统一项目页 / 毕业去向页 / 加入我们 三页的标题排版：主标题(第一眼)统一 Inter 700 粗体，次级标题(卡片名/弹窗/年份/区块小标题)统一 Inter 400 细体；修正毕业去向页 monospace 年份字体不一致；并让全站标题字体族一致(Inter)，层级靠字重+字号拉开。
todos:
  - id: refactor-global
    content: 在 :root 新增 --title-weight/--subtitle-weight，重构全局 h1-h6 规则（h1=700 主标题，h2-h6=400 次级细体）
    status: completed
  - id: fix-main-titles
    content: 将项目页 .project-explorer-copy h1(568/818/1045) 与加入我们 .join-hero h1(448)、.inner-hero h1(445) 显式字重统一为 700
    status: completed
    dependencies:
      - refactor-global
  - id: fix-sub-titles
    content: 移除次级标题残留 600 强制字重：.section-heading h2(265)、.project-float-card h2(699)、.about-journey h2(520) 改为继承 400 细体
    status: completed
    dependencies:
      - refactor-global
  - id: fix-alumni-font
    content: 毕业去向页 .timeline-year > h2(1090) 由 monospace 改为 Inter 字体栈，确认主标题 700、弹窗/卡片 h3 继承 400
    status: completed
    dependencies:
      - refactor-global
  - id: verify
    content: 运行 read_lints，用 [skill:impeccable] 复核三页标题层级与字体族统一，确认部门页未改动
    status: completed
    dependencies:
      - fix-main-titles
      - fix-sub-titles
      - fix-alumni-font
---

## 用户需求

统一「项目页 / 毕业去向页 / 加入我们」三页的标题字体与字重规范，修正当前标题字体混乱的问题。

## 核心特性

- **统一原则**：每个页面「第一眼主标题」使用统一的 Inter 700 粗体；其余次级标题（卡片名、弹窗标题、年份、区块小标题）使用统一的 Inter 400 细体，恢复「主粗、次细」的清晰层级。
- **项目页**：主标题（探索器大标题 `.project-explorer-copy h1`）700 粗体；选中项目名（浮动卡片 `.project-float-card h2`）400 细体。
- **毕业去向页**：主标题 `.alumni-hero h1` 700 粗体；城市弹窗 / 卡片标题（h3）400 细体；年份标题 `.timeline-year > h2` 由 monospace 改为 Inter 字体栈、保持 400，消除同页字体族不一致。
- **加入我们**：主标题 `.join-hero h1` 700 粗体；招募要求 / 步骤 / 联系方式三段子标题统一为 400 细体（能统一即统一，不强求、保持精致）。
- **排除范围**：部门页（department）按用户要求保持原样，不纳入本次改造。
- **视觉目标**：全站标题字体族统一为 Inter（中文回退 PingFang SC / Microsoft YaHei），主副标题靠字重（700 vs 400）与字号形成层级，不再出现 monospace 混用或字重错乱。

## 技术栈

- 现有项目为原生 HTML/CSS/JS（无框架），标题样式全部位于 `styles.css`，本次仅修改 CSS，不涉及 JS 与 HTML 结构改动。
- 复用已定义的字体变量 `--font-display: "Inter", "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif`（:root 第 20 行），保持字体族统一。

## 实现方案

**策略**：撤销上一版「全局 h2/h3/h4 强制 600 粗体」的规则，改为「主标题显式 700、次级标题默认 400」的层级规范，仅针对具体选择器做最小必要覆盖，避免再次把次级标题加粗。

**关键技术决策**：

1. 在 `:root` 新增 `--title-weight:700` 与 `--subtitle-weight:400` 两个变量，使字重规范可一处调整、全局生效（可维护性 / SoC）。
2. 全局基础规则改为：`h1` 默认 700（所有主标题均为 h1，安全）；`h2,h3,h4,h5,h6` 默认 400 细体（次级标题默认即细）。这样「次级标题细体」成为默认行为，无需逐个设置。
3. 显式覆盖残留的 600 强制字重：`.section-heading h2, .feature-copy h2, .home-join h2, .form-intro h2`(265)、`.project-float-card h2`(699)、`.about-journey h2`(520) 移除 `font-weight:600`，回归 400。
4. 主标题中曾被设为 500/600 的 h1 显式提至 700：`.project-explorer-copy h1`(568/818/1045)、`.inner-hero h1`(445)、`.join-hero h1`(448)。`.alumni-hero h1`(1072)、`.about-hero h1`(493)、`.hero h1`(166) 已是 700，无需改。
5. 修正毕业去向页字体不一致：`.timeline-year > h2`(1090) 由 `font:400 52px/1 monospace` 改为 `font:400 52px/1 var(--font-display)`，统一为 Inter 字体族。

**性能与可靠性**：纯静态 CSS 覆盖，无运行时开销、无重排风险。改动集中在 `styles.css`，影响面可控，可用 lint 与浏览器目视校验。

## 实现注意事项

- 仅修改 `styles.css`；保留 `.brand`、`.network-center span` 等处 `ZXF XuanYa Trial` 品牌装饰字（非页面标题），不动。
- 部门页 `.department-detail h3`(301) 及部门关系图节点标签保持 600，不触碰。
- 改动后运行 `read_lints` 确认 `styles.css` 无错误。

## 架构设计

本任务为单文件 CSS 排版规范修正，无新增模块或组件，不涉及架构变更。层级规范如下：

| 角色 | 选择器示例 | 字体族 | 字重 |
| --- | --- | --- | --- |
| 主标题（第一眼） | `.project-explorer-copy h1` / `.alumni-hero h1` / `.join-hero h1` / `.about-hero h1` / `.hero h1` / `.inner-hero h1` | Inter | 700 |
| 次级标题 | `.section-heading h2` / `.project-float-card h2` / `.map-popup h3` / `.alumni-card h3` / `.timeline-year h2` / `.steps-grid h3` / `.requirement-card h3` / `.contact-route-grid h3` / `.about-journey h2` | Inter | 400 |


## 目录结构

```
styles.css   # [MODIFY] 标题字体规范统一。新增 --title-weight/--subtitle-weight 变量；
             # 重构全局 h1-h6 基础字重（h1=700 主标题，h2-h6=400 次级）；
             # 提主标题字重至 700、撤次级标题残留 600、修正 timeline-year 的 monospace 字体。
```

## 关键代码结构（核心 CSS 片段）

```css
:root{
  --font-display: "Inter","PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif;
  --title-weight: 700;      /* 第一眼主标题 */
  --subtitle-weight: 400;   /* 其余次级标题（细体） */
}
h1,h2,h3,h4,h5,h6{ font-family:var(--font-display); color:var(--ink); text-wrap:balance; font-feature-settings:"palt" 1; }
h1{ font-weight:var(--title-weight); letter-spacing:-.03em; line-height:1.04; }
h2,h3,h4,h5,h6{ font-weight:var(--subtitle-weight); letter-spacing:-.01em; line-height:1.2; }
```

## Agent Extensions

### Skill

- **impeccable**
- Purpose: 在改动完成后，对三页标题的视觉层级、字体族一致性与可读性做专业级排版审查。
- Expected outcome: 确认项目页 / 毕业去向页 / 加入我们 三页主标题均为 700 Inter 粗体、次级标题均为 400 Inter 细体，且毕业去向页年份不再为 monospace，全站标题字体族统一，部门页未受影响。