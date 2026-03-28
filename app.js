console.log("UNMASK app.js loaded");
console.log("UNMASK config:", window.UNMASK_CONFIG);

const CONFIG = window.UNMASK_CONFIG || {
  links: {
    offers: "#",
    session: "#",
    site: "#",
    inquiries: "mailto:info@example.com"
  },
  manualRefs: {
    phase0: { label: "Recalibration → Phase 0", pages: "" },
    phase1: { label: "Recalibration → Phase 1", pages: "" },
    phase2: { label: "Recalibration → Phase 2", pages: "" },
    phase3: { label: "Recalibration → Phase 3", pages: "" }
  },
  options: [
    { label: "Never", value: 1 },
    { label: "Rarely", value: 2 },
    { label: "Sometimes", value: 3 },
    { label: "Often", value: 4 },
    { label: "Constantly", value: 5 }
  ],
  storageKeys: {
    tab: "unmask-active-tab",
    scores: "unmask-diagnostic-scores",
    step: "unmask-diagnostic-step",
    results: "unmask-diagnostic-results"
  }
};

const TABS = ["overview", "roi", "diagnostic", "manual", "contact"];

const state = {
  scores: {
    lmi: [0, 0, 0],
    raa: [0, 0, 0],
    itc: [0, 0, 0]
  },
  step: 1,
  results: null
};

let maskingChart = null;
let manageChartInitialized = false;

document.addEventListener("DOMContentLoaded", () => {
  console.log("UNMASK DOM fully loaded");

  try {
    bindLinks();
    bindNav();
    bindGoToButtons();
    buildAnswerButtons();
    bindROI();
    bindDiagnostic();
    restoreState();
    calcROI();
    initChartsForVisibleTab();

    console.log("UNMASK init complete");
  } catch (err) {
    console.error("UNMASK initialization error:", err);
  }
});

/* ---------------------------
   Utilities
---------------------------- */

function safeEl(id) {
  return document.getElementById(id);
}

function setHref(id, href) {
  const el = safeEl(id);
  if (el) el.href = href;
}

function setText(id, value) {
  const el = safeEl(id);
  if (el) el.textContent = value;
}

function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (err) {
    console.warn("Storage write failed:", err);
  }
}

function readFromStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch (err) {
    console.warn("Storage read failed:", err);
    return null;
  }
}

/* ---------------------------
   Links
---------------------------- */

function bindLinks() {
  setHref("offersLinkNav", CONFIG.links.offers);
  setHref("offersLinkResults", CONFIG.links.offers);
  setHref("offersLinkContact", CONFIG.links.offers);

  setHref("sessionLinkOverview", CONFIG.links.session);
  setHref("sessionLinkResults", CONFIG.links.session);
  setHref("sessionLinkContact", CONFIG.links.session);

  setHref("siteLinkContact", CONFIG.links.site);
  setHref("inquiriesLinkContact", CONFIG.links.inquiries);
}

/* ---------------------------
   Tabs / Nav
---------------------------- */

function bindNav() {
  const buttons = document.querySelectorAll(".nav-btn");
  console.log("UNMASK nav buttons found:", buttons.length);

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.tab;
      console.log("UNMASK nav click:", target);
      if (target) showTab(target);
    });
  });
}

function bindGoToButtons() {
  const buttons = document.querySelectorAll("[data-goto]");
  console.log("UNMASK goto buttons found:", buttons.length);

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.goto;
      console.log("UNMASK goto click:", target);
      if (target) showTab(target);
    });
  });
}

function showTab(id) {
  if (!TABS.includes(id)) {
    console.warn("UNMASK showTab invalid tab:", id);
    return;
  }

  TABS.forEach((tab) => {
    safeEl(`tab-${tab}`)?.classList.remove("active");

    const nav = safeEl(`n-${tab}`);
    if (nav) {
      nav.classList.remove("active");
      nav.setAttribute("aria-selected", "false");
    }
  });

  safeEl(`tab-${id}`)?.classList.add("active");

  const activeNav = safeEl(`n-${id}`);
  if (activeNav) {
    activeNav.classList.add("active");
    activeNav.setAttribute("aria-selected", "true");
  }

  saveToStorage(CONFIG.storageKeys.tab, id);
  window.scrollTo({ top: 0, behavior: "smooth" });

  // lazy init charts when relevant tab becomes visible
  if (id === "roi" || id === "overview") {
    calcROI();
  }
  if (id === "manual" || id === "contact" || id === "diagnostic") {
    // no chart init needed
  }
  initChartsForVisibleTab(id);
}

function initChartsForVisibleTab(tabId = null) {
  const activeTab = tabId || getActiveTab();

  if (activeTab === "overview") {
    initMaskingChart();
    initManageChart(); // safe no-op if container missing
  }

  if (activeTab === "roi") {
    // no chart here currently
  }

  if (activeTab === "manual") {
    // no chart
  }

  if (activeTab === "contact") {
    // no chart
  }

  // also try these globally in case containers exist elsewhere
  initMaskingChart();
  initManageChart();
}

