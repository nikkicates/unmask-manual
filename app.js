console.log("UNMASK app.js loaded");
console.log("UNMASK config:", window.UNMASK_CONFIG);

const CONFIG = window.UNMASK_CONFIG || {
  links: {
    offers: "#",
    session: "#",
    site: "#",
    inquiries: "#"
  },
  options: [
    { label: "Never", value: 1 },
    { label: "Rarely", value: 2 },
    { label: "Sometimes", value: 3 },
    { label: "Often", value: 4 },
    { label: "Constantly", value: 5 }
  ]
};

const TABS = ["overview", "roi", "diagnostic", "manual", "contact"];

const scores = {
  lmi: [0, 0, 0],
  raa: [0, 0, 0],
  itc: [0, 0, 0]
};

document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM fully loaded");

  bindLinks();
  bindNav();
  bindGoToButtons();
  buildAnswerButtons();
  bindDiagnostic();
  bindROI();
  calcROI();

  console.log("UNMASK init complete");
});

function byId(id) {
  return document.getElementById(id);
}

function bindLinks() {
  const linkMap = {
    offersLinkNav: CONFIG.links.offers,
    offersLinkResults: CONFIG.links.offers,
    offersLinkContact: CONFIG.links.offers,
    sessionLinkOverview: CONFIG.links.session,
    sessionLinkResults: CONFIG.links.session,
    sessionLinkContact: CONFIG.links.session,
    siteLinkContact: CONFIG.links.site,
    inquiriesLinkContact: CONFIG.links.inquiries
  };

  Object.keys(linkMap).forEach(function (id) {
    const el = byId(id);
    if (el) {
      el.href = linkMap[id];
    }
  });
}

function bindNav() {
  const navButtons = document.querySelectorAll(".nav-btn");

  navButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      const tab = btn.dataset.tab;
      console.log("Nav click:", tab);
      showTab(tab);
    });
  });
}

function bindGoToButtons() {
  const gotoButtons = document.querySelectorAll("[data-goto]");

  gotoButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      const tab = btn.dataset.goto;
      console.log("Goto click:", tab);
      showTab(tab);
    });
  });
}

