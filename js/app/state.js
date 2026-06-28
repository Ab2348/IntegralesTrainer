(function (root) {
  "use strict";

  const App = (root.TrigTrainerApp = root.TrigTrainerApp || {});

  App.createStateStore = function createStateStore(Core) {
    const BASE_STORAGE_KEY = "trig-integral-trainer:v1";
    const STORAGE_KEY = BASE_STORAGE_KEY;
    const RECENT_LIMIT = 20;
    const ERROR_EXAMPLES_PER_TAG_LIMIT = 1;
    const ERROR_EXAMPLE_TEXT_LIMIT = 360;
    const VALID_DIFFICULTIES = new Set(["1", "2", "3", "4", "5"]);

    let state = loadState();

    function cloneDefaultState() {
      return JSON.parse(JSON.stringify(defaultState()));
    }

    function modeFamilies() {
      return (Core && Core.MODE_FAMILIES) || {};
    }

    function modeIds() {
      return Object.keys(modeFamilies());
    }

    function defaultModeId() {
      const ids = modeIds();
      return typeof Core.defaultModeId === "string" &&
        ids.includes(Core.defaultModeId)
        ? Core.defaultModeId
        : ids[0] || "";
    }

    function customModeId() {
      const ids = modeIds();
      return typeof Core.customModeId === "string" &&
        ids.includes(Core.customModeId)
        ? Core.customModeId
        : defaultModeId();
    }

    function validModes() {
      return new Set(modeIds());
    }

    function validErrorTags() {
      return new Set(
        ((Core && Core.ERROR_TYPES) || [])
          .map((error) => error.id)
          .concat((Core && Core.ERROR_TAGS) || []),
      );
    }

    function validFamilyIds() {
      return new Set(((Core && Core.FAMILIES) || []).map((family) => family.id));
    }

    function validMathFamilyIds() {
      return new Set(
        ((Core && Core.MATH_FAMILIES) || []).map((family) => family.id),
      );
    }

    function validMethodIds() {
      return new Set(((Core && Core.METHODS) || []).map((method) => method.id));
    }

    function defaultMathFamilyIds() {
      return ((Core && Core.MATH_FAMILIES) || [])
        .filter((family) => family && family.enabled !== false)
        .map((family) => family.id)
        .filter(Boolean);
    }

    function defaultMethodIds() {
      return ((Core && Core.METHODS) || [])
        .filter((method) => method && method.enabled !== false)
        .map((method) => method.id)
        .filter(Boolean);
    }

    function defaultState() {
      const mode = defaultModeId();
      return {
        practiceScope: { typeIds: [] },
        totalAnswered: 0,
        totalCorrect: 0,
        totalIncorrect: 0,
        errorCountsByTag: {},
        familyCounts: {},
        familyErrorCounts: {},
        mathFamilyCounts: {},
        mathFamilyErrorCounts: {},
        methodCounts: {},
        methodErrorCounts: {},
        submethodCounts: {},
        submethodErrorCounts: {},
        difficultyCounts: {},
        difficultyErrorCounts: {},
        templateCounts: {},
        templateErrorCounts: {},
        variantCounts: {},
        variantErrorCounts: {},
        errorExamplesByTag: {},
        recentErrorHistory: [],
        settings: {
          mode,
          practiceMode: "practice",
          difficulty: "1",
          rangeMin: -20,
          rangeMax: 20,
          activeFamilyIds: familyIdsForMode(mode),
          activeMathFamilyIds: defaultMathFamilyIds(),
          activeMethodIds: defaultMethodIds(),
          includePendingMethods: false,
          includeExperimentalMethods: true,
          disabledTemplateIds: [],
        },
        recentExercises: [],
      };
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
        if (!validKeys || validKeys.has(key)) {
          const normalized = normalizeCounter(count);
          if (normalized > 0) {
            result[key] = normalized;
          }
        }
        return result;
      }, {});
    }

    function keyFilter(validKeys) {
      return validKeys && validKeys.size ? validKeys : null;
    }

    function normalizeBoolean(value) {
      return value === true || value === "true";
    }

    function familyIdsForMode(mode) {
      const familiesByMode = modeFamilies();
      const validIds = validFamilyIds();
      const idsForMode = Array.isArray(familiesByMode[mode])
        ? familiesByMode[mode]
        : [];
      const ids = idsForMode.filter(
        (id, index) =>
          validIds.has(id) && idsForMode.indexOf(id) === index,
      );
      if (ids.length) {
        return ids;
      }
      return ((Core && Core.FAMILIES) || []).map((family) => family.id).filter(Boolean);
    }

    function normalizeFamilyIds(value, fallbackIds) {
      const fallback = Array.isArray(fallbackIds)
        ? fallbackIds
        : familyIdsForMode(defaultModeId());
      const validIds = validFamilyIds();
      if (!Array.isArray(value)) {
        return fallback.slice();
      }
      const ids = value.filter(
        (id, index) =>
          validIds.has(id) && value.indexOf(id) === index,
      );
      return ids.length ? ids : fallback.slice();
    }

    function normalizeMethodIds(value, fallbackIds) {
      const fallback = Array.isArray(fallbackIds) && fallbackIds.length
        ? fallbackIds
        : defaultMethodIds();
      const validIds = validMethodIds();
      if (!Array.isArray(value)) {
        return fallback.slice();
      }
      const ids = value.filter(
        (id, index) =>
          validIds.has(id) && value.indexOf(id) === index,
      );
      return ids.length ? ids : fallback.slice();
    }

    function normalizeMathFamilyIds(value, fallbackIds) {
      const fallback = Array.isArray(fallbackIds) && fallbackIds.length
        ? fallbackIds
        : defaultMathFamilyIds();
      const validIds = validMathFamilyIds();
      if (!Array.isArray(value)) {
        return fallback.slice();
      }
      const ids = value.filter(
        (id, index) =>
          validIds.has(id) && value.indexOf(id) === index,
      );
      return ids.length ? ids : fallback.slice();
    }

    function normalizeTemplateIds(value) {
      if (!Array.isArray(value)) {
        return [];
      }
      const validTemplateIds =
        typeof Core.listTemplates === "function"
          ? new Set(Core.listTemplates().map((template) => template.id))
          : null;
      return value.filter(
        (id, index) =>
          typeof id === "string" &&
          id &&
          (!validTemplateIds || validTemplateIds.has(id)) &&
          value.indexOf(id) === index,
      );
    }

    function normalizeSettings(value) {
      const base = cloneDefaultState().settings;
      const saved = isPlainObject(value) ? value : {};
      const range = Core.sanitizeRange(saved.rangeMin, saved.rangeMax);
      const modes = validModes();
      const mode = modes.has(saved.mode) ? saved.mode : base.mode;
      const difficulty = VALID_DIFFICULTIES.has(String(saved.difficulty))
        ? String(saved.difficulty)
        : base.difficulty;

      return {
        mode,
        practiceMode:
          typeof saved.practiceMode === "string" && saved.practiceMode
            ? saved.practiceMode
            : base.practiceMode,
        difficulty,
        rangeMin: range.min,
        rangeMax: range.max,
        activeFamilyIds: normalizeFamilyIds(
          saved.activeFamilyIds,
          familyIdsForMode(mode),
        ),
        activeMathFamilyIds: normalizeMathFamilyIds(
          saved.activeMathFamilyIds,
          base.activeMathFamilyIds,
        ),
        activeMethodIds: normalizeMethodIds(
          saved.activeMethodIds,
          base.activeMethodIds,
        ),
        includePendingMethods: normalizeBoolean(saved.includePendingMethods),
        includeExperimentalMethods:
          saved.includeExperimentalMethods === undefined
            ? base.includeExperimentalMethods
            : normalizeBoolean(saved.includeExperimentalMethods),
        disabledTemplateIds: normalizeTemplateIds(saved.disabledTemplateIds),
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

    function normalizeText(value) {
      if (typeof value !== "string") {
        return "";
      }
      return value.slice(0, ERROR_EXAMPLE_TEXT_LIMIT);
    }

    function normalizeTimestamp(value) {
      const number = Number(value);
      return Number.isFinite(number) && number > 0 ? number : Date.now();
    }

    function normalizeErrorExample(value, fallbackTag) {
      if (!isPlainObject(value)) {
        return null;
      }
      const errorTags = validErrorTags();
      const familyIds = validFamilyIds();
      const mathFamilyIds = validMathFamilyIds();
      const methodIds = validMethodIds();
      const errorTag = errorTags.has(value.errorTag)
        ? value.errorTag
        : fallbackTag;
      const familyId = familyIds.has(value.familyId)
        ? value.familyId
        : "";
      const mathFamilyId = mathFamilyIds.has(value.mathFamilyId)
        ? value.mathFamilyId
        : "";
      const methodId = methodIds.has(value.methodId)
        ? value.methodId
        : "";
      if (!errorTags.has(errorTag)) {
        return null;
      }
      return {
        id:
          typeof value.id === "string" && value.id
            ? normalizeText(value.id)
            : `err-${normalizeTimestamp(value.timestamp)}`,
        timestamp: normalizeTimestamp(value.timestamp),
        errorTag,
        moduleId: normalizeText(value.moduleId),
        familyId,
        mathFamilyId,
        methodId,
        submethodId: normalizeText(value.submethodId),
        templateId: normalizeText(value.templateId),
        variantId: normalizeText(value.variantId),
        difficulty: VALID_DIFFICULTIES.has(String(value.difficulty))
          ? String(value.difficulty)
          : "",
        exercisePlain: normalizeText(value.exercisePlain),
        chosenPlain: normalizeText(value.chosenPlain),
        correctPlain: normalizeText(value.correctPlain),
        exerciseMath: isPlainObject(value.exerciseMath)
          ? value.exerciseMath
          : null,
        chosenMath: isPlainObject(value.chosenMath) ? value.chosenMath : null,
      };
    }

    function normalizeErrorExamplesByTag(value) {
      if (!isPlainObject(value)) {
        return {};
      }
      const errorTags = validErrorTags();
      return Object.entries(value).reduce((result, [tag, examples]) => {
        if (!errorTags.has(tag)) {
          return result;
        }
        const source = Array.isArray(examples) ? examples : [examples];
        const normalized = source
          .map((example) => normalizeErrorExample(example, tag))
          .filter(Boolean)
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, ERROR_EXAMPLES_PER_TAG_LIMIT);
        if (normalized.length) {
          result[tag] = normalized;
        }
        return result;
      }, {});
    }

    function normalizePracticeScope(value) {
      if (Core && typeof Core.normalizePracticeScope === "function") {
        return Core.normalizePracticeScope(value);
      }
      if (isPlainObject(value) && Array.isArray(value.typeIds)) {
        return {
          typeIds: value.typeIds.filter(
            (typeId, index) =>
              typeof typeId === "string" &&
              typeId &&
              value.typeIds.indexOf(typeId) === index,
          ),
        };
      }
      return { typeIds: [] };
    }

    function mergeState(saved) {
      const base = cloneDefaultState();
      const practiceScope = normalizePracticeScope(saved.practiceScope);
      if (
        Core &&
        typeof Core.hasValidScope === "function" &&
        typeof Core.setPracticeScope === "function" &&
        Core.hasValidScope(practiceScope)
      ) {
        Core.setPracticeScope(practiceScope.typeIds);
      }
      const totalCorrect = normalizeCounter(saved.totalCorrect);
      const totalIncorrect = normalizeCounter(saved.totalIncorrect);
      const savedTotalAnswered = normalizeCounter(saved.totalAnswered);
      return {
        ...base,
        practiceScope,
        totalAnswered: Math.max(
          savedTotalAnswered,
          totalCorrect + totalIncorrect,
        ),
        totalCorrect,
        totalIncorrect,
        errorCountsByTag: normalizeCountMap(
          saved.errorCountsByTag,
          keyFilter(validErrorTags()),
        ),
        familyCounts: normalizeCountMap(
          saved.familyCounts,
          keyFilter(validFamilyIds()),
        ),
        familyErrorCounts: normalizeCountMap(
          saved.familyErrorCounts,
          keyFilter(validFamilyIds()),
        ),
        mathFamilyCounts: normalizeCountMap(
          saved.mathFamilyCounts,
          keyFilter(validMathFamilyIds()),
        ),
        mathFamilyErrorCounts: normalizeCountMap(
          saved.mathFamilyErrorCounts,
          keyFilter(validMathFamilyIds()),
        ),
        methodCounts: normalizeCountMap(
          saved.methodCounts,
          keyFilter(validMethodIds()),
        ),
        methodErrorCounts: normalizeCountMap(
          saved.methodErrorCounts,
          keyFilter(validMethodIds()),
        ),
        submethodCounts: normalizeCountMap(saved.submethodCounts),
        submethodErrorCounts: normalizeCountMap(saved.submethodErrorCounts),
        difficultyCounts: normalizeCountMap(
          saved.difficultyCounts,
          VALID_DIFFICULTIES,
        ),
        difficultyErrorCounts: normalizeCountMap(
          saved.difficultyErrorCounts,
          VALID_DIFFICULTIES,
        ),
        templateCounts: normalizeCountMap(saved.templateCounts),
        templateErrorCounts: normalizeCountMap(saved.templateErrorCounts),
        variantCounts: normalizeCountMap(saved.variantCounts),
        variantErrorCounts: normalizeCountMap(saved.variantErrorCounts),
        errorExamplesByTag: normalizeErrorExamplesByTag(
          saved.errorExamplesByTag,
        ),
        recentErrorHistory: Array.isArray(saved.recentErrorHistory)
          ? saved.recentErrorHistory.slice(0, 20)
          : [],
        settings: normalizeSettings(saved.settings),
        recentExercises: normalizeRecentExercises(saved.recentExercises),
      };
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

    function saveState() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        return true;
      } catch (error) {
        return false;
      }
    }

    function updateSettings(values) {
      const range = Core.sanitizeRange(values.rangeMin, values.rangeMax);
      state.settings.mode = validModes().has(values.mode)
        ? values.mode
        : defaultModeId();
      state.settings.practiceMode =
        typeof values.practiceMode === "string" && values.practiceMode
          ? values.practiceMode
          : state.settings.practiceMode;
      state.settings.difficulty = VALID_DIFFICULTIES.has(
        String(values.difficulty),
      )
        ? String(values.difficulty)
        : "1";
      state.settings.rangeMin = range.min;
      state.settings.rangeMax = range.max;
      state.settings.activeFamilyIds = normalizeFamilyIds(
        values.activeFamilyIds,
      );
      state.settings.activeMathFamilyIds = normalizeMathFamilyIds(
        values.activeMathFamilyIds,
        state.settings.activeMathFamilyIds,
      );
      state.settings.activeMethodIds = normalizeMethodIds(
        values.activeMethodIds,
        state.settings.activeMethodIds,
      );
      state.settings.includePendingMethods = normalizeBoolean(
        values.includePendingMethods,
      );
      state.settings.includeExperimentalMethods =
        values.includeExperimentalMethods === undefined
          ? state.settings.includeExperimentalMethods
          : normalizeBoolean(values.includeExperimentalMethods);
      state.settings.disabledTemplateIds = Array.isArray(
        values.disabledTemplateIds,
      )
        ? normalizeTemplateIds(values.disabledTemplateIds)
        : state.settings.disabledTemplateIds;
      saveState();
      return state.settings;
    }

    function applyMode(mode) {
      const safeMode = validModes().has(mode) ? mode : defaultModeId();
      const ids = familyIdsForMode(safeMode);
      state.settings.mode = safeMode;
      state.settings.activeFamilyIds = ids.slice();
      saveState();
      return state.settings;
    }

    function setCustomFamilies(familyIds) {
      state.settings.activeFamilyIds = normalizeFamilyIds(
        familyIds,
        familyIdsForMode(defaultModeId()),
      );
      state.settings.mode = customModeId() || state.settings.mode || defaultModeId();
      saveState();
      return state.settings;
    }

    function setPracticeScope(typeIds) {
      const previous = state.practiceScope.typeIds.join("|");
      const normalized = normalizePracticeScope({ typeIds }).typeIds;
      if (Core && typeof Core.setPracticeScope === "function") {
        Core.setPracticeScope(normalized);
      }
      state.practiceScope = normalizePracticeScope({ typeIds: normalized });
      state.settings = normalizeSettings(state.settings);
      if (previous !== state.practiceScope.typeIds.join("|")) {
        state.recentExercises = [];
      }
      saveState();
      return state.practiceScope;
    }

    function hasValidPracticeScope(scope) {
      const source = scope || state.practiceScope;
      return Core && typeof Core.hasValidScope === "function"
        ? Core.hasValidScope(source)
        : normalizePracticeScope(source).typeIds.length > 0;
    }

    function pushRecent(signature) {
      state.recentExercises = [signature]
        .concat(state.recentExercises.filter((item) => item !== signature))
        .slice(0, RECENT_LIMIT);
    }

    function resetProgressKeepingSettings() {
      const settings = state.settings;
      const practiceScope = state.practiceScope;
      state = cloneDefaultState();
      state.settings = settings;
      state.practiceScope = practiceScope;
      saveState();
      return state;
    }

    return {
      constants: {
        ERROR_EXAMPLES_PER_TAG_LIMIT,
        RECENT_LIMIT,
      },
      isValidErrorTag: (tag) => validErrorTags().has(tag),
      isValidFamilyId: (familyId) => validFamilyIds().has(familyId),
      getState: () => state,
      getPracticeScope: () => normalizePracticeScope(state.practiceScope),
      hasValidPracticeScope,
      saveState,
      updateSettings,
      applyMode,
      setCustomFamilies,
      setPracticeScope,
      pushRecent,
      resetProgressKeepingSettings,
    };
  };
})(typeof window !== "undefined" ? window : globalThis);