function getActiveTab() {
  const active = document.querySelector(".tab.active");
  if (!active) return "overview";
  return active.id.replace("tab-", "");
}

/* ---------------------------
   ROI
---------------------------- */

function bindROI() {
  ["sim-team", "sim-sal", "sim-mask", "sim-fric"].forEach((id) => {
    safeEl(id)?.addEventListener("input", calcROI);
  });
}

function calcROI() {
  const team = parseInt(safeEl("sim-team")?.value || "0", 10);
  const sal = parseInt(safeEl("sim-sal")?.value || "0", 10);
  const mask = parseInt(safeEl("sim-mask")?.value || "0", 10) / 100;
  const fric = parseInt(safeEl("sim-fric")?.value || "0", 10) / 100;

  setText("lbl-mask", `${Math.round(mask * 100)}%`);
  setText("lbl-fric", `${Math.round(fric * 100)}%`);

  const hrs = Math.round(team * (mask * 20 + fric * 15));
  const fis = (team * sal * (mask * 0.1 + fric * 0.05)) / 1000;

  setText("res-hrs", `${hrs}`);
  setText("res-fis", `${fis.toFixed(1)}`);
}

/* ---------------------------
   Diagnostic build / bind
---------------------------- */

function buildAnswerButtons() {
  const rows = document.querySelectorAll(".q-block .freq-row");
  console.log("UNMASK freq rows found:", rows.length);

  rows.forEach((row) => {
    row.innerHTML = "";

    CONFIG.options.forEach((opt) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "freq-opt";
      btn.dataset.v = String(opt.value);
      btn.textContent = opt.label;
      btn.setAttribute("aria-pressed", "false");
      row.appendChild(btn);
    });
  });
}

function bindDiagnostic() {
  document.querySelectorAll(".q-block").forEach((block) => {
    const group = block.dataset.g;
    const qIndex = parseInt(block.dataset.q, 10);

    block.querySelectorAll(".freq-opt").forEach((btn) => {
      btn.addEventListener("click", () => {
        block.querySelectorAll(".freq-opt").forEach((b) => {
          b.classList.remove("sel");
          b.setAttribute("aria-pressed", "false");
        });

        btn.classList.add("sel");
        btn.setAttribute("aria-pressed", "true");
        state.scores[group][qIndex] = parseInt(btn.dataset.v, 10);
        saveScores();
      });
    });
  });

  safeEl("runAnalysisBtn")?.addEventListener("click", diagStep2);
  safeEl("seeEntryBtn")?.addEventListener("click", diagStep3);
  safeEl("retakeBtn")?.addEventListener("click", diagReset);
  safeEl("copySummaryBtn")?.addEventListener("click", copySummary);
}

function saveScores() {
  saveToStorage(CONFIG.storageKeys.scores, JSON.stringify(state.scores));
}

function saveStep() {
  saveToStorage(CONFIG.storageKeys.step, String(state.step));
}

function saveResults() {
  saveToStorage(CONFIG.storageKeys.results, JSON.stringify(state.results));
}

function restoreState() {
  const savedTab = readFromStorage(CONFIG.storageKeys.tab);
  if (savedTab && TABS.includes(savedTab)) {
    showTab(savedTab);
  } else {
    showTab("overview");
  }

  const savedScores = readFromStorage(CONFIG.storageKeys.scores);
  if (savedScores) {
    try {
      state.scores = JSON.parse(savedScores);
      restoreSelections();
    } catch (err) {
      console.warn("Could not restore scores:", err);
    }
  }

  const savedStep = parseInt(readFromStorage(CONFIG.storageKeys.step) || "1", 10);
  const savedResults = readFromStorage(CONFIG.storageKeys.results);

  if (savedResults) {
    try {
      state.results = JSON.parse(savedResults);
    } catch (err) {
      console.warn("Could not restore results:", err);
      state.results = null;
    }
  }

  if (savedStep >= 2 && allAnswered()) {
    buildStep2();
    switchDiagScreen(savedStep === 3 ? 3 : 2);
    updateProgress(savedStep === 3 ? 3 : 2);
  }

  if (savedStep === 3 && state.results) {
    buildStep3FromResults(state.results);
    switchDiagScreen(3);
    updateProgress(3);
  }
}

function restoreSelections() {
  document.querySelectorAll(".q-block").forEach((block) => {
    const group = block.dataset.g;
    const qIndex = parseInt(block.dataset.q, 10);
    const value = state.scores[group][qIndex];

    block.querySelectorAll(".freq-opt").forEach((btn) => {
      const selected = parseInt(btn.dataset.v, 10) === value;
      btn.classList.toggle("sel", selected);
      btn.setAttribute("aria-pressed", selected ? "true" : "false");
    });
  });
}

function allAnswered() {
  return Object.values(state.scores).every((group) => group.every((v) => v > 0));
}

