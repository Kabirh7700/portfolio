/* =========================================================
   Data-driven portfolio
   All content comes from /data/*.json — edit those files,
   never this script, to update what's on the page.
   ========================================================= */

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

async function loadJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}

/* ---------- Hero + About + Contact (profile.json) ---------- */
function renderProfile(p) {
  $("#heroLine").textContent = p.heroLine;
  $("#heroSub").textContent = p.heroSub;
  $("#resumeBtn").href = p.resumeUrl;

  $("#kpis").innerHTML = p.stats.map(s => `
    <div class="kpi">
      <div class="kpi__value" data-target="${s.value}">0${s.suffix}</div>
      <div class="kpi__label">${s.label}</div>
    </div>`).join("");

  $("#aboutTag").textContent = p.about.tag;
  $("#aboutName").textContent = p.about.heading;
  $("#aboutParagraphs").innerHTML = p.about.paragraphs.map(t => `<p>${t}</p>`).join("");
  $("#aboutFacts").innerHTML = `
    <div><span>Email</span><span>${p.email}</span></div>
    <div><span>Location</span><span>${p.location}</span></div>
  `;

  $("#socials").innerHTML = p.socials.map(s => `
    <a href="${s.url}" target="_blank" rel="noopener" aria-label="${s.label}"><i class="${s.icon}"></i></a>
  `).join("");

  $("#contactInfo").innerHTML = `
    <div class="contact__row"><i class="fas fa-envelope"></i><span>${p.email}</span></div>
    <div class="contact__row"><i class="fas fa-map-marker-alt"></i><span>${p.location}</span></div>
    ${p.socials.map(s => `<div class="contact__row"><i class="${s.icon}"></i><a href="${s.url}" target="_blank" rel="noopener">${s.label}</a></div>`).join("")}
  `;

  setupTyping(p.typingStrings);
  setupContactForm(p.contactFormEndpoint);
}

function setupTyping(strings) {
  const el = $("#heroTyping");
  if (!strings || !strings.length) return;
  let s = 0, i = 0, deleting = false;

  function tick() {
    const current = strings[s];
    el.textContent = deleting ? current.slice(0, i--) : current.slice(0, i++);

    let delay = deleting ? 35 : 60;
    if (!deleting && i === current.length + 1) { delay = 1200; deleting = true; }
    if (deleting && i === 0) { deleting = false; s = (s + 1) % strings.length; delay = 300; }

    setTimeout(tick, delay);
  }
  tick();
}

function setupContactForm(endpoint) {
  const form = $("#contactForm");
  const note = $("#formNote");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    note.textContent = "Sending…";
    try {
      await fetch(endpoint, {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" }
      });
      note.textContent = "Message sent — thanks, I'll reply soon.";
      form.reset();
    } catch (err) {
      note.textContent = "Something went wrong. Please email me directly instead.";
    }
  });
}

/* ---------- Skills ---------- */
function renderSkills(skills) {
  const groups = {};
  skills.forEach(s => {
    groups[s.category] = groups[s.category] || [];
    groups[s.category].push(s);
  });

  $("#skillsGroups").innerHTML = Object.entries(groups).map(([cat, items]) => `
    <div class="skills-group">
      <div class="skills-group__title">${cat}</div>
      ${items.map(s => `
        <div class="skill-row">
          <img src="${s.icon}" alt="" loading="lazy">
          <span class="skill-row__name">${s.name}</span>
          <span class="skill-row__level mono">${s.level}%</span>
          <div class="skill-row__bar"><span data-level="${s.level}"></span></div>
        </div>
      `).join("")}
    </div>
  `).join("");
}

/* ---------- Experience ---------- */
function renderExperience(items) {
  $("#ledger").innerHTML = items.map(job => `
    <div class="ledger-row">
      <div class="ledger-row__date mono">${job.start} — ${job.end}</div>
      <div>
        <div class="ledger-row__role">${job.role}</div>
        <div class="ledger-row__company">${job.company}</div>
        <div class="ledger-row__summary">${job.summary}</div>
      </div>
      <div class="ledger-row__status">
        ${job.current ? '<span class="dot"></span>Current' : ""}
      </div>
    </div>
  `).join("");
}

/* ---------- Education ---------- */
function renderEducation(items) {
  $("#eduGrid").innerHTML = items.map(e => `
    <div class="edu-card">
      <div class="edu-card__image"><img src="${e.image}" alt="${e.institution}"></div>
      <div class="edu-card__body">
        <div class="edu-card__title">${e.title}</div>
        <div class="edu-card__inst">${e.institution}</div>
        <div class="edu-card__date mono">${e.start} — ${e.end}</div>
      </div>
    </div>
  `).join("");
}

/* ---------- Scroll-triggered animations (KPI count-up, skill bars) ---------- */
function observeAnimations() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      $$(".kpi__value", entry.target).forEach(el => {
        const target = Number(el.dataset.target);
        const suffix = el.textContent.replace(/^[0-9]+/, "");
        let cur = 0;
        const step = Math.max(1, Math.ceil(target / 40));
        const anim = setInterval(() => {
          cur = Math.min(cur + step, target);
          el.textContent = cur + suffix;
          if (cur >= target) clearInterval(anim);
        }, 25);
      });

      $$(".skill-row__bar span", entry.target).forEach(el => {
        el.style.width = el.dataset.level + "%";
      });

      io.unobserve(entry.target);
    });
  }, { threshold: 0.3 });

  $$("#hero, #skills").forEach(el => io.observe(el));
}

/* ---------- Scroll spy + mobile nav ---------- */
function setupNav() {
  const links = $$(".sidebar__nav a");
  const sections = links.map(a => document.querySelector(a.getAttribute("href")));

  const spy = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const id = "#" + entry.target.id;
      const link = links.find(a => a.getAttribute("href") === id);
      if (!link) return;
      if (entry.isIntersecting) {
        links.forEach(a => a.classList.remove("active"));
        link.classList.add("active");
      }
    });
  }, { rootMargin: "-40% 0px -50% 0px" });

  sections.forEach(s => s && spy.observe(s));

  const toggle = $("#navToggle");
  const sidebar = $("#sidebar");
  const scrim = $("#scrim");
  const open = () => { sidebar.classList.add("open"); scrim.classList.add("open"); };
  const close = () => { sidebar.classList.remove("open"); scrim.classList.remove("open"); };

  toggle.addEventListener("click", open);
  scrim.addEventListener("click", close);
  links.forEach(a => a.addEventListener("click", close));
}

/* ---------- Boot ---------- */
async function init() {
  $("#year").textContent = new Date().getFullYear();

  const [profile, skills, experience, education] = await Promise.all([
    loadJSON("./data/profile.json"),
    loadJSON("./data/skills.json"),
    loadJSON("./data/experience.json"),
    loadJSON("./data/education.json"),
  ]);

  renderProfile(profile);
  renderSkills(skills);
  renderExperience(experience);
  renderEducation(education);

  setupNav();
  observeAnimations();
}

init().catch(err => console.error("Portfolio failed to load:", err));
