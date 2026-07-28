const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const LOGO_MOUNTAIN_PATH = "M12 134 L58 58 Q64 48 74 58 Q96 82 111 75 Q127 68 142 43 L168 8 Q172 2 177 12 L218 98 Q225 113 235 108 Q245 104 250 119 L258 139";

const state = {
  data: null,
  route: "home",
  department: null,
  projectFilter: "all",
  alumniView: "timeline",
  qrType: "recruit"
};

const app = {
  async init() {
    const response = await fetch("./data/site-data.json");
    state.data = await response.json();
    this.applyCanonicalLogo();
    this.setupIntro();
    this.renderMetrics();
    this.renderDepartments();
    this.renderProjects();
    this.renderAlumni();
    this.renderAnnuals();
    this.renderJoin();
    this.bindNavigation();
    this.bindTheme();
    this.bindScrollEffects();
    this.bindModals();
    particleLogo.init();
    this.routeFromHash(false);
  },

  applyCanonicalLogo() {
    $$(".intro-mountain, .brand svg path:first-child, .network-center svg path:first-child").forEach((path) => {
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
    const lines = [];
    const nodes = [];
    const root = { x: 78, y: 280 };
    state.data.departments.forEach((dept, index) => {
      const x = dept.x / 100 * 760;
      const y = dept.y / 100 * 560;
      lines.push(`<path class="department-link" data-line-department="${dept.id}" d="M${root.x} ${root.y} C150 ${root.y}, 180 ${y}, ${x} ${y}"></path>`);
      nodes.push(`
        <button class="department-node" data-department="${dept.id}" data-index="${index}" style="left:${dept.x}%;top:${dept.y}%">
          <span>${dept.name}<small>${dept.code}${dept.subteams?.length ? ` · ${dept.subteams.length} GROUPS` : ""}</small></span>
        </button>`);
      dept.subteams?.forEach((team, teamIndex) => {
        const teamX = team.x / 100 * 760;
        const teamY = team.y / 100 * 560;
        lines.push(`<path class="subteam-link" data-line-department="${dept.id}" data-line-subteam="${team.id}" d="M${x} ${y} C${x + 70} ${y}, ${teamX - 90} ${teamY}, ${teamX} ${teamY}"></path>`);
        nodes.push(`
          <button class="subteam-node" data-department="${dept.id}" data-subteam="${team.id}" data-index="${index}" style="left:${team.x}%;top:${team.y}%">
            <span>${team.name}<small>${String(teamIndex + 1).padStart(2, "0")}</small></span>
          </button>`);
      });
    });
    $("#networkLineGroup").innerHTML = lines.join("");
    $("#departmentNodes").innerHTML = nodes.join("");
    $("#departmentTree").innerHTML = state.data.departments.map((dept, index) => `
      <article class="tree-department" data-tree-department="${dept.id}">
        <button class="tree-department-button" data-department="${dept.id}" data-index="${index}">
          <span><small>0${index + 1}</small><b>${dept.name}</b></span><i>${dept.subteams?.length ? "+" : "→"}</i>
        </button>
        ${dept.subteams?.length ? `<div class="tree-subteams">${dept.subteams.map((team) => `
          <button data-department="${dept.id}" data-subteam="${team.id}" data-index="${index}"><span>${team.name}</span><small>${team.code}</small></button>`).join("")}</div>` : ""}
      </article>`).join("");
    $$(".department-node, .subteam-node, .tree-department-button, .tree-subteams button").forEach((button) => {
      const select = () => this.selectDepartment(button.dataset.department, Number(button.dataset.index), button.dataset.subteam);
      if (!button.classList.contains("tree-department-button")) button.addEventListener("mouseenter", select);
      button.addEventListener("focus", select);
      button.addEventListener("click", select);
    });
    this.selectDepartment("product", 0);
  },

  selectDepartment(id, index, subteamId = "") {
    state.department = id;
    const dept = state.data.departments.find((item) => item.id === id);
    const team = dept.subteams?.find((item) => item.id === subteamId);
    $$(".department-node").forEach((node) => node.classList.toggle("is-active", node.dataset.department === id));
    $$(".subteam-node").forEach((node) => {
      node.classList.toggle("is-related", node.dataset.department === id);
      node.classList.toggle("is-active", node.dataset.subteam === subteamId);
    });
    $$(".network-lines path").forEach((line) => {
      const sameDepartment = line.dataset.lineDepartment === id;
      const sameTeam = !line.dataset.lineSubteam || line.dataset.lineSubteam === subteamId;
      line.classList.toggle("is-active", sameDepartment && (subteamId ? sameTeam : true));
    });
    $$(".tree-department").forEach((item) => item.classList.toggle("is-open", item.dataset.treeDepartment === id));
    $$(".tree-subteams button").forEach((button) => button.classList.toggle("is-active", button.dataset.subteam === subteamId));
    const title = team?.name ?? dept.name;
    const code = team?.code ?? dept.code;
    const description = team?.description ?? dept.description;
    const tech = team?.tech ?? dept.tech;
    $("#departmentDetail").innerHTML = `
      <span class="dept-code">DEPARTMENT 0${index + 1} / ${code}</span>
      <h3>${title}</h3>
      <p>${description}</p>
      <div class="tech-tags">${tech.map((item) => `<span>${item}</span>`).join("")}</div>
      ${dept.subteams?.length && !team ? `<div class="subteam-list"><small>下设组别 · 点击拓扑节点查看方向</small>${dept.subteams.map((item) => `<button data-detail-subteam="${item.id}"><b>${item.name}</b><span>${item.description}</span></button>`).join("")}</div>` : ""}
      ${team ? `<button class="detail-back" data-detail-department="${dept.id}">← 返回${dept.name}总览</button>` : ""}
      <div class="dept-members"><small>${dept.lead}</small><p>${dept.members.join(" · ")}</p></div>`;
    $$("[data-detail-subteam]").forEach((button) => button.addEventListener("click", () => this.selectDepartment(id, index, button.dataset.detailSubteam)));
    $("[data-detail-department]")?.addEventListener("click", () => this.selectDepartment(id, index));
  },

  renderProjects() {
    const projects = state.data.projects.filter((project) => state.projectFilter === "all" || project.status === state.projectFilter);
    $("#projectCount").textContent = String(projects.length).padStart(2, "0");
    $("#projectGrid").innerHTML = projects.map((project) => `
      <article class="project-card" data-project="${project.id}" tabindex="0">
        <div class="project-art" style="--project-bg:${project.bg}"><span class="project-glyph">${project.glyph}</span></div>
        <div class="project-card-content">
          <div class="project-card-head"><h3>${project.name}</h3><span class="status-badge ${project.status}">${project.statusLabel}</span></div>
          <p>${project.summary}</p>
          <div class="project-tags">${project.tech.map((tech) => `<span>${tech}</span>`).join("")}</div>
        </div>
      </article>`).join("");
    $$("[data-project]").forEach((card) => {
      const open = () => this.openProject(card.dataset.project);
      card.addEventListener("click", open);
      card.addEventListener("keydown", (event) => event.key === "Enter" && open());
    });
  },

  openProject(id) {
    const project = state.data.projects.find((item) => item.id === id);
    $("#projectModalContent").innerHTML = `
      <div class="modal-project-hero" style="--project-bg:${project.bg}">
        <p>${project.statusLabel.toUpperCase()} / ${project.year}</p><h2>${project.name}</h2><span>${project.summary}</span>
      </div>
      <div class="modal-project-body">
        <p>${project.description}</p>
        <div class="project-tags">${project.tech.map((tech) => `<span>${tech}</span>`).join("")}</div>
        <div class="modal-grid"><div><small>负责方向</small>${project.owner}</div><div><small>项目周期</small>${project.year}</div><div><small>项目状态</small>${project.statusLabel}</div><div><small>链接</small>原型阶段暂未开放</div></div>
      </div>`;
    $("#projectModal").showModal();
  },

  renderAlumni() {
    const grouped = state.data.alumni.reduce((result, person) => {
      (result[person.year] ??= []).push(person);
      return result;
    }, {});
    $("#timelinePanel").innerHTML = Object.keys(grouped).sort((a, b) => b - a).map((year) => `
      <section class="timeline-year">
        <h2>${year}</h2>
        <div class="timeline-items">${grouped[year].map((person) => `
          <article class="alumni-card"><small>${person.city} / ${person.role}</small><h3>${person.name}</h3><p>${person.company}</p><p class="alumni-quote">“${person.quote}”</p></article>`).join("")}
        </div>
      </section>`).join("");
    $("#cityMarkers").innerHTML = state.data.cities.map((city) => {
      const size = Math.max(8, state.data.alumni.filter((person) => person.city === city.name).length * 4 + 6);
      return `<g class="city-marker" data-city="${city.name}" tabindex="0"><circle cx="${city.x}" cy="${city.y}" r="${size}"></circle><text x="${city.x + 15}" y="${city.y + 4}">${city.name}</text></g>`;
    }).join("");
    $$(".city-marker").forEach((marker) => {
      const select = () => this.selectCity(marker.dataset.city);
      marker.addEventListener("click", select);
      marker.addEventListener("keydown", (event) => event.key === "Enter" && select());
    });
  },

  selectCity(cityName) {
    $$(".city-marker").forEach((marker) => marker.classList.toggle("is-active", marker.dataset.city === cityName));
    const people = state.data.alumni.filter((person) => person.city === cityName);
    $("#mapDetail").innerHTML = `
      <p>${cityName.toUpperCase()} / ${String(people.length).padStart(2, "0")} ALUMNI</p>
      <h3>${cityName}</h3>
      <span>从蓝山出发，在这里继续创造。</span>
      <div>${people.map((person) => `<div class="map-person"><strong>${person.name}</strong><small>${person.company} · ${person.role}</small></div>`).join("")}</div>`;
  },

  renderAnnuals() {
    $("#annualTrack").innerHTML = state.data.annuals.map((annual) => `
      <article class="annual-card" style="--cover:${annual.cover}">
        <small>LANSHAN ANNUAL</small><span>↗</span><h3>${annual.year}<br>${annual.title}</h3><p>${annual.subtitle}</p>
      </article>`).join("");
  },

  renderJoin() {
    $("#requirementsGrid").innerHTML = state.data.departments.map((dept, index) => `
      <article class="requirement-card"><span>DEPARTMENT 0${index + 1} / ${dept.code}</span><h3>${dept.name}</h3><p>${dept.description}</p>${dept.subteams?.length ? `<div class="requirement-subteams">${dept.subteams.map((team) => `<b>${team.name}</b>`).join("")}</div>` : ""}<div class="tech-tags">${dept.tech.slice(0,3).map((tech) => `<span>${tech}</span>`).join("")}</div></article>`).join("");
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
      this.navigate("home", false);
      setTimeout(() => this.scrollTo(link.dataset.scrollTarget), 80);
    }));
    $("#menuButton").addEventListener("click", () => this.toggleMenu());
    $$("#projectTabs button").forEach((button) => button.addEventListener("click", () => {
      state.projectFilter = button.dataset.filter;
      $$("#projectTabs button").forEach((item) => item.classList.toggle("is-active", item === button));
      this.renderProjects();
    }));
    $$("#alumniSwitch button").forEach((button) => button.addEventListener("click", () => {
      state.alumniView = button.dataset.alumniView;
      $$("#alumniSwitch button").forEach((item) => item.classList.toggle("is-active", item === button));
      $$(".alumni-panel").forEach((panel) => panel.classList.toggle("is-active", panel.dataset.alumniPanel === state.alumniView));
    }));
    $$("#qrTabs button").forEach((button) => button.addEventListener("click", () => {
      state.qrType = button.dataset.qrType;
      $$("#qrTabs button").forEach((item) => item.classList.toggle("is-active", item === button));
      this.renderQrCards();
    }));
  },

  navigate(route, updateHash = true) {
    state.route = route;
    $$(".view").forEach((view) => view.classList.toggle("is-active", view.dataset.view === route));
    $$(".desktop-nav [data-route]").forEach((link) => link.classList.toggle("is-active", link.dataset.route === route));
    $("#floatingJoin").classList.toggle("is-hidden", route === "join");
    if (updateHash) history.pushState(null, "", `#${route}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
    this.toggleMenu(false);
  },

  routeFromHash(scroll = true) {
    const route = location.hash.replace("#", "");
    if (["projects", "alumni", "join"].includes(route)) this.navigate(route, false);
    else if (route === "departments") {
      this.navigate("home", false);
      if (scroll) setTimeout(() => this.scrollTo("departments"), 100);
    } else this.navigate("home", false);
  },

  scrollTo(id) { document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); },

  toggleMenu(force) {
    const open = typeof force === "boolean" ? force : !$("#mobileMenu").classList.contains("is-open");
    $("#mobileMenu").classList.toggle("is-open", open);
    $("#mobileMenu").setAttribute("aria-hidden", String(!open));
    $("#menuButton").classList.toggle("is-open", open);
    $("#menuButton").setAttribute("aria-expanded", String(open));
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
  canvas: null, ctx: null, particles: [], pointer: { x: 0, y: 0 }, raf: null,
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
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches && innerWidth > 620) this.animate();
    else this.draw(true);
  },
  makePoints() {
    const points = [];
    const addSvgPath = (pathData, count, depth, layerIndex, layerCount) => {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", pathData);
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
      addSvgPath(LOGO_MOUNTAIN_PATH, innerWidth < 620 ? 105 : 190, depth, layer, layerCount);
    }
    addSvgPath(LOGO_MOUNTAIN_PATH, innerWidth < 620 ? 250 : 520, 0, 0, 1);
    for(let i=0;i<(innerWidth < 620 ? 90 : 240);i++) points.push({x:Math.random(),y:Math.random(),z:(Math.random()-.5)*2.2,ambient:true});
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
    const mobile=w<780, scale=Math.min(w*(mobile?.78:.48),h*.63);
    const cx=mobile?w*.54:w*.73,cy=mobile?h*.42:h*.47;
    const angleY=this.pointer.x*.68+(staticFrame?-.12:Math.sin(time*.00022)*.16);
    const angleX=-.08-this.pointer.y*.3+(staticFrame?0:Math.cos(time*.00017)*.035);
    const dark=document.body.classList.contains("dark");
    for(const p of this.particles){
      let x=(p.x-.5)*scale*1.35,y=(p.y-.5)*scale,z=p.z*scale*.42;
      const x1=x*Math.cos(angleY)-z*Math.sin(angleY),z1=x*Math.sin(angleY)+z*Math.cos(angleY);
      const y1=y*Math.cos(angleX)-z1*Math.sin(angleX),z2=y*Math.sin(angleX)+z1*Math.cos(angleX);
      const perspective=700/(700+z2);
      const sx=cx+x1*perspective,sy=cy+y1*perspective;
      if(p.ambient){ctx.globalAlpha=.11+Math.sin(time*.001+p.seed)*.04;ctx.fillStyle=dark?"#9bb6ee":"#647fba";}
      else{
        const depthLight=Math.max(0,Math.min(1,(p.z+1.1)/2.2));
        ctx.globalAlpha=(p.ridge?.72:.2+depthLight*.22)+Math.sin(time*.0018+p.seed)*.08;
        ctx.fillStyle=p.ridge?(dark?"#c4d1ff":"#40599a"):(p.y>.64?(dark?"#9bd8c6":"#77a99c"):(dark?"#8fa9ea":"#6e84bd"));
      }
      const size=(p.ambient?1.05:(p.ridge?1.65:1.18))*perspective;
      ctx.beginPath();ctx.arc(sx,sy,size,0,Math.PI*2);ctx.fill();
    }
    ctx.globalAlpha=1;
  }
};

app.init().catch((error) => {
  console.error(error);
  document.body.insertAdjacentHTML("beforeend", `<div class="toast is-visible">原型数据加载失败，请刷新页面</div>`);
});
