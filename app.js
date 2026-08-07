const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const LOGO_MOUNTAIN_PATH = "M215.59 85.17 C212.11 84.85 201.89 88.62 199.16 86.14 C164.19 54.37 150.05 2.28 141.77 4.92 C134.37 7.29 98.71 82.44 84.03 77.30 C76.96 74.82 74.96 66.80 63.92 63.32 C59.10 61.80 36.24 109.25 20.63 141.40 L29.31 139.76 C42.71 111.32 62.78 69.96 67.74 68.03 C70.65 66.90 73.82 76.63 89.10 81.66 C106.69 87.46 142.39 8.46 145.17 11.86 C146.85 13.92 185.40 89.61 205.46 92.78 C212.04 93.82 218.39 90.02 219.13 91.24 C221.23 94.70 228.28 110.72 229.00 112.19 L231.88 111.34 C231.31 110.25 220.93 85.65 215.59 85.17";

const state = {
  data: null,
  route: "home",
  department: null,
  projectFilter: "all",
  exploredProjects: new Set(),
  alumniView: "map",
  qrType: "recruit"
};

const app = {
  async init() {
    const response = await fetch("./data/site-data.json");
    state.data = await response.json();
    this.applyCanonicalLogo();
    this.setupIntro();
    this.renderDepartments();
    this.renderProjects();
    this.renderAlumni();
    this.renderJoin();
    this.bindNavigation();
    this.bindAlumniMap();
    this.bindTheme();
    this.bindScrollEffects();
    this.bindModals();
    this.routeFromHash(false);
    try { particleLogo.init(); } catch (error) { console.error("particle init failed", error); }
    try { projectRipple.init(); } catch (error) { console.error("project ripple init failed", error); }
  },

  applyCanonicalLogo() {
    $$(".intro-mountain, .brand svg path:first-child, .about-mark svg path:first-child").forEach((path) => {
      path.setAttribute("d", LOGO_MOUNTAIN_PATH);
    });
  },

  setupIntro() {
    const intro = $("#intro");
    const percent = $("#introPercent");
    const started = performance.now();
    const tick = (now) => {
      const value = Math.min(100, Math.round((now - started) / 20));
      percent.textContent = `${value}%`;
      if (value < 100) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    setTimeout(() => intro.classList.add("is-done"), 2250);
  },

  renderMetrics() {
    $("#metricGrid").innerHTML = state.data.metrics.map((metric) => `
      <article class="metric">
        <strong data-count="${metric.value}">0<small>${metric.suffix}</small></strong>
        <p>${metric.label}</p>
      </article>`).join("");
  },

  renderDepartments() {
    const items = state.data.departments.flatMap((dept) => [
      { ...dept, key: dept.id, type: "department", parentName: "蓝山工作室", children: dept.subteams?.map((team) => team.name) ?? [] },
      ...(dept.subteams ?? []).map((team) => ({ ...team, key: team.id, type: "group", parentId: dept.id, parentName: dept.name, children: [] }))
    ]);
    state.departmentItems = items;
    const total = items.length;
    $("#departmentCards").innerHTML = items.map((item, index) => {
      const angle = index / total * 360 - 90;
      const tilt = ((index * 7) % 11) - 5;
      const structure = item.type === "department"
        ? (item.children.length ? `下设 ${item.children.join(" · ")}` : "独立部门")
        : `所属 · ${item.parentName}`;
      return `
        <button class="department-card" type="button" data-department-card="${item.key}" data-card-index="${index}"
          style="--angle:${angle}deg;--tilt:${tilt}deg;--card-order:${index}" aria-label="查看${item.name}" aria-expanded="false">
          <span class="department-card-inner">
            <span class="department-card-face department-card-front">
              <span class="department-card-number">${String(index + 1).padStart(2, "0")}</span>
              <span class="department-card-mark"><i></i><b></b></span>
              <small>${item.type === "department" ? "DEPARTMENT" : "WORKING GROUP"}</small>
              <em>LANSHAN STUDIO</em>
            </span>
            <span class="department-card-face department-card-back">
              <span class="department-card-meta"><small>${item.code}</small><b>${String(index + 1).padStart(2, "0")}</b></span>
              <strong>${item.name}</strong>
              <span class="department-card-divider"></span>
              <p>${item.description}</p>
              <span class="department-card-tags">${item.tech.map((tag) => `<i>${tag}</i>`).join("")}</span>
              <span class="department-card-structure">${structure}</span>
            </span>
          </span>
        </button>`;
    }).join("");
    $("#departmentSky").innerHTML = Array.from({ length: 72 }, (_, index) => {
      const x = (index * 37 + 11) % 100;
      const y = (index * 61 + 17) % 100;
      const size = 1 + (index % 4);
      const delay = -(index % 13) * .24;
      return `<i style="left:${x}%;top:${y}%;width:${size}px;height:${size}px;animation-delay:${delay}s"></i>`;
    }).join("");
    $$(".department-card").forEach((card) => {
      const item = items[Number(card.dataset.cardIndex)];
      const identify = () => {
        if ($("#departmentExplorer").classList.contains("is-focused")) return;
        $("#departmentHoverName").textContent = item.name;
        $("#departmentHoverType").textContent = item.type === "department" ? "部门卡片 · 点击查看介绍" : `${item.parentName} · 点击查看组别介绍`;
      };
      card.addEventListener("mouseenter", identify);
      card.addEventListener("focus", identify);
      card.addEventListener("click", () => this.selectDepartment(item.key));
    });
    $("#departmentOrbit").addEventListener("mouseleave", () => {
      if ($("#departmentExplorer").classList.contains("is-focused")) return;
      $("#departmentHoverName").textContent = "探索部门与组别";
      $("#departmentHoverType").textContent = "移动鼠标，选择一张卡片";
    });
    $("#departmentReturn").addEventListener("click", () => this.closeDepartment());
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && $("#departmentExplorer")?.classList.contains("is-focused")) this.closeDepartment();
    });
  },

  selectDepartment(key) {
    const items = state.departmentItems ?? [];
    const selectedIndex = items.findIndex((item) => item.key === key);
    if (selectedIndex < 0) return;
    const selected = items[selectedIndex];
    const explorer = $("#departmentExplorer");
    explorer.classList.add("is-focused");
    $("#departmentHoverName").textContent = selected.name;
    $("#departmentHoverType").textContent = selected.type === "department" ? "部门介绍" : `${selected.parentName} · 组别介绍`;
    const cards = $$(".department-card");
    const others = cards.filter((_, index) => index !== selectedIndex);
    const rows = Math.ceil(others.length / 2);
    others.forEach((card, index) => {
      const side = index % 2 === 0 ? -1 : 1;
      const row = Math.floor(index / 2);
      const y = (row - (rows - 1) / 2) * 112;
      card.style.setProperty("--focus-x", `${side * 455}px`);
      card.style.setProperty("--focus-y", `${y}px`);
      card.style.setProperty("--focus-rotate", `${side * (7 + row * 2)}deg`);
    });
    cards.forEach((card, index) => {
      const isSelected = index === selectedIndex;
      card.classList.toggle("is-selected", isSelected);
      card.classList.toggle("is-retired", !isSelected);
      card.setAttribute("aria-expanded", String(isSelected));
    });
  },

  closeDepartment() {
    const explorer = $("#departmentExplorer");
    if (!explorer) return;
    explorer.classList.remove("is-focused");
    $$(".department-card").forEach((card) => {
      card.classList.remove("is-selected", "is-retired");
      card.setAttribute("aria-expanded", "false");
    });
    $("#departmentHoverName").textContent = "探索部门与组别";
    $("#departmentHoverType").textContent = "移动鼠标，选择一张卡片";
  },

  bindClueMagnifier() {
    const panel = $("#networkPanel");
    const lens = $("#clueMagnifier");
    const move = (event) => {
      if (innerWidth <= 600) return;
      const rect = panel.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const zoom = 1.48;
      const radius = lens.offsetWidth / 2;
      lens.style.left = `${x}px`;
      lens.style.top = `${y}px`;
      const clone = $("#clueMagnifierScene").firstElementChild;
      if (clone) clone.style.transform = `translate(${radius - x * zoom}px,${radius - y * zoom}px) scale(${zoom})`;
    };
    panel.addEventListener("pointerenter", (event) => {
      this.syncClueMagnifier();
      lens.classList.add("is-visible");
      move(event);
    });
    panel.addEventListener("pointermove", move);
    panel.addEventListener("pointerleave", () => lens.classList.remove("is-visible"));
    window.addEventListener("resize", () => this.syncClueMagnifier());
  },

  syncClueMagnifier() {
    const panel = $("#networkPanel");
    const scene = $("#clueBoardScene");
    const target = $("#clueMagnifierScene");
    if (!panel || !scene || !target || !panel.clientWidth) return;
    const clone = scene.cloneNode(true);
    clone.removeAttribute("id");
    clone.querySelectorAll("[id]").forEach((element) => element.removeAttribute("id"));
    clone.style.width = `${panel.clientWidth}px`;
    clone.style.height = `${panel.clientHeight}px`;
    target.replaceChildren(clone);
  },

  renderProjects() {
    const all = state.data.projects;
    const n = all.length;
    const mobile = innerWidth < 600;
    const compact = innerWidth < 920;
    const centerX = mobile ? 50 : compact ? 52 : 64;
    const centerY = mobile ? 68 : 56;
    const radiusX = mobile ? 38 : compact ? 40 : 27;
    const radiusY = mobile ? 24 : compact ? 26 : 30;
    const slot = (i) => {
      const angle = -Math.PI / 2 + i / n * Math.PI * 2;
      return { x: centerX + Math.cos(angle) * radiusX, y: centerY + Math.sin(angle) * radiusY };
    };
    const posById = {};
    all.forEach((project, i) => { posById[project.id] = slot(i); });

    const projects = all.filter((project) => state.projectFilter === "all" || project.status === state.projectFilter);
    $("#projectGrid").innerHTML = projects.map((project) => {
      const index = all.indexOf(project);
      const pos = posById[project.id];
      return `<button class="project-coordinate" data-project-coordinate="${project.id}" style="--x:${pos.x.toFixed(2)}%;--y:${pos.y.toFixed(2)}%;--delay:${(.45 + index * .085).toFixed(3)}s" aria-label="查看${project.name}">
        <b>${project.glyph}</b><span>${project.name}</span>
      </button>`;
    }).join("");
    $$("[data-project-coordinate]").forEach((marker) => {
      marker.addEventListener("click", () => this.showProjectCoordinate(marker.dataset.projectCoordinate));
    });
    projectRipple.refreshCoordinates?.();
    $("#projectFloatCard").classList.remove("is-visible");
  },

  openProject(id) {
    const project = state.data.projects.find((item) => item.id === id);
    const background = project.caseStudy?.background ?? project.description;
    const solution = project.caseStudy?.solution ?? project.summary;
    const impact = project.caseStudy?.impact ?? "成果数据与真实使用反馈将在项目资料确认后补充。";
    $("#projectModalContent").innerHTML = `
      <div class="modal-project-hero" style="--project-bg:${project.bg}">
        <p>${project.statusLabel.toUpperCase()} / ${project.year}</p><h2>${project.name}</h2><span>${project.summary}</span>
      </div>
      <div class="modal-project-body">
        <div class="case-study-grid">
          <article><small>01 / 背景</small><h3>项目背景</h3><p>${background}</p></article>
          <article><small>02 / 解决方案</small><h3>解决方案</h3><p>${solution}</p></article>
          <article><small>03 / 成果数据</small><h3>成果数据</h3><p>${impact}</p></article>
          <article><small>04 / 参与部门</small><h3>参与部门</h3><p>${project.owner}</p></article>
        </div>
        <div class="project-tags">${project.tech.map((tech) => `<span>${tech}</span>`).join("")}</div>
        <div class="modal-grid"><div><small>项目周期</small>${project.year}</div><div><small>项目状态</small>${project.statusLabel}</div><div><small>负责方向</small>${project.owner}</div><div><small>项目链接</small>原型阶段暂未开放</div></div>
      </div>`;
    $("#projectModal").showModal();
  },

  showProjectCoordinate(id) {
    const project = state.data.projects.find((item) => item.id === id);
    const background = project.caseStudy?.background ?? project.description;
    const solution = project.caseStudy?.solution ?? project.summary;
    const impact = project.caseStudy?.impact ?? "成果数据与真实使用反馈将在项目资料确认后补充。";
    $$("[data-project-coordinate]").forEach((marker) => marker.classList.toggle("is-active", marker.dataset.projectCoordinate === id));
    $("#projectFloatCard").innerHTML = `
      <button class="float-card-close" aria-label="关闭项目介绍">×</button>
      <small>${project.statusLabel.toUpperCase()} / ${project.year}</small>
      <h2>${project.name}</h2>
      <p>${project.description}</p>
      <div class="project-float-story">
        <section><span>01 / 背景</span><p>${background}</p></section>
        <section><span>02 / 解决方案</span><p>${solution}</p></section>
        <section><span>03 / 成果数据</span><p>${impact}</p></section>
      </div>
      <div class="project-float-meta">
        <span>项目状态<b>${project.statusLabel}</b></span>
        <span>参与部门<b>${project.owner}</b></span>
      </div>
      <div class="project-tags">${project.tech.map((tech) => `<span>${tech}</span>`).join("")}</div>`;
    $("#projectFloatCard").classList.add("is-visible");
    $(".float-card-close").addEventListener("click", () => {
      $("#projectFloatCard").classList.remove("is-visible");
      $$("[data-project-coordinate]").forEach((marker) => marker.classList.remove("is-active"));
      projectRipple.resume();
    });
    state.exploredProjects.add(id);
    $("#projectProgress").classList.add("is-visible");
    $("#projectProgress strong").textContent = `${state.exploredProjects.size} / ${state.data.projects.length}`;
    projectRipple.pauseForProject(id);
  },

  renderAlumni() {
    const pinPath = "M0,0 C-4,-7 -6,-11 -6,-14 C-6,-19 -3,-22 0,-22 C3,-22 6,-19 6,-14 C6,-11 4,-7 0,0 Z";
    $("#cityMarkers").innerHTML = state.data.cities.map((city) => {
      const count = state.data.alumni.filter((person) => person.city === city.name).length;
      const scale = Math.min(1.2, Math.max(0.8, count * 0.2 + 0.6));
      return `<g class="city-marker" data-city="${city.name}" tabindex="0" transform="translate(${city.x},${city.y})">
        <g transform="scale(${scale})">
          <path class="city-pin" d="${pinPath}"></path>
          <circle class="city-pin-dot" cx="0" cy="-16" r="3.5"></circle>
        </g>
        <text x="${city.dx ?? 11}" y="${city.dy ?? -11}" text-anchor="${city.anchor ?? "start"}">${city.name}</text>
      </g>`;
    }).join("");
    $$(".city-marker").forEach((marker) => {
      const select = (event) => { event.stopPropagation(); this.selectCity(marker.dataset.city); };
      marker.addEventListener("click", select);
      marker.addEventListener("keydown", (event) => event.key === "Enter" && select(event));
    });
    const mapArea = $(".china-map");
    if (mapArea) mapArea.addEventListener("click", (event) => {
      if (!event.target.closest(".city-marker")) this.clearCitySelection();
    });
  },

  clearCitySelection() {
    $$(".city-marker").forEach((marker) => marker.classList.remove("is-active"));
    const popup = $("#mapPopup");
    popup.classList.remove("is-visible");
    popup.innerHTML = `<h3>点击城市坐标</h3><span>查看蓝山成员从校园到行业的成长路径。</span>`;
  },

  selectCity(cityName) {
    const active = $$(".city-marker.is-active");
    if (active.length && active[0].dataset.city === cityName) {
      this.clearCitySelection();
      return;
    }
    $$(".city-marker").forEach((marker) => marker.classList.toggle("is-active", marker.dataset.city === cityName));
    const people = state.data.alumni.filter((person) => person.city === cityName);
    const popup = $("#mapPopup");
    popup.innerHTML = `
      <button class="map-popup-close" aria-label="关闭">×</button>
      <p>${cityName.toUpperCase()} / ${String(people.length).padStart(2, "0")} ALUMNI</p>
      <h3>${cityName}</h3>
      <span>从蓝山出发，在这里继续创造。</span>
      <div>${people.map((person) => `<div class="map-person"><strong>${person.name}</strong><small>${person.company} · ${person.role}</small></div>`).join("")}</div>`;

    const layout = $(".map-layout");
    const svg = $(".china-map svg");
    const city = state.data.cities.find((c) => c.name === cityName);
    if (layout && svg && city) {
      const layoutRect = layout.getBoundingClientRect();
      const svgRect = svg.getBoundingClientRect();
      const vb = svg.viewBox.baseVal;
      const meetScale = Math.min(svgRect.width / vb.width, svgRect.height / vb.height);
      const offsetX = (svgRect.width - vb.width * meetScale) / 2;
      const offsetY = (svgRect.height - vb.height * meetScale) / 2;
      const tipX = svgRect.left - layoutRect.left + offsetX + city.x * meetScale;
      const tipY = svgRect.top - layoutRect.top + offsetY + city.y * meetScale;
      const pw = popup.offsetWidth;
      const ph = popup.offsetHeight;
      let left = tipX + 16;
      let top = tipY - ph / 2;
      if (left + pw > layoutRect.width - 12) left = tipX - pw - 16;
      if (left < 12) left = 12;
      if (top < 12) top = 12;
      if (top + ph > layoutRect.height - 12) top = layoutRect.height - ph - 12;
      popup.style.left = `${left}px`;
      popup.style.top = `${top}px`;
    }
    popup.classList.add("is-visible");
    popup.querySelector(".map-popup-close").addEventListener("click", (e) => { e.stopPropagation(); this.clearCitySelection(); });
  },

  renderJoin() {
    $("#requirementsGrid").innerHTML = state.data.departments.map((dept, index) => `
      <article class="requirement-card"><h3>${dept.name}</h3><p>${dept.description}</p>${dept.subteams?.length ? `<div class="requirement-subteams">${dept.subteams.map((team) => `<b>${team.name}</b>`).join("")}</div>` : ""}<div class="tech-tags">${dept.tech.slice(0,3).map((tech) => `<span>${tech}</span>`).join("")}</div></article>`).join("");
    this.renderQrCards();
    this.updateCountdown();
    setInterval(() => this.updateCountdown(), 1000);
  },

  renderQrCards() {
    const isStudy = state.qrType === "study";
    $("#qrGrid").innerHTML = state.data.departments.map((dept) => `
      <article class="qr-card" data-qr="${dept.name}" data-qr-label="${isStudy ? "飞书学习群" : "招新群"}"><div class="fake-qr"></div><div><h3>${dept.name}</h3><p>${isStudy ? "飞书学习群 · 资料与答疑" : "招新群 · 示例二维码"}</p></div></article>`).join("");
    $$("[data-qr]").forEach((card) => card.addEventListener("click", () => this.openQr(card.dataset.qr, card.dataset.qrLabel)));
  },

  updateCountdown() {
    const target = new Date("2026-09-20T23:59:59+08:00");
    let diff = Math.max(0, target - new Date());
    const days = Math.floor(diff / 86400000); diff %= 86400000;
    const hours = Math.floor(diff / 3600000); diff %= 3600000;
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor(diff % 60000 / 1000);
    const values = [days, hours, minutes, seconds];
    $$("#countdown strong").forEach((item, index) => item.textContent = String(values[index]).padStart(2, "0"));
  },

  openQr(name, label) {
    $("#qrLarge").innerHTML = `<div class="fake-qr"></div><h2>${name}</h2><p>${label === "飞书学习群" ? "扫码加入飞书群，获取学习资料、前辈答疑与项目交流" : "微信扫码加入该部门招新群"}</p><small>${label} · 示例二维码 · 正式上线前替换</small>`;
    $("#qrModal").showModal();
  },

  bindNavigation() {
    window.addEventListener("hashchange", () => this.routeFromHash());
    $$("[data-route]").forEach((link) => link.addEventListener("click", (event) => {
      event.preventDefault();
      this.navigate(link.dataset.route);
    }));
    $$("[data-route-button]").forEach((button) => button.addEventListener("click", () => this.navigate(button.dataset.routeButton)));
    $$("[data-scroll-button]").forEach((button) => button.addEventListener("click", () => this.scrollTo(button.dataset.scrollButton)));
    $$("[data-scroll-target]").forEach((link) => link.addEventListener("click", (event) => {
      event.preventDefault();
      this.navigate(link.dataset.scrollTarget);
    }));
    $("#menuButton").addEventListener("click", () => this.toggleMenu());
    $$("#projectTabs button").forEach((button) => button.addEventListener("click", () => {
      state.projectFilter = button.dataset.filter;
      $$("#projectTabs button").forEach((item) => item.classList.toggle("is-active", item === button));
      this.renderProjects();
      const selected = projectRipple.selectedProject;
      if (selected && $(`[data-project-coordinate="${selected}"]`)) this.showProjectCoordinate(selected);
      else projectRipple.resume();
    }));
    $("#projectCore").addEventListener("click", () => projectRipple.ignite());
    $("#projectReset").addEventListener("click", () => projectRipple.reset());
    $$("#qrTabs button").forEach((button) => button.addEventListener("click", () => {
      state.qrType = button.dataset.qrType;
      $$("#qrTabs button").forEach((item) => item.classList.toggle("is-active", item === button));
      this.renderQrCards();
    }));
  },

  bindAlumniMap() {
    const map = $("#alumniMap");
    if (!map) return;
    $$("[data-alumni-scroll]").forEach((btn) => btn.addEventListener("click", () => {
      map.scrollIntoView({ behavior: "smooth", block: "start" });
    }));
  },

  navigate(route, updateHash = true, shouldScroll = true) {
    const validRoutes = ["home", "about", "projects", "departments", "alumni", "join"];
    const nextRoute = validRoutes.includes(route) ? route : "home";
    state.route = nextRoute;
    $$(".view").forEach((view) => view.classList.add("is-active"));
    $$("[data-route], [data-scroll-target]").forEach((link) => {
      const linkRoute = link.dataset.route || link.dataset.scrollTarget;
      link.classList.toggle("is-active", linkRoute === nextRoute);
    });
    $("#floatingJoin").classList.remove("is-hidden");
    if (updateHash) history.pushState(null, "", `#${nextRoute}`);
    if (shouldScroll) {
      if (nextRoute === "home") window.scrollTo({ top: 0, behavior: "smooth" });
      else this.scrollTo(nextRoute);
    }
    this.toggleMenu(false);
    if (nextRoute === "projects") setTimeout(() => projectRipple.resize(), 80);
  },

  routeFromHash(scroll = true) {
    const route = location.hash.replace("#", "");
    const validRoutes = ["home", "about", "projects", "departments", "alumni", "join"];
    this.navigate(validRoutes.includes(route) ? route : "home", false, scroll);
  },

  scrollTo(id) { document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); },

  toggleMenu(force) {
    const open = typeof force === "boolean" ? force : !$("#mobileMenu").classList.contains("is-open");
    $("#mobileMenu").classList.toggle("is-open", open);
    $("#mobileMenu").setAttribute("aria-hidden", String(!open));
    $("#menuButton").classList.toggle("is-open", open);
    $("#menuButton").setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("scroll-locked", open);
  },

  bindTheme() {
    const saved = localStorage.getItem("lanshan-theme");
    if (saved === "dark") document.body.classList.add("dark");
    $("#themeToggle").addEventListener("click", () => {
      document.body.classList.toggle("dark");
      localStorage.setItem("lanshan-theme", document.body.classList.contains("dark") ? "dark" : "light");
    });
  },

  bindScrollEffects() {
    window.addEventListener("scroll", () => $("#siteHeader").classList.toggle("is-scrolled", scrollY > 40), { passive: true });
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      if (entry.target.id === "metricGrid") this.animateCounters();
      observer.unobserve(entry.target);
    }), { threshold: .16 });
    $$(".reveal").forEach((element) => observer.observe(element));
  },

  animateCounters() {
    $$("[data-count]").forEach((element) => {
      const target = Number(element.dataset.count);
      const suffix = element.querySelector("small").outerHTML;
      const start = performance.now();
      const update = (now) => {
        const progress = Math.min(1, (now - start) / 1100);
        element.innerHTML = `${Math.round(target * (1 - (1 - progress) ** 3))}${suffix}`;
        if (progress < 1) requestAnimationFrame(update);
      };
      requestAnimationFrame(update);
    });
  },

  bindModals() {
    $("[data-close-modal]").addEventListener("click", () => $("#projectModal").close());
    $("[data-close-qr]").addEventListener("click", () => $("#qrModal").close());
    $$(".modal").forEach((modal) => modal.addEventListener("click", (event) => {
      if (event.target === modal) modal.close();
    }));
  },

  toast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2600);
  }
};

