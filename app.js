(function () {
  "use strict";

  const Core = window.TrigCore;
  const STORAGE_KEY = "trig-integral-trainer:v1";
  const RECENT_LIMIT = 20;
  const VALID_MODES = new Set(Object.keys(Core.MODE_FAMILIES));
  const VALID_DIFFICULTIES = new Set(["1", "2", "3", "4", "5"]);
  const VALID_OPTION_COUNTS = new Set(["4", "5", "6"]);
  const VALID_ERROR_TAGS = new Set(Core.ERROR_TAGS);
  const VALID_FAMILY_IDS = new Set(Core.FAMILIES.map((family) => family.id));

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

  function isPlainObject(value) {
    return Boolean(
      value && Object.prototype.toString.call(value) === "[object Object]",
    );
  }

  function normalizeCounter(value) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? Math.floor(number) : 0;
  }

  function normalizeCountMap(value, validKeys) {
    if (!isPlainObject(value)) {
      return {};
    }
    return Object.entries(value).reduce((result, [key, count]) => {
      if (validKeys.has(key)) {
        const normalized = normalizeCounter(count);
        if (normalized > 0) {
          result[key] = normalized;
        }
      }
      return result;
    }, {});
  }

  function normalizeFamilyIds(value, fallbackIds) {
    const fallback = Array.isArray(fallbackIds)
      ? fallbackIds
      : Core.MODE_FAMILIES.basic;
    if (!Array.isArray(value)) {
      return fallback.slice();
    }
    const ids = value.filter(
      (id, index) =>
        VALID_FAMILY_IDS.has(id) && value.indexOf(id) === index,
    );
    return ids.length ? ids : fallback.slice();
  }

  function normalizeSettings(value) {
    const base = cloneDefaultState().settings;
    const saved = isPlainObject(value) ? value : {};
    const range = Core.sanitizeRange(saved.rangeMin, saved.rangeMax);
    const mode = VALID_MODES.has(saved.mode) ? saved.mode : base.mode;
    const difficulty = VALID_DIFFICULTIES.has(String(saved.difficulty))
      ? String(saved.difficulty)
      : base.difficulty;
    const optionCount = VALID_OPTION_COUNTS.has(String(saved.optionCount))
      ? Number.parseInt(saved.optionCount, 10)
      : base.optionCount;

    return {
      mode,
      difficulty,
      rangeMin: range.min,
      rangeMax: range.max,
      optionCount,
      activeFamilyIds: normalizeFamilyIds(
        saved.activeFamilyIds,
        Core.MODE_FAMILIES[mode],
      ),
    };
  }

  function normalizeRecentExercises(value) {
    if (!Array.isArray(value)) {
      return [];
    }
    return value
      .filter(
        (item, index) =>
          typeof item === "string" && value.indexOf(item) === index,
      )
      .slice(0, RECENT_LIMIT);
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return cloneDefaultState();
      }
      const parsed = JSON.parse(raw);
      if (!isPlainObject(parsed)) {
        return cloneDefaultState();
      }
      return mergeState(parsed);
    } catch (error) {
      return cloneDefaultState();
    }
  }

  function mergeState(saved) {
    const base = cloneDefaultState();
    const totalCorrect = normalizeCounter(saved.totalCorrect);
    const totalIncorrect = normalizeCounter(saved.totalIncorrect);
    const savedTotalAnswered = normalizeCounter(saved.totalAnswered);
    return {
      ...base,
      totalAnswered: Math.max(savedTotalAnswered, totalCorrect + totalIncorrect),
      totalCorrect,
      totalIncorrect,
      errorCountsByTag: normalizeCountMap(
        saved.errorCountsByTag,
        VALID_ERROR_TAGS,
      ),
      familyCounts: normalizeCountMap(saved.familyCounts, VALID_FAMILY_IDS),
      familyErrorCounts: normalizeCountMap(
        saved.familyErrorCounts,
        VALID_FAMILY_IDS,
      ),
      settings: normalizeSettings(saved.settings),
      recentExercises: normalizeRecentExercises(saved.recentExercises),
    };
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (error) {
      return false;
    }
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
    if (Core.RANGE_LIMITS) {
      els.rangeMinInput.min = Core.RANGE_LIMITS.min;
      els.rangeMinInput.max = Core.RANGE_LIMITS.max;
      els.rangeMaxInput.min = Core.RANGE_LIMITS.min;
      els.rangeMaxInput.max = Core.RANGE_LIMITS.max;
    }
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
    state.settings.mode = VALID_MODES.has(els.modeSelect.value)
      ? els.modeSelect.value
      : "basic";
    state.settings.difficulty = VALID_DIFFICULTIES.has(
      els.difficultySelect.value,
    )
      ? els.difficultySelect.value
      : "1";
    state.settings.rangeMin = range.min;
    state.settings.rangeMax = range.max;
    state.settings.optionCount = VALID_OPTION_COUNTS.has(
      els.optionCountSelect.value,
    )
      ? Number.parseInt(els.optionCountSelect.value, 10)
      : 4;
    state.settings.activeFamilyIds = normalizeFamilyIds(
      selectedFamiliesFromDom(),
    );
    if (!state.settings.activeFamilyIds.length) {
      state.settings.activeFamilyIds = Core.MODE_FAMILIES.basic.slice();
    }
    els.rangeMinInput.value = range.min;
    els.rangeMaxInput.value = range.max;
    saveState();
  }

  function applyMode(mode) {
    const safeMode = VALID_MODES.has(mode) ? mode : "basic";
    const ids = Core.MODE_FAMILIES[safeMode] || Core.MODE_FAMILIES.basic;
    state.settings.mode = safeMode;
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
    try {
      currentExercise = Core.generateExercise(
        state.settings,
        state.recentExercises,
        Math.random,
      );
      pushRecent(currentExercise.signature);
      saveState();
      answered = false;
      renderExercise();
    } catch (error) {
      currentExercise = null;
      answered = false;
      renderGenerationError(error);
    }
  }

  function renderGenerationError(error) {
    els.familyLabel.textContent = "Familia";
    els.difficultyLabel.textContent = `Nivel ${state.settings.difficulty}`;
    els.exerciseDisplay.textContent = "";
    els.optionsContainer.innerHTML = "";
    els.derivationZone.innerHTML = "";
    els.derivationZone.classList.add("hidden");
    els.derivationButton.classList.add("hidden");
    els.derivationButton.setAttribute("aria-expanded", "false");

    const title = document.createElement("div");
    title.className = "feedback-title";
    title.textContent = "No se pudo generar el ejercicio";

    const message = document.createElement("p");
    message.textContent =
      error && error.message
        ? error.message
        : "Revisa la configuracion e intenta de nuevo.";

    els.feedbackZone.innerHTML = "";
    els.feedbackZone.className = "feedback-zone incorrect";
    els.feedbackZone.append(title, message);
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
      trustedHtml(Core.errorLabelHtml(tag)),
    );
    renderRankedList(
      els.familyErrorList,
      state.familyErrorCounts,
      (familyId) => {
        const family = Core.FAMILY_MAP[familyId];
        return family
          ? trustedHtml(Core.familyLabelHtml(family))
          : plainText(familyId);
      },
    );
  }

  function trustedHtml(html) {
    return { type: "html", value: html };
  }

  function plainText(text) {
    return { type: "text", value: String(text) };
  }

  function appendLabel(label, target) {
    if (label.type === "html") {
      target.innerHTML = label.value;
    } else {
      target.textContent = label.value;
    }
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
      const label = document.createElement("span");
      label.className = "stat-item-label";
      appendLabel(labelFn(key), label);

      const count = document.createElement("span");
      count.className = "stat-item-count";
      count.textContent = value;

      item.append(label, count);
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
