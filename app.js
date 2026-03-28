console.log("UNMASK minimal app.js loaded");

const CONFIG = window.UNMASK_CONFIG || {
  links: {
    offers: "#",
    session: "#",
    site: "#",
    inquiries: "mailto:info@example.com"
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

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded");
  bindLinks();
  bindNav();
  bindGoToButtons();
  buildAnswerButtons();
  bindDiagnostic();
  bindROI();
  calcROI();
});

function $(id) {
  return document.getElementById(id);
}

function bindLinks() {
  const map = {
    offersLinkNav: CONFIG.links.offers,
    offersLinkResults: CONFIG.links.offers,
    offersLinkContact: CONFIG.links.offers,
    sessionLinkOverview: CONFIG.links.session,
    sessionLinkResults: CONFIG.links.session,
    sessionLinkContact: CONFIG.links.session,
    siteLinkContact: CONFIG.links.site,
    inquiriesLinkContact: CONFIG.links.inquiries
  };

  Object.entries(map).forEach(([id, href]) => {
    const el = $(id);
    if (el) el.href = href;
  });
}

function bindNav() {
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab;
      console.log("nav click:", tab);
      showTab(tab);
    });
  });
}

function bindGoToButtons() {
  document.querySelectorAll("[data-goto]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.goto;
      console.log("goto click:", tab);
      showTab(tab);
    });
  });
}

function showTab(tabName) {
  if (!TABS.includes(tabName)) {
    console.warn("Invalid tab:", tabName);
    return;
  }

  TABS.forEach((tab) => {
    const section = $(`tab-${tab}`);
    const nav = $(`n-${tab}`);

    if (section) section.classList.remove("active");
    if (nav) {
      nav.classList.remove("active");
      nav.setAttribute("aria-selected", "false");
    }
  });

  const targetSection = $(`tab-${tabName}`);
  const targetNav = $(`n-${tabName}`);

  if (targetSection) targetSection.classList.add("active");
  if (targetNav) {
    targetNav.classList.add("active");
    targetNav.setAttribute("aria-selected", "true");
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function bindROI() {
  ["sim-team", "sim-sal", "sim-mask", "sim-fric"].forEach((id) => {
    const el = $(id);
    if (el) el.addEventListener("input", calcROI);
  });
}

function calcROI() {
  const team = parseInt($("sim-team")?.value || "10", 10);
  const sal = parseInt($("sim-sal")?.value || "125000", 10);
  const mask = parseInt($("sim-mask")?.value || "20", 10) / 100;
  const fric = parseInt($("sim-fric")?.value || "15", 10) / 100;

  const hrs = Math.round(team * (mask * 20 + fric * 15));
  const fis = (team * sal * (mask * 0.1 + fric * 0.05)) / 1000;

  if ($("lbl-mask")) $("lbl-mask").textContent = `${Math.round(mask * 100)}%`;
  if ($("lbl-fric")) $("lbl-fric").textContent = `${Math.round(fric * 100)}%`;
  if ($("res-hrs")) $("res-hrs").textContent = `${hrs}`;
  if ($("res-fis")) $("res-fis").textContent = `${fis.toFixed(1)}`;
}

function buildAnswerButtons() {
  const rows = document.querySelectorAll(".q-block .freq-row");
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
    const q = parseInt(block.dataset.q, 10);

    block.querySelectorAll(".freq-opt").forEach((btn) => {
      btn.addEventListener("click", () => {
        block.querySelectorAll(".freq-opt").forEach((b) => {
          b.classList.remove("sel");
          b.setAttribute("aria-pressed", "false");
        });

        btn.classList.add("sel");
        btn.setAttribute("aria-pressed", "true");
        scores[group][q] = parseInt(btn.dataset.v, 10);
      });
    });
  });

  $("runAnalysisBtn")?.addEventListener("click", runAnalysis);
  $("seeEntryBtn")?.addEventListener("click", showEntryPoint);
  $("retakeBtn")?.addEventListener("click", resetDiagnostic);
  $("copySummaryBtn")?.addEventListener("click", copySummary);
}

function allAnswered() {
  return Object.values(scores).every((arr) => arr.every((v) => v > 0));
}

