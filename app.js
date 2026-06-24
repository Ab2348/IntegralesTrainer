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
    mobileMenuToggle: document.getElementById("mobileMenuToggle"),
    mobileQuickNavButton: document.getElementById("mobileQuickNavButton"),
    mobileSectionNav: document.getElementById("mobileSectionNav"),
  };

  const mobileNavLinks = Array.from(
    document.querySelectorAll("#mobileSectionNav a"),
  );

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
    Core,
    exerciseView,
    getCurrentExercise: () => currentExercise,
    getAnswered: () => answered,
    setAnswered: (value) => {
      answered = Boolean(value);
    },
    statsPanel,
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

  function setMobileNavOpen(isOpen) {
    if (!els.mobileSectionNav) {
      return;
    }

    const open = Boolean(isOpen);
    els.mobileSectionNav.hidden = !open;
    if (els.mobileMenuToggle) {
      els.mobileMenuToggle.setAttribute("aria-expanded", String(open));
    }
  }

  function toggleMobileNav() {
    setMobileNavOpen(els.mobileSectionNav.hidden);
  }

  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function bindMobileNavigation() {
    if (els.mobileMenuToggle) {
      els.mobileMenuToggle.addEventListener("click", toggleMobileNav);
    }

    if (els.mobileQuickNavButton) {
      els.mobileQuickNavButton.addEventListener("click", scrollToTop);
    }

    mobileNavLinks.forEach((link) => {
      link.addEventListener("click", () => {
        setMobileNavOpen(false);
      });
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        setMobileNavOpen(false);
      }
    });

    window.addEventListener("resize", () => {
      if (window.matchMedia("(min-width: 981px)").matches) {
        setMobileNavOpen(false);
      }
    });
  }

  function bindEvents() {
    controlsPanel.bindEvents();
    els.nextExerciseButton.addEventListener("click", generateNextExercise);
    els.resetStatsButton.addEventListener("click", resetStats);
    els.derivationButton.addEventListener("click", toggleDerivation);
    bindMobileNavigation();
  }

  function init() {
    controlsPanel.syncControlsFromState();
    bindEvents();
    formulaPanel.render();
    statsPanel.render();
    generateNextExercise();
    if (pageWarning) {
      pageWarning.show();
    }
  }

  init();
})();
