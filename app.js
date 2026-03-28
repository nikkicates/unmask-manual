console.log("STEP 1: app.js loaded");

document.addEventListener("DOMContentLoaded", () => {
  console.log("STEP 2: DOM loaded");
});
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
