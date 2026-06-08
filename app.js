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
    optionCountSelect: document.getElementById("optionCountSelect"),
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
  };

  const stateStore = App.createStateStore(Core);
  const controlsPanel = App.createControlsPanel({
    Core,
    els,
    stateStore,
  });
  const exerciseView = App.createExerciseView({ Core, els });
  const statsPanel = App.createStatsPanel({ Core, els, stateStore });
  const formulaPanel = App.createFormulaPanel({ Core, els });
  const answerController = App.createAnswerController({
    exerciseView,
    getCurrentExercise: () => currentExercise,
    getAnswered: () => answered,
    setAnswered: (value) => {
      answered = Boolean(value);
    },
    statsPanel,
    stateStore,
  });

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
    } catch (error) {
      currentExercise = null;
      answered = false;
      exerciseView.renderGenerationError(error, settings);
    }
  }

  function toggleDerivation() {
    exerciseView.toggleDerivation(currentExercise, answered);
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
    els.derivationButton.addEventListener("click", toggleDerivation);
  }

  function init() {
    controlsPanel.syncControlsFromState();
    bindEvents();
    formulaPanel.render();
    statsPanel.render();
    generateNextExercise();
  }

  init();
})();
