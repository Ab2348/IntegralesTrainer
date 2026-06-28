(function (root) {
  "use strict";

  const App = (root.TrigTrainerApp = root.TrigTrainerApp || {});

  App.createStateStore = function createStateStore(Core) {
    const STORAGE_KEY = "trig-integral-trainer:v1";
    const RECENT_LIMIT = 20;
    const ERROR_EXAMPLES_PER_TAG_LIMIT = 1;
    const ERROR_EXAMPLE_TEXT_LIMIT = 360;
    const MODE_FAMILIES = Core.MODE_FAMILIES || {};
    const MODE_IDS = Object.keys(MODE_FAMILIES);
    const DEFAULT_MODE_ID =
      typeof Core.defaultModeId === "string" &&
      MODE_IDS.includes(Core.defaultModeId)
        ? Core.defaultModeId
        : MODE_IDS[0] || "";
    const CUSTOM_MODE_ID =
      typeof Core.customModeId === "string" &&
      MODE_IDS.includes(Core.customModeId)
        ? Core.customModeId
        : DEFAULT_MODE_ID;
    const VALID_MODES = new Set(MODE_IDS);
    const VALID_DIFFICULTIES = new Set(["1", "2", "3", "4", "5"]);
    const VALID_ERROR_TAGS = new Set(
      (Core.ERROR_TYPES || []).map((error) => error.id).concat(Core.ERROR_TAGS),
    );
    const VALID_FAMILY_IDS = new Set(Core.FAMILIES.map((family) => family.id));
    const VALID_MATH_FAMILY_IDS = new Set(
      (Core.MATH_FAMILIES || []).map((family) => family.id),
    );
    const VALID_METHOD_IDS = new Set(
      (Core.METHODS || []).map((method) => method.id),
    );
    const DEFAULT_FAMILY_IDS = familyIdsForMode(DEFAULT_MODE_ID);
    const DEFAULT_MATH_FAMILY_IDS = (Core.MATH_FAMILIES || [])
      .filter((family) => family && family.enabled !== false)
      .map((family) => family.id)
      .filter(Boolean);
    const DEFAULT_METHOD_IDS = (Core.METHODS || [])
      .filter((method) => method && method.enabled !== false)
      .map((method) => method.id)
      .filter(Boolean);

    const defaultState = {
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
        mode: DEFAULT_MODE_ID,
        practiceMode: "practice",
        difficulty: "1",
        rangeMin: -20,
        rangeMax: 20,
        activeFamilyIds: DEFAULT_FAMILY_IDS.slice(),
        activeMathFamilyIds: DEFAULT_MATH_FAMILY_IDS.slice(),
        activeMethodIds: DEFAULT_METHOD_IDS.slice(),
        includePendingMethods: false,
        includeExperimentalMethods: true,
        disabledTemplateIds: [],
      },
      recentExercises: [],
    };

    let state = loadState();

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
        if (!validKeys || validKeys.has(key)) {
          const normalized = normalizeCounter(count);
          if (normalized > 0) {
            result[key] = normalized;
          }
        }
        return result;
      }, {});
    }

    function normalizeBoolean(value) {
      return value === true || value === "true";
    }

    function familyIdsForMode(mode) {
      const modeFamilies = Array.isArray(MODE_FAMILIES[mode])
        ? MODE_FAMILIES[mode]
        : [];
      const ids = modeFamilies.filter(
        (id, index) =>
          VALID_FAMILY_IDS.has(id) && modeFamilies.indexOf(id) === index,
      );
      if (ids.length) {
        return ids;
      }
      return (Core.FAMILIES || []).map((family) => family.id).filter(Boolean);
    }

    function normalizeFamilyIds(value, fallbackIds) {
      const fallback = Array.isArray(fallbackIds)
        ? fallbackIds
        : DEFAULT_FAMILY_IDS;
      if (!Array.isArray(value)) {
        return fallback.slice();
      }
      const ids = value.filter(
        (id, index) =>
          VALID_FAMILY_IDS.has(id) && value.indexOf(id) === index,
      );
      return ids.length ? ids : fallback.slice();
    }

    function normalizeMethodIds(value, fallbackIds) {
      const fallback = Array.isArray(fallbackIds) && fallbackIds.length
        ? fallbackIds
        : DEFAULT_METHOD_IDS;
      if (!Array.isArray(value)) {
        return fallback.slice();
      }
      const ids = value.filter(
        (id, index) =>
          VALID_METHOD_IDS.has(id) && value.indexOf(id) === index,
      );
      return ids.length ? ids : fallback.slice();
    }

    function normalizeMathFamilyIds(value, fallbackIds) {
      const fallback = Array.isArray(fallbackIds) && fallbackIds.length
        ? fallbackIds
        : DEFAULT_MATH_FAMILY_IDS;
      if (!Array.isArray(value)) {
        return fallback.slice();
      }
      const ids = value.filter(
        (id, index) =>
          VALID_MATH_FAMILY_IDS.has(id) && value.indexOf(id) === index,
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
      const mode = VALID_MODES.has(saved.mode) ? saved.mode : base.mode;
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
      const errorTag = VALID_ERROR_TAGS.has(value.errorTag)
        ? value.errorTag
        : fallbackTag;
      const familyId = VALID_FAMILY_IDS.has(value.familyId)
        ? value.familyId
        : "";
      const mathFamilyId = VALID_MATH_FAMILY_IDS.has(value.mathFamilyId)
        ? value.mathFamilyId
        : "";
      const methodId = VALID_METHOD_IDS.has(value.methodId)
        ? value.methodId
        : "";
      if (!VALID_ERROR_TAGS.has(errorTag)) {
        return null;
      }
      return {
        id:
          typeof value.id === "string" && value.id
            ? normalizeText(value.id)
            : `err-${normalizeTimestamp(value.timestamp)}`,
        timestamp: normalizeTimestamp(value.timestamp),
        errorTag,
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
      return Object.entries(value).reduce((result, [tag, examples]) => {
        if (!VALID_ERROR_TAGS.has(tag)) {
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

    function mergeState(saved) {
      const base = cloneDefaultState();
      const totalCorrect = normalizeCounter(saved.totalCorrect);
      const totalIncorrect = normalizeCounter(saved.totalIncorrect);
      const savedTotalAnswered = normalizeCounter(saved.totalAnswered);
      return {
        ...base,
        totalAnswered: Math.max(
          savedTotalAnswered,
          totalCorrect + totalIncorrect,
        ),
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
        mathFamilyCounts: normalizeCountMap(
          saved.mathFamilyCounts,
          VALID_MATH_FAMILY_IDS,
        ),
        mathFamilyErrorCounts: normalizeCountMap(
          saved.mathFamilyErrorCounts,
          VALID_MATH_FAMILY_IDS,
        ),
        methodCounts: normalizeCountMap(saved.methodCounts, VALID_METHOD_IDS),
        methodErrorCounts: normalizeCountMap(
          saved.methodErrorCounts,
          VALID_METHOD_IDS,
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
      state.settings.mode = VALID_MODES.has(values.mode)
        ? values.mode
        : DEFAULT_MODE_ID;
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
      const safeMode = VALID_MODES.has(mode) ? mode : DEFAULT_MODE_ID;
      const ids = familyIdsForMode(safeMode);
      state.settings.mode = safeMode;
      state.settings.activeFamilyIds = ids.slice();
      saveState();
      return state.settings;
    }

    function setCustomFamilies(familyIds) {
      state.settings.activeFamilyIds = normalizeFamilyIds(
        familyIds,
        DEFAULT_FAMILY_IDS,
      );
      state.settings.mode = CUSTOM_MODE_ID || state.settings.mode || DEFAULT_MODE_ID;
      saveState();
      return state.settings;
    }

    function pushRecent(signature) {
      state.recentExercises = [signature]
        .concat(state.recentExercises.filter((item) => item !== signature))
        .slice(0, RECENT_LIMIT);
    }

    function resetProgressKeepingSettings() {
      const settings = state.settings;
      state = cloneDefaultState();
      state.settings = settings;
      saveState();
      return state;
    }

    return {
      constants: {
        ERROR_EXAMPLES_PER_TAG_LIMIT,
        RECENT_LIMIT,
      },
      isValidErrorTag: (tag) => VALID_ERROR_TAGS.has(tag),
      isValidFamilyId: (familyId) => VALID_FAMILY_IDS.has(familyId),
      getState: () => state,
      saveState,
      updateSettings,
      applyMode,
      setCustomFamilies,
      pushRecent,
      resetProgressKeepingSettings,
    };
  };
})(typeof window !== "undefined" ? window : globalThis);
