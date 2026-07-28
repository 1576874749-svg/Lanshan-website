const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

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
    const positions = [
      [380, 62], [622, 177], [622, 383], [380, 498], [138, 383], [138, 177]
    ];
    $("#networkLineGroup").innerHTML = positions.map(([x, y], index) =>
      `<line id="line-${index}" x1="380" y1="280" x2="${x}" y2="${y}"></line>`
    ).join("");
    $("#departmentNodes").innerHTML = state.data.departments.map((dept, index) => `
      <button class="department-node" data-department="${dept.id}" data-index="${index}" style="left:${dept.x}%;top:${dept.y}%">
        <span>${dept.name}<small>${dept.code}</small></span>
      </button>`).join("");
    $$("[data-department]").forEach((button) => {
      button.addEventListener("mouseenter", () => this.selectDepartment(button.dataset.department, Number(button.dataset.index)));
      button.addEventListener("focus", () => this.selectDepartment(button.dataset.department, Number(button.dataset.index)));
      button.addEventListener("click", () => this.selectDepartment(button.dataset.department, Number(button.dataset.index)));
    });
    this.selectDepartment("product", 0);
  },

  selectDepartment(id, index) {
    state.department = id;
    const dept = state.data.departments.find((item) => item.id === id);
    $$(".department-node").forEach((node) => node.classList.toggle("is-active", node.dataset.department === id));
    $$(".network-lines line").forEach((line, lineIndex) => line.classList.toggle("is-active", lineIndex === index));
    $("#departmentDetail").innerHTML = `
      <span class="dept-code">TEAM 0${index + 1} / ${dept.code}</span>
      <h3>${dept.name}</h3>
      <p>${dept.description}</p>
      <div class="tech-tags">${dept.tech.map((tech) => `<span>${tech}</span>`).join("")}</div>
      <div class="dept-members"><small>${dept.lead}</small><p>${dept.members.join(" · ")}</p></div>`;
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
    $("#departmentChoices").innerHTML = state.data.departments.map((dept) => `
      <label class="choice"><input type="checkbox" name="departments" value="${dept.name}" /><span>${dept.name}</span></label>`).join("");
    $("#requirementsGrid").innerHTML = state.data.departments.map((dept, index) => `
      <article class="requirement-card"><span>TEAM 0${index + 1} / ${dept.code}</span><h3>${dept.name}</h3><p>${dept.description}</p><div class="tech-tags">${dept.tech.slice(0,3).map((tech) => `<span>${tech}</span>`).join("")}</div></article>`).join("");
    this.renderQrCards();
    const form = $("#joinForm");
    form.addEventListener("input", () => this.updateFormProgress());
    $$('input[name="departments"]', form).forEach((checkbox) => checkbox.addEventListener("change", (event) => {
      const checked = $$('input[name="departments"]:checked', form);
      if (checked.length > 2) {
        event.target.checked = false;
        this.toast("最多选择两个意向部门");
      }
      this.updateFormProgress();
    }));
    $('textarea[name="intro"]', form).addEventListener("input", (event) => $("#introCount").textContent = event.target.value.length);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const payload = Object.fromEntries(new FormData(form));
      payload.departments = $$('input[name="departments"]:checked', form).map((item) => item.value);
      localStorage.setItem("lanshan-prototype-application", JSON.stringify(payload));
      this.toast("意向已保存在当前浏览器 · 原型演示");
      form.reset();
      $("#introCount").textContent = "0";
      this.updateFormProgress();
    });
    this.updateCountdown();
    setInterval(() => this.updateCountdown(), 1000);
  },

  renderQrCards() {
    const isStudy = state.qrType === "study";
    $("#qrGrid").innerHTML = state.data.departments.map((dept) => `
      <article class="qr-card" data-qr="${dept.name}" data-qr-label="${isStudy ? "飞书学习群" : "招新群"}"><div class="fake-qr"></div><div><h3>${dept.name}</h3><p>${isStudy ? "飞书学习群 · 资料与答疑" : "招新群 · 示例二维码"}</p></div></article>`).join("");
    $$("[data-qr]").forEach((card) => card.addEventListener("click", () => this.openQr(card.dataset.qr, card.dataset.qrLabel)));
  },

  updateFormProgress() {
    const form = $("#joinForm");
    const required = [form.name, form.studentId, form.major, form.intro];
    let complete = required.filter((field) => field.value.trim()).length;
    if ($$('input[name="departments"]:checked', form).length) complete += 1;
    const progress = Math.round(complete / 5 * 100);
    $("#formProgressBar").style.width = `${progress}%`;
    $("#formProgressText").textContent = progress;
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
    const segments = [[0, .78],[.19,.33],[.31,.52],[.42,.48],[.62,.08],[.87,.62],[1,.69]];
    const addPath = (path, count, layer) => {
      const lengths = path.slice(1).map((point, index) => Math.hypot(point[0]-path[index][0], point[1]-path[index][1]));
      const total = lengths.reduce((a,b)=>a+b,0);
      for (let i=0;i<count;i++) {
        let distance = i/(count-1)*total;
        let segment = 0;
        while (distance > lengths[segment] && segment < lengths.length-1) { distance -= lengths[segment]; segment++; }
        const ratio = distance/lengths[segment];
        const a=path[segment], b=path[segment+1];
        points.push({ x:a[0]+(b[0]-a[0])*ratio, y:a[1]+(b[1]-a[1])*ratio, z:layer + (Math.random()-.5)*.12 });
      }
    };
    addPath(segments, 520, 0);
    const horizon = Array.from({length:260},(_,i)=>{const t=i/259;return [t,.81-.15*Math.sin(t*Math.PI*.8)]});
    addPath(horizon, 260, .1);
    for(let i=0;i<210;i++) points.push({x:Math.random(),y:Math.random(),z:(Math.random()-.5)*1.5,ambient:true});
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
    const angleY=this.pointer.x*.36+(staticFrame?0:Math.sin(time*.00018)*.05);
    const angleX=-this.pointer.y*.2;
    const dark=document.body.classList.contains("dark");
    for(const p of this.particles){
      let x=(p.x-.5)*scale*1.35,y=(p.y-.5)*scale,z=p.z*scale*.35;
      const x1=x*Math.cos(angleY)-z*Math.sin(angleY),z1=x*Math.sin(angleY)+z*Math.cos(angleY);
      const y1=y*Math.cos(angleX)-z1*Math.sin(angleX),z2=y*Math.sin(angleX)+z1*Math.cos(angleX);
      const perspective=700/(700+z2);
      const sx=cx+x1*perspective,sy=cy+y1*perspective;
      if(p.ambient){ctx.globalAlpha=.11+Math.sin(time*.001+p.seed)*.04;ctx.fillStyle=dark?"#9bb6ee":"#647fba";}
      else{ctx.globalAlpha=.45+Math.sin(time*.0018+p.seed)*.25;ctx.fillStyle=p.y>.64?(dark?"#9bd8c6":"#77a99c"):(dark?"#a4baff":"#5262a0");}
      const size=(p.ambient?1.05:1.45)*perspective;
      ctx.beginPath();ctx.arc(sx,sy,size,0,Math.PI*2);ctx.fill();
    }
    ctx.globalAlpha=1;
  }
};

app.init().catch((error) => {
  console.error(error);
  document.body.insertAdjacentHTML("beforeend", `<div class="toast is-visible">原型数据加载失败，请刷新页面</div>`);
});
