# PROGRESS — 恢复首页粒子（山脊等）效果

## 理解目标
把当前 app.js 的简化版 particleLogo（直线山脊、420 粒子）还原成原版完整实现（多峰山脊、表面粒子、轮廓线、星空、交互）。仅改 app.js 内 particleLogo 整段。

## 顺序
1. 确认行号一致（已确认 L372-443 简化版 / 原版 L425-576）
2. 整体替换 particleLogo 段，3 处 LOGO_MOUNTAIN_PATH → 字面量山形 path
3. lint + grep 验收；lint=0
4. 预览逻辑核对：六处效果均实现

## 最大风险
原版 init 无 `if(!this.canvas)return` 守卫、且 animate 无 innerWidth>620 守卫——逐字复制即可（hero/canvas 已存在，try/catch 兜底）。3 处 path 替换需逐字一致，避免山脊变形。

## 结果
- 任务1：app.js lint 0 错误；makePoints/resize/animate/draw/explode、ridge/surface/contour/screenStar 全部存在；直线 `[[0,.6],[1,.4]]` 已无；3 处山形 path 字面量（L412/414/416）写入。
- 任务2：预览服务 HTTP 200 存活；六处效果代码已实现；reduced-motion 静态渲染。
- 白名单：本次仅改 app.js particleLogo 段；index.html/styles.css 与 LOGO_MOUNTAIN_PATH 全局定义未动。
- 备注：index.html/styles.css 的 git diff 属此前会话既有未提交改动，非本次引入。
