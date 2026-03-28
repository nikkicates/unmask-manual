const CONFIG = window.UNMASK_CONFIG;

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

document.addEventListener("DOMContentLoaded", () => {
  bindLinks();
  bindNav();
  bindGoToButtons();
  buildAnswerButtons();
  bindROI();
  bindDiagnostic();
  restoreState();
  calcROI();
  initCharts();
});

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

function setHref(id, href) {
  const el = document.getElementById(id);
  if (el) el.href = href;
}

function bindNav() {
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => showTab(btn.dataset.tab));
  });
}

function bindGoToButtons() {
  document.querySelectorAll("[data-goto]").forEach((btn) => {
    btn.addEventListener("click", () => showTab(btn.dataset.goto));
  });
}

function showTab(id) {
  TABS.forEach((tab) => {
    document.getElementById(`tab-${tab}`)?.classList.remove("active");
    const nav = document.getElementById(`n-${tab}`);
    if (nav) {
      nav.classList.remove("active");
      nav.setAttribute("aria-selected", "false");
    }
  });

  document.getElementById(`tab-${id}`)?.classList.add("active");
  const activeNav = document.getElementById(`n-${id}`);
  if (activeNav) {
    activeNav.classList.add("active");
    activeNav.setAttribute("aria-selected", "true");
  }

  localStorage.setItem(CONFIG.storageKeys.tab, id);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function bindROI() {
  ["sim-team", "sim-sal", "sim-mask", "sim-fric"].forEach((id) => {
    document.getElementById(id)?.addEventListener("input", calcROI);
  });
}

function calcROI() {
  const team = parseInt(document.getElementById("sim-team")?.value || "0", 10);
  const sal = parseInt(document.getElementById("sim-sal")?.value || "0", 10);
  const mask = parseInt(document.getElementById("sim-mask")?.value || "0", 10) / 100;
  const fric = parseInt(document.getElementById("sim-fric")?.value || "0", 10) / 100;

  document.getElementById("lbl-mask").textContent = `${Math.round(mask * 100)}%`;
  document.getElementById("lbl-fric").textContent = `${Math.round(fric * 100)}%`;

  const hrs = Math.round(team * (mask * 20 + fric * 15));
  const fis = (team * sal * (mask * 0.1 + fric * 0.05)) / 1000;

  document.getElementById("res-hrs").textContent = `${hrs}`;
  document.getElementById("res-fis").textContent = `${fis.toFixed(1)}`;
}

function buildAnswerButtons() {
  document.querySelectorAll(".q-block .freq-row").forEach((row) => {
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

  document.getElementById("runAnalysisBtn")?.addEventListener("click", diagStep2);
  document.getElementById("seeEntryBtn")?.addEventListener("click", diagStep3);
  document.getElementById("retakeBtn")?.addEventListener("click", diagReset);
  document.getElementById("copySummaryBtn")?.addEventListener("click", copySummary);
}

function saveScores() {
  localStorage.setItem(CONFIG.storageKeys.scores, JSON.stringify(state.scores));
}

function saveStep() {
  localStorage.setItem(CONFIG.storageKeys.step, String(state.step));
}

function saveResults() {
  localStorage.setItem(CONFIG.storageKeys.results, JSON.stringify(state.results));
}

function restoreState() {
  const savedTab = localStorage.getItem(CONFIG.storageKeys.tab);
  if (savedTab && TABS.includes(savedTab)) showTab(savedTab);

  const savedScores = localStorage.getItem(CONFIG.storageKeys.scores);
  if (savedScores) {
    try {
      state.scores = JSON.parse(savedScores);
      restoreSelections();
    } catch {
      /* ignore */
    }
  }

  const savedStep = parseInt(localStorage.getItem(CONFIG.storageKeys.step) || "1", 10);
  const savedResults = localStorage.getItem(CONFIG.storageKeys.results);

  if (savedResults) {
    try {
      state.results = JSON.parse(savedResults);
    } catch {
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

function diagStep2() {
  if (!allAnswered()) {
    document.getElementById("dw1").style.display = "block";
    return;
  }

  document.getElementById("dw1").style.display = "none";
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

  document.getElementById("scoreGrid").innerHTML = [
    buildMeter("LMI", "Masking Index", lmi, signalLevel(lmi)),
    buildMeter("RAA", "Authority Gap", raa, signalLevel(raa)),
    buildMeter("ITC", "Hidden Labor", itc, signalLevel(itc))
  ].join("");

  const patterns = [];
  if (lmi >= 3.5 && raa >= 3.5) patterns.push("High masking plus high authority gap suggests middle-layer overload and execution drag.");
  if (lmi >= 3.5 && itc >= 3.0) patterns.push("High masking plus elevated ITC suggests disproportionate burden on specific leaders or groups.");
  if (raa >= 3.5 && itc >= 3.5) patterns.push("Authority gaps plus high extraction suggest leaders are absorbing systemic dysfunction directly.");
  if (lmi >= 4) patterns.push("Masking is acute. Expect reduced decision clarity and elevated cognitive fatigue.");
  if (raa >= 4) patterns.push("Authority misalignment is acute. Expect bottlenecks, escalations, and missed delivery windows.");
  if (itc >= 4) patterns.push("Hidden extraction is acute. Expect burnout risk and inequitable burden distribution.");
  if (!patterns.length) patterns.push("Signals are mixed but not acute. Use the recommended entry point to prevent reversion and escalation.");

  document.getElementById("patternBox").innerHTML = `
    <div class="pb-lbl">Pattern Recognition</div>
    ${patterns.map((p) => `<div class="pattern-item">${p}</div>`).join("")}
  `;

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

  document.getElementById("transBox").innerHTML = translation.join("");
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
      desc: "Your strongest signal is authority misalignment. Structural correction—not more interpretation—should now take priority.",
      actions: [
        "Apply the Decision Rights Reset Canvas to key decision areas.",
        "Redesign approval thresholds and eliminate unnecessary escalation layers.",
        "Adjust span of control where overload is concentrated.",
        "Implement targeted structural changes based on observed misalignment."
      ],
      also: "Also review <strong style='color:white;'>Sustain</strong> once authority has moved so the system does not revert."
    };
  } else if (raa >= 3 || lmi >= 3 || itc >= 3) {
    result = {
      key: "phase1",
      phase: "Phase 1",
      title: "Map the System",
      desc: "Your signal pattern suggests meaningful friction, uneven burden, or unclear ownership. Before you redesign, map the system as a whole.",
      actions: [
        "Complete the Authority–Responsibility Gap Mapper across your team or function.",
        "Conduct Load Path Analysis across multiple roles and decision points.",
        "Identify escalation patterns and informal workarounds.",
        "Map where the system relies on human intervention to function."
      ],
      also: "Once mapping is complete, you may need <strong style='color:white;'>Phase 2: Reallocate Authority</strong> if authority gaps remain visible."
    };
  } else {
    result = {
      key: "phase3",
      phase: "Phase 3",
      title: "Lock the System",
      desc: "Your current signal levels suggest a lower-strain state. Embed structural protections now so the system does not drift back into hidden strain.",
      actions: [
        "Establish clear escalation thresholds and decision rules.",
        "Implement the 30–60–90 Dashboard for ongoing monitoring.",
        "Define governance cadence for review.",
        "Reinforce authority alignment across leadership layers."
      ],
      also: "Also review <strong style='color:white;'>Kindle</strong> if future leadership capacity or developmental pathways appear at risk."
    };
  }

  state.results = {
    lmi: lmi.toFixed(1),
    raa: raa.toFixed(1),
    itc: itc.toFixed(1),
    overall: overall.toFixed(1),
    ...result
  };

  saveResults();
  state.step = 3;
  saveStep();

  buildStep3FromResults(state.results);
  switchDiagScreen(3);
  updateProgress(3);
}

function buildStep3FromResults(result) {
  const ref = CONFIG.manualRefs[result.key];

  document.getElementById("ep-headline").textContent = `Begin with ${result.phase}: ${result.title}`;
  document.getElementById("phaseCard").innerHTML = `
    <div class="phase-card-head">
      <div class="pch-eyebrow">Recommended Entry Point</div>
      <div class="pch-title">${result.phase} · ${result.title}</div>
    </div>
    <div class="phase-card-body">
      <p class="pca-desc">${result.desc}</p>
      <ul class="pca-list">
        ${result.actions.map((a) => `<li><div class="pca-dot">›</div>${a}</li>`).join("")}
      </ul>
    </div>
  `;

  document.getElementById("manualRefBox").innerHTML = `
    <div class="manual-ref-icon" aria-hidden="true">REF</div>
    <div class="mr-text">
      <strong>Manual Reference</strong>
      ${ref.label} · ${ref.pages}. Turn there next.
    </div>
  `;

  document.getElementById("alsoRecText").innerHTML = result.also;
}

function switchDiagScreen(step) {
  [1, 2, 3].forEach((n) => {
    document.getElementById(`ds-${n}`)?.classList.remove("active");
  });
  document.getElementById(`ds-${step}`)?.classList.add("active");
}

function updateProgress(step) {
  for (let i = 1; i <= 3; i += 1) {
    const dot = document.getElementById(`dp${i}`);
    const label = document.getElementById(`dl${i}`);
    dot.classList.remove("active", "done");
    label.classList.remove("active", "done");

    if (i < step) {
      dot.classList.add("done");
      dot.textContent = "✓";
      label.classList.add("done");
    } else if (i === step) {
      dot.classList.add("active");
      dot.textContent = `0${i}`;
      label.classList.add("active");
    } else {
      dot.textContent = `0${i}`;
    }
  }
}

function diagReset() {
  state.scores = {
    lmi: [0, 0, 0],
    raa: [0, 0, 0],
    itc: [0, 0, 0]
  };
  state.step = 1;
  state.results = null;

  localStorage.removeItem(CONFIG.storageKeys.scores);
  localStorage.removeItem(CONFIG.storageKeys.step);
  localStorage.removeItem(CONFIG.storageKeys.results);

  document.querySelectorAll(".freq-opt").forEach((btn) => {
    btn.classList.remove("sel");
    btn.setAttribute("aria-pressed", "false");
  });

  document.getElementById("dw1").style.display = "none";
  switchDiagScreen(1);
  updateProgress(1);
}

async function copySummary() {
  if (!state.results) return;

  const summary = [
    "UNMASK Diagnostic Summary",
    "-------------------------",
    `LMI: ${state.results.lmi}`,
    `RAA: ${state.results.raa}`,
    `ITC: ${state.results.itc}`,
    `Recommended Entry Point: ${state.results.phase} — ${state.results.title}`,
    "",
    "Next Steps:",
    ...state.results.actions.map((a, i) => `${i + 1}. ${a}`)
  ].join("\n");

  try {
    await navigator.clipboard.writeText(summary);
    const btn = document.getElementById("copySummaryBtn");
    const original = btn.textContent;
    btn.textContent = "Summary Copied";
    setTimeout(() => {
      btn.textContent = original;
    }, 1800);
  } catch {
    alert(summary);
  }
}

function initCharts() {
  initMaskingChart();
  initManageChart();
}

function initMaskingChart() {
  const canvas = document.getElementById("uncoverChart");
  if (!canvas) return;

  new Chart(canvas.getContext("2d"), {
    type: "bar",
    data: {
      labels: ["Satisfied", "Exhausted", "Cynical"],
      datasets: [{
        data: [1, 1.8, 3.0],
        backgroundColor: ["#58BBC2", "#123D72", "#F43F5E"],
        borderRadius: 10,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.raw}× turnover risk`
          }
        }
      },
      scales: {
        y: { display: false },
        x: {
          grid: { display: false },
          ticks: {
            font: { family: "Urbanist", weight: "bold" }
          }
        }
      }
    }
  });
}

function initManageChart() {
  const target = document.getElementById("manageChart");
  if (!target) return;

  Plotly.newPlot(
    "manageChart",
    [
      {
        x: ["Q1", "Q2", "Q3", "Q4"],
        y: [20, 55, 85, 98],
        mode: "lines+markers",
        name: "AI Strain",
        line: { color: "#F43F5E", width: 3 },
        marker: { size: 7 }
      },
      {
        x: ["Q1", "Q2", "Q3", "Q4"],
        y: [95, 80, 45, 15],
        mode: "lines+markers",
        name: "Human Capacity",
        line: { color: "#123D72", width: 3 },
        marker: { size: 7 }
      }
    ],
    {
      margin: { l: 40, r: 20, t: 20, b: 50 },
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      legend: {
        orientation: "h",
        y: -0.2,
        font: { family: "Urbanist", size: 11 }
      },
      font: { family: "Urbanist" }
    },
    {
      displayModeBar: false,
      responsive: true
    }
  );
}
