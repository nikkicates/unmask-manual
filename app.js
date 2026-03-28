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

  if (byId("ep-headline")) byId("ep-headline").textContent = "Recommended Entry Point";
  if (byId("ep-sub")) byId("ep-sub").textContent = shortTitle;

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
    byId("alsoRecText").textContent =
      "Also review the diagnostic chapters before implementing structural changes.";
  }

  switchDiagScreen(3);
}
