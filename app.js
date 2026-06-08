(function () {
  "use strict";

  const Core = window.TrigCore;
  const STORAGE_KEY = "trig-integral-trainer:v1";
  const RECENT_LIMIT = 20;

  const defaultState = {
    totalAnswered: 0,
    totalCorrect: 0,
    totalIncorrect: 0,
    errorCountsByTag: {},
    familyCounts: {},
    familyErrorCounts: {},
    settings: {
      mode: "basic",
      difficulty: "1",
      rangeMin: -10,
      rangeMax: 10,
      optionCount: 4,
      activeFamilyIds: Core.MODE_FAMILIES.basic.slice(),
    },
    recentExercises: [],
  };

  let state = loadState();
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
  };

  function cloneDefaultState() {
    return JSON.parse(JSON.stringify(defaultState));
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return cloneDefaultState();
      }
      const parsed = JSON.parse(raw);
      return mergeState(parsed);
    } catch (error) {
      return cloneDefaultState();
    }
  }

  function mergeState(saved) {
    const base = cloneDefaultState();
    return {
      ...base,
      ...saved,
      errorCountsByTag: saved.errorCountsByTag || {},
      familyCounts: saved.familyCounts || {},
      familyErrorCounts: saved.familyErrorCounts || {},
      settings: {
        ...base.settings,
        ...(saved.settings || {}),
      },
      recentExercises: Array.isArray(saved.recentExercises)
        ? saved.recentExercises.slice(0, RECENT_LIMIT)
        : [],
    };
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function renderFamilyChecklist() {
    els.familyChecklist.innerHTML = "";
    Core.FAMILIES.forEach((family) => {
      const label = document.createElement("label");
      label.className = "family-check";

      const input = document.createElement("input");
      input.type = "checkbox";
      input.value = family.id;
      input.checked = state.settings.activeFamilyIds.includes(family.id);
      input.addEventListener("change", () => {
        const selected = selectedFamiliesFromDom();
        state.settings.activeFamilyIds = selected.length
          ? selected
          : Core.MODE_FAMILIES.basic.slice();
        state.settings.mode = "custom";
        els.modeSelect.value = "custom";
        saveState();
      });

      const span = document.createElement("span");
      span.className = "family-check-label";
      span.innerHTML = Core.familyLabelHtml(family);

      label.append(input, span);
      els.familyChecklist.appendChild(label);
    });
  }

  function selectedFamiliesFromDom() {
    return Array.from(
      els.familyChecklist.querySelectorAll("input[type='checkbox']:checked"),
    ).map((input) => input.value);
  }

  function syncControlsFromState() {
    els.modeSelect.value = state.settings.mode || "basic";
    els.difficultySelect.value = String(state.settings.difficulty || "1");
    els.rangeMinInput.value = state.settings.rangeMin;
    els.rangeMaxInput.value = state.settings.rangeMax;
    els.optionCountSelect.value = String(state.settings.optionCount || 4);
    renderFamilyChecklist();
  }

  function updateSettingsFromControls() {
    const range = Core.sanitizeRange(
      els.rangeMinInput.value,
      els.rangeMaxInput.value,
    );
    state.settings.mode = els.modeSelect.value;
    state.settings.difficulty = els.difficultySelect.value;
    state.settings.rangeMin = range.min;
    state.settings.rangeMax = range.max;
    state.settings.optionCount =
      Number.parseInt(els.optionCountSelect.value, 10) || 4;
    state.settings.activeFamilyIds = selectedFamiliesFromDom();
    if (!state.settings.activeFamilyIds.length) {
      state.settings.activeFamilyIds = Core.MODE_FAMILIES.basic.slice();
    }
    els.rangeMinInput.value = range.min;
    els.rangeMaxInput.value = range.max;
    saveState();
  }

  function applyMode(mode) {
    const ids = Core.MODE_FAMILIES[mode] || Core.MODE_FAMILIES.basic;
    state.settings.mode = mode;
    state.settings.activeFamilyIds = ids.slice();
    saveState();
    renderFamilyChecklist();
  }

  function pushRecent(signature) {
    state.recentExercises = [signature]
      .concat(state.recentExercises.filter((item) => item !== signature))
      .slice(0, RECENT_LIMIT);
  }

  function generateNextExercise() {
    updateSettingsFromControls();
    currentExercise = Core.generateExercise(
      state.settings,
      state.recentExercises,
      Math.random,
    );
    pushRecent(currentExercise.signature);
    saveState();
    answered = false;
    renderExercise();
  }

  function renderExercise() {
    const family = currentExercise.family;
    els.familyLabel.innerHTML = `Familia ${Core.familyLabelHtml(family)}`;
    els.difficultyLabel.textContent = `Nivel ${state.settings.difficulty}`;
    els.exerciseDisplay.innerHTML = currentExercise.integrandHtml;
    els.optionsContainer.innerHTML = "";
    els.feedbackZone.innerHTML = "";
    els.feedbackZone.className = "feedback-zone";
    els.derivationZone.innerHTML = "";
    els.derivationZone.classList.add("hidden");
    els.derivationButton.classList.add("hidden");
    els.derivationButton.setAttribute("aria-expanded", "false");
    els.nextExerciseButton.textContent = "Siguiente ejercicio";

    currentExercise.options.forEach((option, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "option-button";
      button.dataset.optionId = option.id;
      button.innerHTML = `
        <span class="option-index">Opción ${index + 1}</span>
        <span class="option-math">${option.displayHtml}</span>`;
      button.addEventListener("click", () => answer(option.id));
      els.optionsContainer.appendChild(button);
    });
  }

  function answer(optionId) {
    if (answered || !currentExercise) {
      return;
    }
    const chosen = currentExercise.options.find(
      (option) => option.id === optionId,
    );
    if (!chosen) {
      return;
    }

    answered = true;
    updateStats(chosen);
    renderAnsweredState(chosen);
    renderStats();
    saveState();
  }

  function renderAnsweredState(chosen) {
    const buttons = Array.from(
      els.optionsContainer.querySelectorAll(".option-button"),
    );
    buttons.forEach((button) => {
      const option = currentExercise.options.find(
        (item) => item.id === button.dataset.optionId,
      );
      button.disabled = true;
      if (option.isCorrect) {
        button.classList.add("is-correct");
      }
      if (option.id === chosen.id) {
        button.classList.add("is-selected");
        if (!option.isCorrect) {
          button.classList.add("is-incorrect");
        }
      }
    });

    els.feedbackZone.innerHTML = Core.feedbackHtml(currentExercise, chosen);
    els.feedbackZone.className = `feedback-zone ${chosen.isCorrect ? "correct" : "incorrect"}`;
    els.derivationButton.classList.remove("hidden");
  }

  function updateStats(chosen) {
    const familyId = currentExercise.familyId;
    state.totalAnswered += 1;
    state.familyCounts[familyId] = (state.familyCounts[familyId] || 0) + 1;

    if (chosen.isCorrect) {
      state.totalCorrect += 1;
      return;
    }

    state.totalIncorrect += 1;
    state.errorCountsByTag[chosen.errorTag] =
      (state.errorCountsByTag[chosen.errorTag] || 0) + 1;
    state.familyErrorCounts[familyId] =
      (state.familyErrorCounts[familyId] || 0) + 1;
  }

  function renderStats() {
    const total = state.totalAnswered || 0;
    const correct = state.totalCorrect || 0;
    const incorrect = state.totalIncorrect || 0;
    const accuracy = total ? Math.round((correct / total) * 100) : 0;

    els.totalAnswered.textContent = total;
    els.totalCorrect.textContent = correct;
    els.totalIncorrect.textContent = incorrect;
    els.accuracyRate.textContent = `${accuracy}%`;

    renderRankedList(els.errorList, state.errorCountsByTag, (tag) =>
      Core.errorLabelHtml(tag),
    );
    renderRankedList(
      els.familyErrorList,
      state.familyErrorCounts,
      (familyId) => {
        const family = Core.FAMILY_MAP[familyId];
        return family ? Core.familyLabelHtml(family) : familyId;
      },
    );
  }

  function renderRankedList(container, data, labelFn) {
    const entries = Object.entries(data || {})
      .filter((entry) => entry[1] > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    container.innerHTML = "";
    if (!entries.length) {
      const item = document.createElement("li");
      item.className = "empty-stat";
      item.textContent = "Sin datos";
      container.appendChild(item);
      return;
    }

    entries.forEach(([key, value]) => {
      const item = document.createElement("li");
      item.innerHTML = `<span class="stat-item-label">${labelFn(key)}</span><span class="stat-item-count">${value}</span>`;
      container.appendChild(item);
    });
  }

  function toggleDerivation() {
    if (!currentExercise || !answered) {
      return;
    }
    const hidden = els.derivationZone.classList.contains("hidden");
    if (hidden) {
      els.derivationZone.innerHTML = Core.derivationHtml(currentExercise);
      els.derivationZone.classList.remove("hidden");
      els.derivationButton.textContent = "Ocultar derivación";
      els.derivationButton.setAttribute("aria-expanded", "true");
    } else {
      els.derivationZone.classList.add("hidden");
      els.derivationButton.textContent = "Ver derivación";
      els.derivationButton.setAttribute("aria-expanded", "false");
    }
  }

  function resetStats() {
    const confirmed = window.confirm("Borrar estadísticas locales?");
    if (!confirmed) {
      return;
    }
    const settings = state.settings;
    state = cloneDefaultState();
    state.settings = settings;
    saveState();
    renderStats();
  }

  function bindEvents() {
    els.modeSelect.addEventListener("change", () => {
      applyMode(els.modeSelect.value);
      saveState();
    });

    [
      els.difficultySelect,
      els.rangeMinInput,
      els.rangeMaxInput,
      els.optionCountSelect,
    ].forEach((control) => {
      control.addEventListener("change", () => {
        updateSettingsFromControls();
      });
    });

    els.nextExerciseButton.addEventListener("click", generateNextExercise);
    els.resetStatsButton.addEventListener("click", resetStats);
    els.derivationButton.addEventListener("click", toggleDerivation);
  }

  function init() {
    syncControlsFromState();
    bindEvents();
    renderStats();
    generateNextExercise();
  }

  init();
})();
