(function () {
  "use strict";

  const Core = window.TrigCore;
  const App = window.TrigTrainerApp;

  let currentExercise = null;
  let answered = false;

  const els = {
    modeSelect: document.getElementById("modeSelect"),
    difficultySelect: document.getElementById("difficultySelect"),
    rangeMinInput: document.getElementById("rangeMinInput"),
    rangeMaxInput: document.getElementById("rangeMaxInput"),
    familyChecklist: document.getElementById("familyChecklist"),
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
  const statsService = App.createStatsService({ Core, stateStore });
  const controlsPanel = App.createControlsPanel({
    Core,
    els,
    stateStore,
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

  function generateNextExercise() {
    const settings = controlsPanel.updateSettingsFromControls();
    try {
      currentExercise = Core.generateExercise(
        settings,
        stateStore.getState().recentExercises,
        Math.random,
      );
      stateStore.pushRecent(currentExercise.signature);
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
    controlsPanel.syncControlsFromState();
    formulaPanel.render();
    uiOrchestrator.init();
    bindEvents();
    statsPanel.render();
    generateNextExercise();
    if (pageWarning) {
      pageWarning.show();
    }
  }

  init();
})();