const particleLogo = {
  canvas: null, ctx: null, particles: [], pointer: { x: 0, y: 0 }, raf: null, burstStarted: 0,
  init() {
    this.canvas = $("#particleCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.resize();
    window.addEventListener("resize", () => this.resize());
    $("#hero").addEventListener("pointermove", (event) => {
      const rect = this.canvas.getBoundingClientRect();
      this.pointer.x = (event.clientX - rect.left) / rect.width - .5;
      this.pointer.y = (event.clientY - rect.top) / rect.height - .5;
    });
    $("#hero").addEventListener("pointerleave", () => { this.pointer.x = 0; this.pointer.y = 0; });
    this.canvas.addEventListener("click", () => this.explode());
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) this.animate();
    else this.draw(true);
  },
  explode() {
    this.burstStarted = performance.now();
  },
  makePoints() {
    const points = [];
    const measSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    measSvg.setAttribute("width", "0");
    measSvg.setAttribute("height", "0");
    measSvg.style.cssText = "position:absolute;left:-9999px;top:-9999px;overflow:hidden";
    document.body.appendChild(measSvg);
    const addSvgPath = (pathData, count, depth, layerIndex, layerCount) => {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", pathData);
      measSvg.appendChild(path);
      const total = path.getTotalLength();
      for (let i = 0; i < count; i++) {
        const point = path.getPointAtLength(i / (count - 1) * total);
        const normalizedDepth = layerCount <= 1 ? 0 : layerIndex / (layerCount - 1) - .5;
        points.push({
          x: (point.x / 270 - .5) * (1 + Math.abs(normalizedDepth) * .035) + .5,
          y: point.y / 150 + normalizedDepth * .025,
          z: depth + (Math.random() - .5) * .035,
          ridge: Math.abs(normalizedDepth) < .04
        });
      }
    };
    const layerCount = innerWidth < 620 ? 7 : 15;
    for (let layer = 0; layer < layerCount; layer++) {
      const depth = (layer / (layerCount - 1) - .5) * 1.8;
      addSvgPath("M12 134 L58 58 Q64 48 74 58 Q96 82 111 75 Q127 68 142 43 L168 8 Q172 2 177 12 L218 98 Q225 113 235 108 Q245 104 250 119 L258 139", innerWidth < 620 ? 105 : 190, depth, layer, layerCount);
    }
    addSvgPath("M12 134 L58 58 Q64 48 74 58 Q96 82 111 75 Q127 68 142 43 L168 8 Q172 2 177 12 L218 98 Q225 113 235 108 Q245 104 250 119 L258 139", innerWidth < 620 ? 250 : 520, 0, 0, 1);
    const ridgePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    ridgePath.setAttribute("d", "M12 134 L58 58 Q64 48 74 58 Q96 82 111 75 Q127 68 142 43 L168 8 Q172 2 177 12 L218 98 Q225 113 235 108 Q245 104 250 119 L258 139");
    measSvg.appendChild(ridgePath);
    const ridgeLength = ridgePath.getTotalLength();
    const ridgeSamples = Array.from({ length: 360 }, (_, index) => {
      const point = ridgePath.getPointAtLength(index / 359 * ridgeLength);
      return { x: point.x / 270, y: point.y / 150 };
    });
    const ridgeAt = (x) => ridgeSamples.reduce((nearest, point) =>
      Math.abs(point.x - x) < Math.abs(nearest.x - x) ? point : nearest
    ).y;
    const faceCount = innerWidth < 620 ? 650 : 2300;
    for (let i = 0; i < faceCount; i++) {
      const x = .045 + Math.random() * .91;
      const top = ridgeAt(x);
      const depthOnFace = Math.pow(Math.random(), .82);
      const y = top + (.935 - top) * depthOnFace;
      const faceArc = Math.sin(depthOnFace * Math.PI);
      points.push({
        x,
        y,
        z: faceArc * (.28 + Math.sin(x * Math.PI) * .62) + (Math.random() - .5) * .1,
        surface: true
      });
    }
    const contourLevels = innerWidth < 620 ? 4 : 8;
    for (let level = 1; level <= contourLevels; level++) {
      for (let i = 0; i < (innerWidth < 620 ? 70 : 150); i++) {
        const x = .045 + i / (innerWidth < 620 ? 69 : 149) * .91;
        const top = ridgeAt(x);
        const depthOnFace = level / (contourLevels + 1);
        points.push({
          x,
          y: top + (.935 - top) * depthOnFace,
          z: Math.sin(depthOnFace * Math.PI) * (.3 + Math.sin(x * Math.PI) * .6),
          contour: true
        });
      }
    }
    for(let i=0;i<(innerWidth < 620 ? 120 : 280);i++) points.push({
      x:Math.random(),
      y:Math.random(),
      z:0,
      size:.45+Math.random()*1.8,
      screenStar:true
    });
    measSvg.remove();
    this.particles = points.map((point, index) => ({...point, seed:index*.37+Math.random()*4}));
  },
  resize() {
    const ratio = Math.min(devicePixelRatio, 2);
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * ratio;
    this.canvas.height = rect.height * ratio;
    this.ctx.setTransform(ratio,0,0,ratio,0,0);
    this.width = rect.width; this.height = rect.height;
    this.makePoints();
  },
  animate(time=0) { this.draw(false,time); this.raf=requestAnimationFrame((t)=>this.animate(t)); },
  draw(staticFrame=false,time=0) {
    const ctx=this.ctx,w=this.width,h=this.height;
    ctx.clearRect(0,0,w,h);
    const burstProgress=this.burstStarted?Math.min(1,(time-this.burstStarted)/2200):1;
    const burst=burstProgress<1?Math.sin(burstProgress*Math.PI):0;
    if(burstProgress>=1)this.burstStarted=0;
    const mobile=w<780, scale=Math.min(w*(mobile?.95:.48),h*(mobile?.42:.63));
    const cx=mobile?w*.56:w*.73,cy=mobile?h*.68:h*.47;
    const angleY=this.pointer.x*.68+(staticFrame?-.12:Math.sin(time*.00022)*.16);
    const angleX=-.08-this.pointer.y*.3+(staticFrame?0:Math.cos(time*.00017)*.035);
    const dark=document.body.classList.contains("dark");
    ctx.globalCompositeOperation=dark?"lighter":"source-over";
    for(const p of this.particles){
      if(p.screenStar){
        const twinkle=.35+Math.sin(time*.0012+p.seed)*.28;
        ctx.globalAlpha=dark?twinkle:.12+twinkle*.22;
        ctx.fillStyle=dark?"#d9f7ff":"#526fa8";
        const starX=p.x*w,starY=p.y*h;
        ctx.beginPath();ctx.arc(starX,starY,p.size,0,Math.PI*2);ctx.fill();
        if(p.size>1.7){
          ctx.globalAlpha*=.55;
          ctx.strokeStyle=dark?"#9eeeff":"#6a88bf";
          ctx.lineWidth=.7;
          ctx.beginPath();
          ctx.moveTo(starX-p.size*3,starY);ctx.lineTo(starX+p.size*3,starY);
          ctx.moveTo(starX,starY-p.size*3);ctx.lineTo(starX,starY+p.size*3);
          ctx.stroke();
        }
        continue;
      }
      const burstAngle=p.seed*2.399;
      const burstForce=burst*scale*(p.ambient?.38:.56)*(0.55+(p.seed%1)*.65);
      let x=(p.x-.5)*scale*1.35+Math.cos(burstAngle)*burstForce;
      let y=(p.y-.5)*scale+Math.sin(burstAngle)*burstForce*.72;
      let z=p.z*scale*.42+Math.sin(p.seed*.83)*burstForce*.9;
      const x1=x*Math.cos(angleY)-z*Math.sin(angleY),z1=x*Math.sin(angleY)+z*Math.cos(angleY);
      const y1=y*Math.cos(angleX)-z1*Math.sin(angleX),z2=y*Math.sin(angleX)+z1*Math.cos(angleX);
      const perspective=700/(700+z2);
      const sx=cx+x1*perspective,sy=cy+y1*perspective;
      if(p.ambient){ctx.globalAlpha=.18+Math.sin(time*.001+p.seed)*.11;ctx.fillStyle=dark?"#bdeeff":"#526fa8";}
      else{
        const depthLight=Math.max(0,Math.min(1,(p.z+1.1)/2.2));
        ctx.globalAlpha=(p.ridge?.78:p.contour?.46:p.surface?.16+depthLight*.2:.22+depthLight*.2)+Math.sin(time*.0018+p.seed)*.07;
        ctx.fillStyle=p.ridge?(dark?"#9ff5ff":"#365b9e"):p.contour?(dark?"#62e8ff":"#5f82bd"):p.surface?(dark?"#28c7f4":"#7898cc"):(dark?"#4cdfff":"#607fb7");
      }
      const size=(p.ambient?1.05:(p.ridge?1.7:p.contour?1.35:p.surface?1.05:1.18))*perspective;
      ctx.beginPath();ctx.arc(sx,sy,size,0,Math.PI*2);ctx.fill();
    }
    ctx.globalCompositeOperation="source-over";
    ctx.globalAlpha=1;
  }
};

