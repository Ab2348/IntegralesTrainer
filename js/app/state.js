(function (root) {
  "use strict";

  const App = (root.TrigTrainerApp = root.TrigTrainerApp || {});

  App.createStateStore = function createStateStore(Core) {
    const STORAGE_KEY = "trig-integral-trainer:v1";
    const RECENT_LIMIT = 20;
    const ERROR_EXAMPLES_PER_TAG_LIMIT = 1;
    const ERROR_EXAMPLE_TEXT_LIMIT = 360;
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
      errorExamplesByTag: {},
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
        errorExamplesByTag: normalizeErrorExamplesByTag(
          saved.errorExamplesByTag,
        ),
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
        : "basic";
      state.settings.difficulty = VALID_DIFFICULTIES.has(
        String(values.difficulty),
      )
        ? String(values.difficulty)
        : "1";
      state.settings.rangeMin = range.min;
      state.settings.rangeMax = range.max;
      state.settings.optionCount = VALID_OPTION_COUNTS.has(
        String(values.optionCount),
      )
        ? Number.parseInt(values.optionCount, 10)
        : 4;
      state.settings.activeFamilyIds = normalizeFamilyIds(
        values.activeFamilyIds,
      );
      saveState();
      return state.settings;
    }

    function applyMode(mode) {
      const safeMode = VALID_MODES.has(mode) ? mode : "basic";
      const ids = Core.MODE_FAMILIES[safeMode] || Core.MODE_FAMILIES.basic;
      state.settings.mode = safeMode;
      state.settings.activeFamilyIds = ids.slice();
      saveState();
      return state.settings;
    }

    function setCustomFamilies(familyIds) {
      state.settings.activeFamilyIds = normalizeFamilyIds(
        familyIds,
        Core.MODE_FAMILIES.basic,
      );
      state.settings.mode = "custom";
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
