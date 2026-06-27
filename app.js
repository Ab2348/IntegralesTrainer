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
    settingsToggle: document.getElementById("settingsToggle"),
    settingsContent: document.getElementById("settingsContent"),
    settingsContentInner: document.querySelector(".settings-content-inner"),
    controlsPanel: document.getElementById("controlsPanel"),
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

  function setSettingsContentAvailability(isOpen) {
    if (!els.settingsContent) {
      return;
    }

    els.settingsContent.setAttribute("aria-hidden", String(!isOpen));
    if ("inert" in els.settingsContent) {
      els.settingsContent.inert = !isOpen;
    }
  }

  function setSettingsPanelOpen(isOpen, animate = true) {
    if (!els.settingsToggle || !els.settingsContent || !els.controlsPanel) {
      return;
    }

    const mobile = window.matchMedia("(max-width: 980px)").matches;
    if (!mobile) {
      els.settingsToggle.setAttribute("aria-expanded", "true");
      els.settingsToggle.tabIndex = -1;
      els.controlsPanel.dataset.settingsCollapsed = "false";
      els.settingsContent.hidden = false;
      els.settingsContent.style.maxHeight = "";
      setSettingsContentAvailability(true);
      return;
    }

    const open = Boolean(isOpen);
    els.settingsToggle.tabIndex = 0;
    els.settingsToggle.setAttribute("aria-expanded", String(open));
    els.controlsPanel.dataset.settingsCollapsed = String(!open);
    setSettingsContentAvailability(open);

    if (!animate) {
      els.settingsContent.hidden = !open;
      els.settingsContent.style.maxHeight = open
        ? `${els.settingsContent.scrollHeight}px`
        : "0px";
      return;
    }

    els.settingsContent.hidden = false;
    if (open) {
      els.settingsContent.style.maxHeight = "0px";
      requestAnimationFrame(() => {
        els.settingsContent.style.maxHeight = `${els.settingsContent.scrollHeight}px`;
      });
      return;
    }

    els.settingsContent.style.maxHeight = `${els.settingsContent.scrollHeight}px`;
    els.settingsContent.offsetHeight;
    els.settingsContent.style.maxHeight = "0px";
  }

  function toggleSettingsPanel() {
    if (!els.settingsToggle) {
      return;
    }

    setSettingsPanelOpen(
      els.settingsToggle.getAttribute("aria-expanded") !== "true",
    );
  }

  function bindMobileSettingsPanel() {
    if (!els.settingsToggle || !els.settingsContent) {
      return;
    }

    els.settingsToggle.addEventListener("click", () => {
      if (window.matchMedia("(max-width: 980px)").matches) {
        toggleSettingsPanel();
      }
    });

    els.settingsContent.addEventListener("transitionend", (event) => {
      if (
        event.propertyName === "max-height" &&
        els.settingsToggle.getAttribute("aria-expanded") !== "true"
      ) {
        els.settingsContent.hidden = true;
      }
    });

    window.addEventListener("resize", () => {
      setSettingsPanelOpen(
        !window.matchMedia("(max-width: 980px)").matches,
        false,
      );
    });

    if (window.ResizeObserver && els.settingsContentInner) {
      const settingsResizeObserver = new ResizeObserver(() => {
        if (
          window.matchMedia("(max-width: 980px)").matches &&
          els.settingsToggle.getAttribute("aria-expanded") === "true"
        ) {
          els.settingsContent.style.maxHeight = `${els.settingsContent.scrollHeight}px`;
        }
      });
      settingsResizeObserver.observe(els.settingsContentInner);
    }

    setSettingsPanelOpen(
      !window.matchMedia("(max-width: 980px)").matches,
      false,
    );
  }

  function bindEvents() {
    controlsPanel.bindEvents();
    els.nextExerciseButton.addEventListener("click", generateNextExercise);
    els.resetStatsButton.addEventListener("click", resetStats);
    els.derivationButton.addEventListener("click", toggleDerivation);
    bindMobileNavigation();
    bindMobileSettingsPanel();
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