function showTab(tabName) {
  if (!TABS.includes(tabName)) {
    console.warn("Invalid tab:", tabName);
    return;
  }

  TABS.forEach(function (tab) {
    const section = byId("tab-" + tab);
    const nav = byId("n-" + tab);

    if (section) {
      section.classList.remove("active");
    }

    if (nav) {
      nav.classList.remove("active");
      nav.setAttribute("aria-selected", "false");
    }
  });

  const targetSection = byId("tab-" + tabName);
  const targetNav = byId("n-" + tabName);

  if (targetSection) {
    targetSection.classList.add("active");
  }

  if (targetNav) {
    targetNav.classList.add("active");
    targetNav.setAttribute("aria-selected", "true");
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function bindROI() {
  ["sim-team", "sim-sal", "sim-mask", "sim-fric"].forEach(function (id) {
    const el = byId(id);
    if (el) {
      el.addEventListener("input", calcROI);
    }
  });
}

function calcROI() {
  const team = parseInt((byId("sim-team") && byId("sim-team").value) || "10", 10);
  const sal = parseInt((byId("sim-sal") && byId("sim-sal").value) || "125000", 10);
  const mask = parseInt((byId("sim-mask") && byId("sim-mask").value) || "20", 10) / 100;
  const fric = parseInt((byId("sim-fric") && byId("sim-fric").value) || "15", 10) / 100;

  const hrs = Math.round(team * (mask * 20 + fric * 15));
  const fis = (team * sal * (mask * 0.1 + fric * 0.05)) / 1000;

  if (byId("lbl-mask")) byId("lbl-mask").textContent = Math.round(mask * 100) + "%";
  if (byId("lbl-fric")) byId("lbl-fric").textContent = Math.round(fric * 100) + "%";
  if (byId("res-hrs")) byId("res-hrs").textContent = String(hrs);
  if (byId("res-fis")) byId("res-fis").textContent = fis.toFixed(1);
}

function buildAnswerButtons() {
  const rows = document.querySelectorAll(".q-block .freq-row");

  rows.forEach(function (row) {
    row.innerHTML = "";

    CONFIG.options.forEach(function (opt) {
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
  const blocks = document.querySelectorAll(".q-block");

  blocks.forEach(function (block) {
    const group = block.dataset.g;
    const qIndex = parseInt(block.dataset.q, 10);

    block.querySelectorAll(".freq-opt").forEach(function (btn) {
      btn.addEventListener("click", function () {
        block.querySelectorAll(".freq-opt").forEach(function (b) {
          b.classList.remove("sel");
          b.setAttribute("aria-pressed", "false");
        });

        btn.classList.add("sel");
        btn.setAttribute("aria-pressed", "true");
        scores[group][qIndex] = parseInt(btn.dataset.v, 10);
      });
    });
  });

  const runBtn = byId("runAnalysisBtn");
  const entryBtn = byId("seeEntryBtn");
  const retakeBtn = byId("retakeBtn");
  const copyBtn = byId("copySummaryBtn");

  if (runBtn) runBtn.addEventListener("click", runAnalysis);
  if (entryBtn) entryBtn.addEventListener("click", goToEntryPoint);
  if (retakeBtn) retakeBtn.addEventListener("click", resetDiagnostic);
  if (copyBtn) copyBtn.addEventListener("click", copySummary);
}

function allAnswered() {
  return Object.values(scores).every(function (arr) {
    return arr.every(function (v) {
      return v > 0;
    });
  });
}

function average(arr) {
  return arr.reduce(function (a, b) {
    return a + b;
  }, 0) / arr.length;
}

function runAnalysis() {
  if (!allAnswered()) {
    if (byId("dw1")) {
      byId("dw1").style.display = "block";
    }
    return;
  }

  if (byId("dw1")) {
    byId("dw1").style.display = "none";
  }

  const lmi = average(scores.lmi).toFixed(1);
  const raa = average(scores.raa).toFixed(1);
  const itc = average(scores.itc).toFixed(1);

  if (byId("scoreGrid")) {
    byId("scoreGrid").innerHTML = `
      <div class="score-cell">
        <div class="sc-label">Masking Index</div>
        <div class="sc-val">${lmi}</div>
        <div class="sc-lvl">LMI</div>
      </div>
      <div class="score-cell">
        <div class="sc-label">Authority Gap</div>
        <div class="sc-val">${raa}</div>
        <div class="sc-lvl">RAA</div>
      </div>
      <div class="score-cell">
        <div class="sc-label">Hidden Labor</div>
        <div class="sc-val">${itc}</div>
        <div class="sc-lvl">ITC</div>
      </div>
    `;
  }

  if (byId("patternBox")) {
    byId("patternBox").innerHTML = `
      <div class="pb-lbl">Pattern Recognition</div>
      <div class="pattern-item">These are structural signals, not personal failures.</div>
      <div class="pattern-item">Use the entry point recommendation to determine where to begin.</div>
    `;
  }

  if (byId("transBox")) {
    byId("transBox").innerHTML = `
      <p><strong style="color:white;">LMI:</strong> ${lmi}</p>
      <p><strong style="color:white;">RAA:</strong> ${raa}</p>
      <p><strong style="color:white;">ITC:</strong> ${itc}</p>
    `;
  }

  switchDiagScreen(2);
}

function goToEntryPoint() {
  const lmi = average(scores.lmi);
  const raa = average(scores.raa);
  const itc = average(scores.itc);
  const overall = (lmi + raa + itc) / 3;

  let shortTitle = "Phase 1: Map the System";
  let fullTitle = "Begin with Phase 1: Map the System";
  let desc = "Your signal pattern suggests visibility is needed before structural redesign.";

  if (overall >= 3.8 || lmi >= 4 || itc >= 4) {
    shortTitle = "Phase 0: Interrupt the System";
    fullTitle = "Begin with Phase 0: Interrupt the System";
    desc = "Your signal pattern suggests acute structural strain. Reduce pressure first.";
  } else if (raa >= 3.5) {
    shortTitle = "Phase 2: Reallocate Authority";
    fullTitle = "Begin with Phase 2: Reallocate Authority";
    desc = "Authority misalignment appears to be the primary issue.";
  } else if (overall < 2.5) {
    shortTitle = "Phase 3: Lock the System";
    fullTitle = "Begin with Phase 3: Lock the System";
    desc = "Current strain signals are lower. Focus on stabilizing and monitoring.";
  }

  if (byId("ep-headline")) {
    byId("ep-headline").textContent = "Recommended Entry Point";
  }

  if (byId("ep-sub")) {
    byId("ep-sub").textContent = shortTitle;
  }

  if (byId("phaseCard")) {
    byId("phaseCard").innerHTML = `
      <div class="phase-card-head">
        <div class="pch-eyebrow">Recommended Entry Point</div>
        <div class="pch-title">${fullTitle}</div>
      </div>
      <div class="phase-card-body">
        <p class="pca-desc">${desc}</p>
      </div>
    `;
  }

  if (byId("manualRefBox")) {
    byId("manualRefBox").innerHTML = `
      <div class="mr-text">
        <strong>Manual Reference</strong>
        Turn to the corresponding recalibration phase in the manual.
      </div>
    `;
  }

  if (byId("alsoRecText")) {
    byId("alsoRecText").textContent = "Also review the diagnostic chapters before implementing structural changes.";
  }

  switchDiagScreen(3);
}

function switchDiagScreen(step) {
  [1, 2, 3].forEach(function (n) {
    const screen = byId("ds-" + n);
    if (screen) {
      screen.classList.remove("active");
    }
  });

  const activeScreen = byId("ds-" + step);
  if (activeScreen) {
    activeScreen.classList.add("active");
  }

  updateProgress(step);
}

function updateProgress(step) {
  for (let i = 1; i <= 3; i += 1) {
    const dot = byId("dp" + i);
    const label = byId("dl" + i);

    if (!dot || !label) continue;

    dot.classList.remove("active", "done");
    label.classList.remove("active", "done");

    if (i < step) {
      dot.classList.add("done");
      dot.textContent = "✓";
      label.classList.add("done");
    } else if (i === step) {
      dot.classList.add("active");
      dot.textContent = "0" + i;
      label.classList.add("active");
    } else {
      dot.textContent = "0" + i;
    }
  }
}

function resetDiagnostic() {
  scores.lmi = [0, 0, 0];
  scores.raa = [0, 0, 0];
  scores.itc = [0, 0, 0];

  document.querySelectorAll(".freq-opt").forEach(function (btn) {
    btn.classList.remove("sel");
    btn.setAttribute("aria-pressed", "false");
  });

  if (byId("dw1")) {
    byId("dw1").style.display = "none";
  }

  switchDiagScreen(1);
}

async function copySummary() {
  const summary = `
UNMASK Diagnostic Summary

LMI: ${average(scores.lmi).toFixed(1)}
RAA: ${average(scores.raa).toFixed(1)}
ITC: ${average(scores.itc).toFixed(1)}
  `.trim();

  try {
    await navigator.clipboard.writeText(summary);

    const btn = byId("copySummaryBtn");
    if (btn) {
      const original = btn.textContent;
      btn.textContent = "Summary Copied";
      setTimeout(function () {
        btn.textContent = original;
      }, 1500);
    }
  } catch (err) {
    alert(summary);
  }
}