function avg(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function levelLabel(v) {
  if (v <= 1.6) return { label: "Low Signal", color: "#22c55e" };
  if (v <= 2.6) return { label: "Moderate Signal", color: "#58BBC2" };
  if (v <= 3.6) return { label: "Elevated Signal", color: "#F97316" };
  return { label: "Acute Signal", color: "#F43F5E" };
}

function runAnalysis() {
  if (!allAnswered()) {
    if ($("dw1")) $("dw1").style.display = "block";
    return;
  }

  if ($("dw1")) $("dw1").style.display = "none";

  const lmi = avg(scores.lmi);
  const raa = avg(scores.raa);
  const itc = avg(scores.itc);

  if ($("scoreGrid")) {
    $("scoreGrid").innerHTML = [
      renderScore("LMI", "Masking Index", lmi),
      renderScore("RAA", "Authority Gap", raa),
      renderScore("ITC", "Hidden Labor", itc)
    ].join("");
  }

  if ($("patternBox")) {
    $("patternBox").innerHTML = `
      <div class="pb-lbl">Pattern Recognition</div>
      <div class="pattern-item">These signals should be treated as structural indicators, not personal shortcomings.</div>
      <div class="pattern-item">Use the next step to identify where to begin in the recalibration system.</div>
    `;
  }

  if ($("transBox")) {
    $("transBox").innerHTML = `
      <p><strong style="color:white;">LMI:</strong> ${lmi.toFixed(1)}</p>
      <p><strong style="color:white;">RAA:</strong> ${raa.toFixed(1)}</p>
      <p><strong style="color:white;">ITC:</strong> ${itc.toFixed(1)}</p>
    `;
  }

  switchDiagScreen(2);
}

function renderScore(code, label, value) {
  const lvl = levelLabel(value);
  const pct = Math.round(((value - 1) / 4) * 100);

  return `
    <div class="score-cell">
      <div class="sc-label">${label}</div>
      <div class="sc-val" style="color:${lvl.color}">${value.toFixed(1)}</div>
      <div class="sc-lvl" style="color:${lvl.color}">${lvl.label}</div>
      <div class="bar-track">
        <div class="bar-fill" style="width:${pct}%;background:${lvl.color}"></div>
      </div>
      <div class="sc-label" style="margin-top:0.45rem;">${code}</div>
    </div>
  `;
}

function showEntryPoint() {
  const lmi = avg(scores.lmi);
  const raa = avg(scores.raa);
  const itc = avg(scores.itc);
  const overall = (lmi + raa + itc) / 3;

  let title = "Begin with Phase 1: Map the System";
  let desc = "Your signal pattern suggests the need for visibility before intervention.";
  let actions = [
    "Complete the Authority–Responsibility Gap Mapper.",
    "Conduct Load Path Analysis.",
    "Identify escalation patterns and informal workarounds."
  ];

  if (overall >= 3.8 || lmi >= 4 || itc >= 4) {
    title = "Begin with Phase 0: Interrupt the System";
    desc = "Your signal pattern suggests acute strain. Reduce pressure first.";
    actions = [
      "Remove one visible burden.",
      "Eliminate one recurring escalation loop.",
      "Reassign one decision to the appropriate level."
    ];
  } else if (raa >= 3.5) {
    title = "Begin with Phase 2: Reallocate Authority";
    desc = "Your strongest signal is authority misalignment. Structural correction should now take priority.";
    actions = [
      "Apply the Decision Rights Reset Canvas.",
      "Redesign approval thresholds.",
      "Adjust span of control where overload is concentrated."
    ];
  } else if (overall < 2.5) {
    title = "Begin with Phase 3: Lock the System";
    desc = "Your current signal levels suggest lower strain. Focus on maintaining structural integrity.";
    actions = [
      "Define escalation thresholds.",
      "Track KRIs.",
      "Reinforce decision ownership clarity."
    ];
  }

  if ($("ep-headline")) $("ep-headline").textContent = title;
  if ($("ep-sub")) $("ep-sub").textContent = desc;

  if ($("phaseCard")) {
    $("phaseCard").innerHTML = `
      <div class="phase-card-head">
        <div class="pch-eyebrow">Recommended Entry Point</div>
        <div class="pch-title">${title}</div>
      </div>
      <div class="phase-card-body">
        <p class="pca-desc">${desc}</p>
        <ul class="pca-list">
          ${actions.map((a) => `<li><div class="pca-dot">›</div>${a}</li>`).join("")}
        </ul>
      </div>
    `;
  }

  if ($("manualRefBox")) {
    $("manualRefBox").innerHTML = `
      <div class="mr-text">
        <strong>Manual Reference</strong>
        Turn to the corresponding recalibration phase in the manual.
      </div>
    `;
  }

  if ($("alsoRecText")) {
    $("alsoRecText").innerHTML =
      "Also review the relevant diagnostic sections before implementing structural changes.";
  }

  switchDiagScreen(3);
}

function switchDiagScreen(step) {
  [1, 2, 3].forEach((n) => {
    $("ds-" + n)?.classList.remove("active");
  });
  $("ds-" + step)?.classList.add("active");

  updateProgress(step);
}

function updateProgress(step) {
  for (let i = 1; i <= 3; i++) {
    const dot = $("dp" + i);
    const label = $("dl" + i);
    if (!dot || !label) continue;

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

function resetDiagnostic() {
  scores.lmi = [0, 0, 0];
  scores.raa = [0, 0, 0];
  scores.itc = [0, 0, 0];

  document.querySelectorAll(".freq-opt").forEach((btn) => {
    btn.classList.remove("sel");
    btn.setAttribute("aria-pressed", "false");
  });

  if ($("dw1")) $("dw1").style.display = "none";
  switchDiagScreen(1);
}

async function copySummary() {
  const summary = `
UNMASK Diagnostic Summary

LMI: ${avg(scores.lmi).toFixed(1)}
RAA: ${avg(scores.raa).toFixed(1)}
ITC: ${avg(scores.itc).toFixed(1)}
`.trim();

  try {
    await navigator.clipboard.writeText(summary);
    const btn = $("copySummaryBtn");
    if (btn) {
      const old = btn.textContent;
      btn.textContent = "Summary Copied";
      setTimeout(() => {
        btn.textContent = old;
      }, 1500);
    }
  } catch (err) {
    alert(summary);
  }
}
