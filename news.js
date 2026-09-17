/* ===== 动态详情页逻辑（news.html 专用） ===== */

/* 正文块渲染器（结构化 JSON → HTML） */
const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function renderBlock(block) {
  switch (block.type) {
    case "p": return `<p>${escapeHtml(block.text)}</p>`;
    case "h3": return `<h3>${escapeHtml(block.text)}</h3>`;
    case "list": return `<ul>${block.items.map((it) => `<li>${escapeHtml(it)}</li>`).join("")}</ul>`;
    case "quote": return `<blockquote>${escapeHtml(block.text)}</blockquote>`;
    case "image": return `<figure><i class="corner" aria-hidden="true"></i><img src="${escapeHtml(block.src)}" alt="${escapeHtml(block.alt || "")}" loading="lazy" />${block.caption ? `<figcaption><b>▲</b> ${escapeHtml(block.caption)}</figcaption>` : ""}</figure>`;
    case "link": return `<p class="ark-link"><a href="${escapeHtml(block.href)}"${block.external ? ` target="_blank" rel="noopener"` : ""}><span class="join-label">${escapeHtml(block.label || "JOIN US")}</span><span class="txt">${escapeHtml(block.text)}</span><span class="go">→</span></a></p>`;
    default: return "";
  }
}

function renderContent(item) {
  if (Array.isArray(item.content) && item.content.length) {
    return item.content.map(renderBlock).join("");
  }
  /* 无 content 时降级：用 summary 撑起正文，保证每条都能打开 */
  return `<p>${escapeHtml(item.summary || "正文筹备中，敬请期待。")}</p>`;
}

/* 页面初始化 */
async function initNewsDetail() {
  let news = [];
  try {
    const response = await fetch("./data/site-data.json");
    news = (await response.json()).news ?? [];
  } catch (error) {
    console.error("动态数据加载失败", error);
  }

  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  const index = news.findIndex((n) => n.id === id);
  const item = news[index >= 0 ? index : 0];

  if (!item) { document.getElementById("arkTitle").textContent = "未找到该条动态"; return; }

  document.title = `${item.title} · 蓝山工作室`;
  document.getElementById("arkWatermark").textContent = `NEWS-${String(index + 1).padStart(2, "0")}`;
  document.getElementById("arkMeta").innerHTML =
    `<span class="code">${item.id}</span><span class="sep">//</span><span>${item.category}</span>`;
  document.getElementById("arkTitle").textContent = item.title;
  const dateEl = document.getElementById("arkDate");
  dateEl.dateTime = item.datetime;
  dateEl.textContent = item.date;
  document.getElementById("arkBody").innerHTML = renderContent(item);

  const prev = news[index - 1];
  const next = news[index + 1];
  document.getElementById("arkNav").innerHTML = [
    prev ? `<a class="prev" href="?id=${prev.id}"><small>← PREV // 上一篇</small><span class="t">${prev.title}</span></a>` : `<a class="prev disabled"><small>← PREV // 上一篇</small><span class="t">已是最新一条</span></a>`,
    next ? `<a class="next" href="?id=${next.id}"><small>NEXT // 下一篇 →</small><span class="t">${next.title}</span></a>` : `<a class="next disabled"><small>NEXT // 下一篇 →</small><span class="t">已是最后一条</span></a>`
  ].join("");

  /* 右侧信息栏：其他动态 */
  document.getElementById("railMore").innerHTML = news.map((n, i) => `
    <li><a class="${i === index ? "is-current" : ""}" href="?id=${n.id}"><small>${n.date} // ${n.category}</small><span class="t">${escapeHtml(n.title)}</span></a></li>`).join("");

  /* 版权年份动态更新 */
  const yearEl = document.getElementById("copyrightYear");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}

/* 阅读进度条 */
addEventListener("scroll", () => {
  const max = document.documentElement.scrollHeight - innerHeight;
  document.getElementById("arkProgress").style.width = max > 0 ? `${(scrollY / max) * 100}%` : "0";
}, { passive: true });

/* 明暗主题：与首页共用 localStorage，双向同步 */
const themeToggle = document.getElementById("themeToggle");
if (localStorage.getItem("lanshan-theme") === "dark") document.body.classList.add("dark");
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("lanshan-theme", document.body.classList.contains("dark") ? "dark" : "light");
});

initNewsDetail();