const projectRipple = {
  canvas: null,
  ctx: null,
  width: 0,
  height: 0,
  particles: [],
  ambient: [],
  coordinates: [],
  phase: "sphere",
  phaseStarted: 0,
  paused: false,
  selectedProject: "",
  yaw: 0,
  pitch: -1.05,
  targetYaw: 0,
  targetPitch: -1.05,
  spin: 0,
  lastTime: 0,
  drag: null,
  pointerInside: false,
  pointerX: 0,
  pointerY: 0,
  igniting: false,
  formationDuration: 3000,
  phaseTimer: null,

  init() {
    this.canvas = $("#projectRippleCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.gravityCursor = $("#projectGravityCursor");
    this.makeParticles();
    this.refreshCoordinates();
    this.resize();
    window.addEventListener("resize", () => this.resize());
    const explorer = $("#projectExplorer");
    explorer.addEventListener("pointermove", (event) => this.handlePointerMove(event));
    explorer.addEventListener("pointerleave", (event) => {
      if (event.pointerType === "mouse") {
        this.pointerInside = false;
        explorer.classList.remove("is-gravity-active");
        this.gravityCursor.classList.remove("is-visible", "is-engaged");
        this.targetYaw = 0;
        this.targetPitch = -1.05;
      }
    });
    explorer.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse") return;
      this.drag = { id: event.pointerId, x: event.clientX, y: event.clientY, yaw: this.targetYaw, pitch: this.targetPitch };
      explorer.setPointerCapture?.(event.pointerId);
    });
    explorer.addEventListener("pointerup", (event) => {
      if (this.drag?.id === event.pointerId) this.drag = null;
    });
    explorer.addEventListener("pointercancel", () => { this.drag = null; });
    requestAnimationFrame((time) => this.animate(time));
  },

  makeParticles() {
    const count = innerWidth < 620 ? 1500 : 3200;
    const softNoise = () => (Math.random() + Math.random() + Math.random() + Math.random()) / 4 - .5;
    this.particles = Array.from({ length: count }, (_, index) => {
      const sphereY = 1 - index / (count - 1) * 2;
      const sphereRadius = Math.sqrt(Math.max(0, 1 - sphereY * sphereY));
      const sphereTheta = Math.PI * (3 - Math.sqrt(5)) * index;
      const fieldAngle = Math.random() * Math.PI * 2;
      const distribution = Math.random();
      // A continuous stellar disc: bright, dense core fading into fine outer lanes.
      // The radius bands stay soft so the field feels natural rather than like
      // mechanically drawn concentric circles.
      const smoothRadius = Math.pow(Math.random(), distribution < .34 ? 1.9 : .72);
      const laneIndex = 1 + Math.floor(Math.random() * 7);
      const laneRadius = laneIndex / 7.8 + softNoise() * .055;
      const fieldRadius = distribution < .24
        ? Math.max(.025, Math.min(1.02, laneRadius))
        : smoothRadius;
      const softEdge = 1 + softNoise() * .045;
      let galaxyX = Math.cos(fieldAngle) * fieldRadius * softEdge;
      let galaxyY = Math.sin(fieldAngle) * fieldRadius * softEdge;
      const ellipseTilt = -.55;
      const ellipseAspect = .98;
      const ellipseY = galaxyY * ellipseAspect;
      const tiltedX = galaxyX * Math.cos(ellipseTilt) - ellipseY * Math.sin(ellipseTilt);
      const tiltedY = galaxyX * Math.sin(ellipseTilt) + ellipseY * Math.cos(ellipseTilt);
      galaxyX = tiltedX;
      galaxyY = tiltedY;
      const galaxyRadius = Math.hypot(galaxyX, galaxyY);
      const thickness = softNoise() * (.025 + (1 - Math.min(1, galaxyRadius)) * .025);
      const burstTheta = Math.random() * Math.PI * 2;
      const burstPhi = Math.acos(2 * Math.random() - 1);
      return {
        sphere: {
          x: Math.cos(sphereTheta) * sphereRadius,
          y: sphereY,
          z: Math.sin(sphereTheta) * sphereRadius
        },
        galaxy: {
          x: galaxyX,
          y: galaxyY,
          z: thickness
        },
        burst: {
          x: Math.sin(burstPhi) * Math.cos(burstTheta) * (1.15 + Math.random() * .72),
          y: Math.sin(burstPhi) * Math.sin(burstTheta) * (1.15 + Math.random() * .72),
          z: Math.cos(burstPhi) * (1.15 + Math.random() * .72)
        },
        drift: {
          x: softNoise() * .58,
          y: softNoise() * .48,
          z: softNoise() * .26
        },
        palette: index % 11 === 0 ? 2 : index % 7 === 0 ? 3 : index % 3,
        size: .45 + Math.random() * 1.35,
        seed: index * .618 + Math.random() * 4
      };
    });
    this.ambient = Array.from({ length: innerWidth < 620 ? 170 : 430 }, (_, index) => ({
      x: Math.random() * 2 - 1,
      y: Math.random() * 2 - 1,
      z: Math.random() * 2 - 1,
      size: .35 + Math.random() * 1.7,
      seed: index * .91 + Math.random() * 3
    }));
  },

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const ratio = Math.min(devicePixelRatio, 2);
    this.canvas.width = Math.round(rect.width * ratio);
    this.canvas.height = Math.round(rect.height * ratio);
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    this.width = rect.width;
    this.height = rect.height;
  },

  refreshCoordinates() {
    const markers = $$("[data-project-coordinate]");
    const all = state.data.projects;
    const n = Math.max(1, all.length);
    this.coordinates = markers.map((marker) => {
      const index = Math.max(0, all.findIndex((project) => project.id === marker.dataset.projectCoordinate));
      const angle = -Math.PI / 2 + index / n * Math.PI * 2;
      const radius = .42;
      const rawX = Math.cos(angle) * radius;
      const rawY = Math.sin(angle) * radius * .98;
      const ellipseTilt = -.55;
      return {
        id: marker.dataset.projectCoordinate,
        marker,
        x: rawX * Math.cos(ellipseTilt) - rawY * Math.sin(ellipseTilt),
        y: rawX * Math.sin(ellipseTilt) + rawY * Math.cos(ellipseTilt),
        z: (index % 2 ? 1 : -1) * .018
      };
    });
  },

  handlePointerMove(event) {
    if (this.paused) return;
    const explorer = $("#projectExplorer");
    const rect = explorer.getBoundingClientRect();
    if (this.phase === "galaxy" && this.drag?.id === event.pointerId) {
      const dx = (event.clientX - this.drag.x) / Math.max(rect.width, 1);
      const dy = (event.clientY - this.drag.y) / Math.max(rect.height, 1);
      this.targetYaw = Math.max(-.38, Math.min(.38, this.drag.yaw + dx * 1.25));
      this.targetPitch = Math.max(-1.22, Math.min(-.86, this.drag.pitch + dy * .5));
      return;
    }
    if (event.pointerType !== "mouse") return;
    this.pointerInside = true;
    this.pointerX = event.clientX - rect.left;
    this.pointerY = event.clientY - rect.top;
    const overControl = Boolean(event.target.closest("a, button:not(#projectCore), aside, .project-explorer-toolbar"));
    const gravityVisible = this.phase === "sphere" && !overControl;
    explorer.classList.toggle("is-gravity-active", gravityVisible);
    this.gravityCursor.classList.toggle("is-visible", gravityVisible);
    this.gravityCursor.style.left = `${this.pointerX}px`;
    this.gravityCursor.style.top = `${this.pointerY}px`;
    const sphereCenterX = rect.width * .5;
    const sphereCenterY = rect.height * .5;
    const sphereRadius = Math.min(rect.height * .15, rect.width * .23);
    this.gravityCursor.classList.toggle(
      "is-engaged",
      gravityVisible && Math.hypot(this.pointerX - sphereCenterX, this.pointerY - sphereCenterY) < sphereRadius * 1.2
    );
    if (this.phase !== "galaxy") return;
    const nx = (event.clientX - rect.left) / rect.width - .5;
    const ny = (event.clientY - rect.top) / rect.height - .5;
    this.targetYaw = Math.max(-.28, Math.min(.28, nx * .56));
    this.targetPitch = Math.max(-1.22, Math.min(-.86, -1.05 + ny * .32));
  },

  ignite() {
    if (this.phase !== "sphere" || this.igniting) return;
    this.igniting = true;
    const explorer = $("#projectExplorer");
    const rect = explorer.getBoundingClientRect();
    if (!this.pointerInside) {
      this.pointerX = rect.width * .5;
      this.pointerY = rect.height * .5;
      this.gravityCursor.style.left = `${this.pointerX}px`;
      this.gravityCursor.style.top = `${this.pointerY}px`;
    }
    explorer.classList.add("is-gravity-active", "is-igniting");
    this.gravityCursor.classList.add("is-visible", "is-engaged", "is-charging");
    setTimeout(() => {
      this.igniting = false;
      explorer.classList.remove("is-igniting");
      this.gravityCursor.classList.remove("is-charging");
      this.explode();
    }, 260);
  },

  explode() {
    if (this.phase !== "sphere") return;
    clearTimeout(this.phaseTimer);
    this.phase = "transition";
    this.phaseStarted = performance.now();
    const explorer = $("#projectExplorer");
    this.targetYaw = 0;
    this.targetPitch = -1.05;
    explorer.classList.remove("is-gravity-active");
    this.gravityCursor.classList.remove("is-visible", "is-engaged");
    explorer.classList.add("is-launching");
    explorer.classList.remove("is-resetting");
    this.phaseTimer = setTimeout(() => {
      this.phase = "galaxy";
      explorer.classList.remove("is-launching");
      explorer.classList.add("is-explored", "is-galaxy");
      this.refreshCoordinates();
    }, this.formationDuration);
  },

  pauseForProject(id) {
    this.paused = true;
    this.selectedProject = id;
    $("#projectExplorer").classList.add("has-selection");
  },

  resume() {
    this.paused = false;
    this.selectedProject = "";
    $("#projectExplorer").classList.remove("has-selection");
  },

  reset() {
    if (this.phase === "sphere" || this.phase === "resetting") return;
    clearTimeout(this.phaseTimer);
    this.resume();
    $("#projectFloatCard").classList.remove("is-visible");
    $$("[data-project-coordinate]").forEach((marker) => marker.classList.remove("is-active"));
    const explorer = $("#projectExplorer");
    explorer.classList.remove("is-explored", "is-galaxy", "is-launching");
    explorer.classList.add("is-resetting");
    this.phase = "resetting";
    this.phaseStarted = performance.now();
    this.phaseTimer = setTimeout(() => {
      this.phase = "sphere";
      this.phaseStarted = 0;
      this.spin = 0;
      this.yaw = this.targetYaw = 0;
      this.pitch = this.targetPitch = -1.05;
      explorer.classList.remove("is-resetting");
    }, 1550);
  },

  animate(time) {
    const delta = Math.min(32, time - (this.lastTime || time));
    this.lastTime = time;
    if (!this.paused) {
      this.yaw += (this.targetYaw - this.yaw) * .045;
      this.pitch += (this.targetPitch - this.pitch) * .045;
      if (Math.abs(this.targetYaw - this.yaw) < .0005) this.yaw = this.targetYaw;
      if (Math.abs(this.targetPitch - this.pitch) < .0005) this.pitch = this.targetPitch;
      if (this.phase === "galaxy") this.spin += (0 - this.spin) * .04;
    }
    this.draw(time);
    requestAnimationFrame((next) => this.animate(next));
  },

  draw(time) {
    if (!this.width || !this.height) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const cx = w * .5;
    const cy = h * .5;
    const dark = document.body.classList.contains("dark");
    const palette = dark
      ? ["245,250,255", "130,219,255", "101,157,255", "201,228,255"]
      : ["57,91,171", "90,112,215", "30,172,205", "123,92,205"];
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = dark ? "lighter" : "source-over";
    const galaxyVisible = this.phase !== "sphere";
    if (galaxyVisible) this.drawAmbient(ctx, w, h, cx, cy, dark, time);
    const elapsed = this.phaseStarted ? time - this.phaseStarted : 0;
    const transition = this.phase === "transition" ? Math.min(1, elapsed / this.formationDuration) : this.phase === "galaxy" ? 1 : 0;
    const resetProgress = this.phase === "resetting" ? Math.min(1, elapsed / 1550) : 0;
    const scale = Math.min(w * (w < 600 ? .58 : .48), h * (w < 600 ? .48 : .6));
    const sphereScale = Math.min(h * .15, w * .23);
    const formation = transition <= .43 ? 0 : this.ease((transition - .43) / .57);
    const burstProgress = transition <= .32 ? this.easeOut(transition / .32) : 1;
    const collapse = this.ease(resetProgress);

    if (this.phase === "galaxy" || formation > .12 || this.phase === "resetting") {
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, scale * .35);
      glow.addColorStop(0, dark ? "rgba(190,230,255,.22)" : "rgba(84,118,210,.16)");
      glow.addColorStop(.25, dark ? "rgba(55,155,220,.1)" : "rgba(86,106,206,.07)");
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.globalAlpha = this.phase === "resetting" ? 1 - collapse : formation;
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.ellipse(cx, cy, scale * .42, scale * .18, -.28, 0, Math.PI * 2);
      ctx.fill();
    }

    const sphereRotation = time * .00008;
    for (const particle of this.particles) {
      let point;
      let objectScale;
      let rotationPitch = 0;
      let rotationYaw = sphereRotation;
      let screenRoll = 0;
      if (this.phase === "sphere") {
        point = particle.sphere;
        objectScale = sphereScale;
      } else if (this.phase === "transition") {
        const exploded = {
          x: this.mix(particle.sphere.x, particle.burst.x, burstProgress),
          y: this.mix(particle.sphere.y, particle.burst.y, burstProgress),
          z: this.mix(particle.sphere.z, particle.burst.z, burstProgress)
        };
        const arc = Math.sin(formation * Math.PI);
        point = {
          x: this.mix(exploded.x, particle.galaxy.x, formation) + particle.drift.x * arc,
          y: this.mix(exploded.y, particle.galaxy.y, formation) + particle.drift.y * arc,
          z: this.mix(exploded.z, particle.galaxy.z, formation) + particle.drift.z * arc
        };
        objectScale = this.mix(sphereScale, scale, formation);
        rotationPitch = this.pitch * formation;
        rotationYaw = this.mix(sphereRotation, this.yaw, formation);
        screenRoll = -.18 * formation;
      } else if (this.phase === "resetting") {
        point = {
          x: this.mix(particle.galaxy.x, particle.sphere.x, collapse),
          y: this.mix(particle.galaxy.y, particle.sphere.y, collapse),
          z: this.mix(particle.galaxy.z, particle.sphere.z, collapse)
        };
        objectScale = this.mix(scale, sphereScale, collapse);
        rotationPitch = this.pitch * (1 - collapse);
        rotationYaw = this.mix(this.yaw, sphereRotation, collapse);
        screenRoll = -.18 * (1 - collapse);
      } else {
        point = particle.galaxy;
        objectScale = scale;
        rotationPitch = this.pitch;
        rotationYaw = this.yaw;
        screenRoll = -.18;
      }
      const projected = this.project(point, objectScale, cx, cy, rotationYaw, rotationPitch, this.phase === "galaxy" ? this.spin : 0, screenRoll);
      let drawX = projected.x;
      let drawY = projected.y;
      let attraction = 0;
      if (this.phase === "sphere" && this.pointerInside) {
        const dx = this.pointerX - projected.x;
        const dy = this.pointerY - projected.y;
        const distance = Math.hypot(dx, dy);
        const attractionRadius = Math.min(155, w * .18);
        if (distance < attractionRadius) {
          attraction = (1 - distance / attractionRadius) ** 2;
          const pull = this.igniting ? .42 : .2;
          drawX += dx * attraction * pull;
          drawY += dy * attraction * pull;
        }
      }
      const depth = Math.max(0, Math.min(1, (projected.depth + objectScale) / (objectScale * 2)));
      const twinkle = .78 + Math.sin(time * .002 + particle.seed) * .22;
      ctx.globalAlpha = Math.min(1, (.17 + depth * .68) * twinkle + attraction * (this.igniting ? .38 : .22));
      ctx.fillStyle = `rgb(${palette[particle.palette]})`;
      ctx.beginPath();
      ctx.arc(drawX, drawY, particle.size * projected.perspective * (depth > .7 ? 1.25 : 1) * (1 + attraction * .36), 0, Math.PI * 2);
      ctx.fill();
    }

    if (this.phase === "galaxy") this.updateCoordinateMarkers(scale, cx, cy);
    else if (this.phase !== "transition" || formation < .82) this.hideCoordinateMarkers();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  },

  drawAmbient(ctx, w, h, cx, cy, dark, time) {
    for (const star of this.ambient) {
      const parallaxX = this.yaw * star.z * w * .08;
      const parallaxY = (this.pitch + 1.05) * star.z * h * .12;
      const x = cx + star.x * w * .58 + parallaxX;
      const y = cy + star.y * h * .58 + parallaxY;
      const alpha = (dark ? .22 : .08) + (.5 + Math.sin(time * .0012 + star.seed) * .5) * (dark ? .5 : .18);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = dark ? "#f4fbff" : "#4769b3";
      ctx.beginPath();
      ctx.arc(x, y, star.size, 0, Math.PI * 2);
      ctx.fill();
      if (star.size > 1.65) {
        ctx.globalAlpha = alpha * .5;
        ctx.strokeStyle = dark ? "#dff8ff" : "#6582c2";
        ctx.lineWidth = .6;
        ctx.beginPath();
        ctx.moveTo(x - star.size * 3, y);
        ctx.lineTo(x + star.size * 3, y);
        ctx.moveTo(x, y - star.size * 3);
        ctx.lineTo(x, y + star.size * 3);
        ctx.stroke();
      }
    }
  },

  project(point, scale, cx, cy, yaw, pitch, spin, screenRoll = 0) {
    const spinCos = Math.cos(spin);
    const spinSin = Math.sin(spin);
    const x0 = point.x * spinCos - point.y * spinSin;
    const y0 = point.x * spinSin + point.y * spinCos;
    const z0 = point.z;
    const pitchCos = Math.cos(pitch);
    const pitchSin = Math.sin(pitch);
    const y1 = y0 * pitchCos - z0 * pitchSin;
    const z1 = y0 * pitchSin + z0 * pitchCos;
    const yawCos = Math.cos(yaw);
    const yawSin = Math.sin(yaw);
    const x2 = x0 * yawCos + z1 * yawSin;
    const z2 = -x0 * yawSin + z1 * yawCos;
    const depth = z2 * scale;
    const perspective = 1050 / (1050 + depth);
    const projectedX = x2 * Math.cos(screenRoll) - y1 * Math.sin(screenRoll);
    const projectedY = x2 * Math.sin(screenRoll) + y1 * Math.cos(screenRoll);
    return { x: cx + projectedX * scale * perspective, y: cy + projectedY * scale * perspective, depth, perspective };
  },

  updateCoordinateMarkers(scale, cx, cy) {
    for (const coordinate of this.coordinates) {
      const projected = this.project(coordinate, scale, cx, cy, this.yaw, this.pitch, this.spin, -.18);
      const depthScale = Math.max(.72, Math.min(1.22, 1 - projected.depth / (scale * 3)));
      coordinate.marker.style.left = `${projected.x}px`;
      coordinate.marker.style.top = `${projected.y}px`;
      coordinate.marker.style.setProperty("--depth-scale", depthScale.toFixed(3));
      coordinate.marker.style.zIndex = String(20 + Math.round((1 - projected.depth / scale) * 20));
      coordinate.marker.classList.toggle("is-behind", projected.depth > scale * .2);
    }
  },

  hideCoordinateMarkers() {
    this.coordinates.forEach((coordinate) => {
      coordinate.marker.style.removeProperty("left");
      coordinate.marker.style.removeProperty("top");
    });
  },

  mix(a, b, t) { return a + (b - a) * Math.max(0, Math.min(1, t)); },
  ease(t) {
    const value = Math.max(0, Math.min(1, t));
    return value < .5 ? 4 * value ** 3 : 1 - (-2 * value + 2) ** 3 / 2;
  },
  easeOut(t) {
    const value = Math.max(0, Math.min(1, t));
    return 1 - (1 - value) ** 3;
  }
};

app.init().catch((error) => {
  console.error(error);
  document.body.insertAdjacentHTML("beforeend", `<div class="toast is-visible">原型数据加载失败，请刷新页面</div>`);
});
