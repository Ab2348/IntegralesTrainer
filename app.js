(function () {
  "use strict";

  const App = window.TrigTrainerApp;
  const Core = App.createPracticeRuntime({
    registry: window.TrigCoreRegistry,
    generator: window.TrigExerciseGenerator,
  });

  let currentExercise = null;
  let answered = false;

  const els = {
    workspace: document.querySelector(".workspace"),
    practicePanel: document.getElementById("practicePanel"),
    modeSelect: document.getElementById("modeSelect"),
    difficultySelect: document.getElementById("difficultySelect"),
    rangeMinInput: document.getElementById("rangeMinInput"),
    rangeMaxInput: document.getElementById("rangeMaxInput"),
    familyChecklist: document.getElementById("familyChecklist"),
    changePracticeTypesButton: document.getElementById(
      "changePracticeTypesButton",
    ),
    nextExerciseButton: document.getElementById("nextExerciseButton"),
    resetStatsButton: document.getElementById("resetStatsButton"),
    familyLabel: document.getElementById("familyLabel"),
    difficultyLabel: document.getElementById("difficultyLabel"),
    exerciseDisplay: document.getElementById("exerciseDisplay"),
    optionsContainer: document.getElementById("optionsContainer"),
    feedbackZone: document.getElementById("feedbackZone"),
    derivationButton: document.getElementById("derivationButton"),
    derivationZone: document.getElementById("derivationZone"),
    totalAnswered: document.getElementById("totalAnswered"),
    totalCorrect: document.getElementById("totalCorrect"),
    totalIncorrect: document.getElementById("totalIncorrect"),
    accuracyRate: document.getElementById("accuracyRate"),
    errorList: document.getElementById("errorList"),
    familyErrorList: document.getElementById("familyErrorList"),
    formulaAccordion: document.getElementById("formulaAccordion"),
    mobileMenuToggle: document.getElementById("mobileMenuToggle"),
    mobileQuickNavButton: document.getElementById("mobileQuickNavButton"),
    mobileSectionNav: document.getElementById("mobileSectionNav"),
    settingsToggle: document.getElementById("settingsToggle"),
    settingsContent: document.getElementById("settingsContent"),
    controlsPanel: document.getElementById("controlsPanel"),
  };

  const stateStore = App.createStateStore(Core);
  const storedScope = stateStore.getPracticeScope();
  if (Core.hasValidScope(storedScope)) {
    stateStore.setPracticeScope(storedScope.typeIds);
  }

  const statsService = App.createStatsService({ Core, stateStore });
  const controlsPanel = App.createControlsPanel({
    Core,
    els,
    stateStore,
    onChangePracticeTypes: openScopeSelector,
  });
  const exerciseView = App.createExerciseView({ Core, els });
  const statsPanel = App.createStatsPanel({
    Core,
    els,
    stateStore,
    statsService,
  });
  const formulaPanel = App.createFormulaPanel({ Core, els });
  const uiOrchestrator = App.createUIOrchestrator({ els });
  const answerController = App.createAnswerController({
    Core,
    exerciseView,
    getCurrentExercise: () => currentExercise,
    getAnswered: () => answered,
    setAnswered: (value) => {
      answered = Boolean(value);
    },
    statsPanel,
    statsService,
    stateStore,
  });
  const pageWarning = App.createPageWarning
    ? App.createPageWarning(App.pageWarningConfig)
    : null;
  const scopeSelector = App.createPracticeScopeSelector({
    Core,
    workspace: els.workspace,
    practicePanel: els.practicePanel,
    controlsPanel: els.controlsPanel,
    onConfirm: confirmPracticeScope,
  });

  function setExerciseActionsEnabled(enabled) {
    if (els.nextExerciseButton) {
      els.nextExerciseButton.disabled = !enabled;
    }
  }

  function hasPracticeScope() {
    return Core.hasValidScope() && stateStore.hasValidPracticeScope();
  }

  function openScopeSelector() {
    setExerciseActionsEnabled(false);
    scopeSelector.show({
      selectedTypeIds: Core.getPracticeScope().typeIds,
    });
  }

  function confirmPracticeScope(typeIds) {
    stateStore.setPracticeScope(typeIds);
    scopeSelector.hide();
    setExerciseActionsEnabled(true);
    currentExercise = null;
    answered = false;
    controlsPanel.syncControlsFromState();
    formulaPanel.render();
    statsPanel.render();
    generateNextExercise();
  }

  function generateNextExercise() {
    if (!hasPracticeScope()) {
      openScopeSelector();
      return;
    }
    const settings = controlsPanel.updateSettingsFromControls();
    try {
      currentExercise = Core.generateExercise({
        settings,
        recentSignatures: stateStore.getState().recentExercises,
        rng: Math.random,
        seed: settings.seed,
        maxAttempts: settings.maxAttempts,
      });
      if (currentExercise && currentExercise.signature) {
        stateStore.pushRecent(currentExercise.signature);
      }
      stateStore.saveState();
      answered = false;
      exerciseView.renderExercise(
        currentExercise,
        settings,
        answerController.answer,
      );
      uiOrchestrator.onExerciseChanged(currentExercise, {
        controlsPanel,
        formulaPanel,
      });
    } catch (error) {
      currentExercise = null;
      answered = false;
      exerciseView.renderGenerationError(error, settings);
    }
  }

  function resetStats() {
    const confirmed = window.confirm("Borrar estadísticas locales?");
    if (!confirmed) {
      return;
    }
    stateStore.resetProgressKeepingSettings();
    statsPanel.render();
  }

  function bindEvents() {
    controlsPanel.bindEvents();
    els.nextExerciseButton.addEventListener("click", generateNextExercise);
    els.resetStatsButton.addEventListener("click", resetStats);
    els.derivationButton.addEventListener("click", () => {
      exerciseView.toggleDerivation(currentExercise, answered);
    });
  }

  function init() {
    uiOrchestrator.init();
    bindEvents();
    statsPanel.render();
    if (hasPracticeScope()) {
      controlsPanel.syncControlsFromState();
      formulaPanel.render();
      setExerciseActionsEnabled(true);
      generateNextExercise();
    } else {
      setExerciseActionsEnabled(false);
      openScopeSelector();
    }
    if (pageWarning) {
      pageWarning.show();
    }
  }

  init();
})();