function avg(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function signalLevel(value) {
  if (value <= 1.6) return { label: "Low Signal", color: "#22c55e" };
  if (value <= 2.6) return { label: "Moderate Signal", color: "#58BBC2" };
  if (value <= 3.6) return { label: "Elevated Signal", color: "#F97316" };
  return { label: "Acute Signal", color: "#F43F5E" };
}

/* ---------------------------
   Diagnostic step 2
---------------------------- */

function diagStep2() {
  if (!allAnswered()) {
    const warn = safeEl("dw1");
    if (warn) warn.style.display = "block";
    return;
  }

  const warn = safeEl("dw1");
  if (warn) warn.style.display = "none";

  buildStep2();
  state.step = 2;
  saveStep();
  switchDiagScreen(2);
  updateProgress(2);
}

function buildStep2() {
  const lmi = avg(state.scores.lmi);
  const raa = avg(state.scores.raa);
  const itc = avg(state.scores.itc);

  const scoreGrid = safeEl("scoreGrid");
  if (scoreGrid) {
    scoreGrid.innerHTML = [
      buildMeter("LMI", "Masking Index", lmi, signalLevel(lmi)),
      buildMeter("RAA", "Authority Gap", raa, signalLevel(raa)),
      buildMeter("ITC", "Hidden Labor", itc, signalLevel(itc))
    ].join("");
  }

  const patterns = [];
  if (lmi >= 3.5 && raa >= 3.5) patterns.push("High masking plus high authority gap suggests middle-layer overload and execution drag.");
  if (lmi >= 3.5 && itc >= 3.0) patterns.push("High masking plus elevated ITC suggests disproportionate burden on specific leaders or groups.");
  if (raa >= 3.5 && itc >= 3.5) patterns.push("Authority gaps plus high extraction suggest leaders are absorbing systemic dysfunction directly.");
  if (lmi >= 4) patterns.push("Masking is acute. Expect reduced decision clarity and elevated cognitive fatigue.");
  if (raa >= 4) patterns.push("Authority misalignment is acute. Expect bottlenecks, escalations, and missed delivery windows.");
  if (itc >= 4) patterns.push("Hidden extraction is acute. Expect burnout risk and inequitable burden distribution.");
  if (!patterns.length) patterns.push("Signals are mixed but not acute. Use the recommended entry point to prevent reversion and escalation.");

  const patternBox = safeEl("patternBox");
  if (patternBox) {
    patternBox.innerHTML = `
      <div class="pb-lbl">Pattern Recognition</div>
      ${patterns.map((p) => `<div class="pattern-item">${p}</div>`).join("")}
    `;
  }

  const translation = [];
  if (lmi >= 3) {
    translation.push("<p><strong style='color:white;'>LMI elevated</strong> — Leaders are compensating for structural gaps through performance and overextension.</p>");
  }
  if (raa >= 3) {
    translation.push("<p><strong style='color:white;'>RAA elevated</strong> — Decisions are being held above the level of execution, increasing delay and escalation dependency.</p>");
  }
  if (itc >= 3) {
    translation.push("<p><strong style='color:white;'>ITC elevated</strong> — Hidden labor is present and is likely falling unevenly across leaders or groups.</p>");
  }
  if (!translation.length) {
    translation.push("<p>Signal levels are currently within a lower range. Continue monitoring and re-run after meaningful structural change.</p>");
  }

  const transBox = safeEl("transBox");
  if (transBox) {
    transBox.innerHTML = translation.join("");
  }
}

function buildMeter(code, label, value, level) {
  const pct = Math.round(((value - 1) / 4) * 100);
  return `
    <div class="score-cell">
      <div class="sc-label">${label}</div>
      <div class="sc-val" style="color:${level.color}">${value.toFixed(1)}</div>
      <div class="sc-lvl" style="color:${level.color}">${level.label}</div>
      <div class="bar-track">
        <div class="bar-fill" style="width:${pct}%;background:${level.color}"></div>
      </div>
      <div class="sc-label" style="margin-top:0.45rem;">${code}</div>
    </div>
  `;
}

/* ---------------------------
   Diagnostic step 3
---------------------------- */

function diagStep3() {
  const lmi = avg(state.scores.lmi);
  const raa = avg(state.scores.raa);
  const itc = avg(state.scores.itc);
  const overall = (lmi + raa + itc) / 3;

  let result;

  if (overall >= 3.8 || lmi >= 4 || itc >= 4) {
    result = {
      key: "phase0",
      phase: "Phase 0",
      title: "Interrupt the System",
      desc: "Your signal pattern suggests acute strain. Begin by relieving pressure before you attempt deeper redesign.",
      actions: [
        "Remove one visible burden from the system within the next 7 days.",
        "Use the Escalation Loop Kill Sheet to eliminate one recurring escalation.",
        "Remove or reduce one unnecessary approval layer.",
        "Reassign one decision to the appropriate level."
      ],
      also: "After Phase 0, move to <strong style='color:white;'>Phase 1: Map the System</strong> so authority gaps and workflow breakdowns become visible."
    };
  } else if (raa >= 3.5) {
    result = {
      key: "phase2",
      phase: "Phase 2",
      title: "Reallocate Authority",
      desc: "Your strongest signal is authority misalignment. Structural
