const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const rootDir = path.resolve(__dirname, "..");

function createCore(overrides) {
  const core = {
    MODE_FAMILIES: {
      basic: ["sin"],
      custom: ["sin"],
    },
    ERROR_TYPES: [],
    ERROR_TAGS: [],
    FAMILIES: [{ id: "sin" }],
    MATH_FAMILIES: [{ id: "trigonometrica-directa" }],
    METHODS: [{ id: "directa" }],
    sanitizeRange(min, max) {
      return {
        min: Number.parseInt(min, 10),
        max: Number.parseInt(max, 10),
      };
    },
    optionCountForDifficulty(difficulty) {
      return ["4", "5"].includes(String(difficulty)) ? 6 : 4;
    },
    listTemplates() {
      return [];
    },
  };
  return { ...core, ...(overrides || {}) };
}

function createLocalStorage(initialValue) {
  const store = new Map();
  if (initialValue !== undefined) {
    store.set("trig-integral-trainer:v1", JSON.stringify(initialValue));
  }
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    lastSaved() {
      const raw = store.get("trig-integral-trainer:v1");
      return raw ? JSON.parse(raw) : null;
    },
  };
}

function createStateStore(savedState, Core) {
  const context = {
    console,
    localStorage: createLocalStorage(savedState),
    TrigTrainerApp: {},
  };
  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  const filename = path.join(rootDir, "js/app/state.js");
  vm.runInContext(fs.readFileSync(filename, "utf8"), context, { filename });
  return {
    context,
    store: context.TrigTrainerApp.createStateStore(Core || createCore()),
  };
}

function createScopedCore() {
  const scopes = {
    "integrales-lineales": {
      MODE_FAMILIES: {
        basic: ["sin"],
        custom: ["sin"],
      },
      defaultModeId: "basic",
      customModeId: "custom",
      FAMILIES: [{ id: "sin" }],
      MATH_FAMILIES: [{ id: "trigonometrica-directa" }],
      METHODS: [{ id: "directa" }],
      templates: [{ id: "trig-linear-sin" }],
    },
    "integrales-algebraicas-lineales": {
      MODE_FAMILIES: {
        algebraic: ["potencia-lineal-positiva"],
        custom: ["potencia-lineal-positiva"],
      },
      defaultModeId: "algebraic",
      customModeId: "custom",
      FAMILIES: [{ id: "potencia-lineal-positiva" }],
      MATH_FAMILIES: [{ id: "algebraica-inmediata" }],
      METHODS: [{ id: "sustitucion-lineal-directa" }],
      templates: [{ id: "algebraic-linear-power-positive" }],
    },
    "integrales-lineales|integrales-algebraicas-lineales": {
      MODE_FAMILIES: {
        mixed: ["sin", "potencia-lineal-positiva"],
        custom: ["sin", "potencia-lineal-positiva"],
      },
      defaultModeId: "mixed",
      customModeId: "custom",
      FAMILIES: [{ id: "sin" }, { id: "potencia-lineal-positiva" }],
      MATH_FAMILIES: [
        { id: "trigonometrica-directa" },
        { id: "algebraica-inmediata" },
      ],
      METHODS: [{ id: "directa" }, { id: "sustitucion-lineal-directa" }],
      templates: [
        { id: "trig-linear-sin" },
        { id: "algebraic-linear-power-positive" },
      ],
    },
  };
  const allowed = new Set([
    "integrales-lineales",
    "integrales-algebraicas-lineales",
  ]);
  const core = createCore();
  core.algebraicTypeId = Object.keys(scopes).find(
    (scopeId) => !scopeId.includes("|") && scopeId !== "integrales-lineales",
  );
  let currentTypeIds = [];

  function applyScope(typeIds) {
    const ids = Array.isArray(typeIds)
      ? typeIds.filter(
          (id, index) => allowed.has(id) && typeIds.indexOf(id) === index,
        )
      : [];
    const metadata = scopes[ids.join("|")] || {
      MODE_FAMILIES: {},
      defaultModeId: "",
      customModeId: "",
      FAMILIES: [],
      MATH_FAMILIES: [],
      METHODS: [],
      templates: [],
    };
    currentTypeIds = ids;
    Object.assign(core, metadata);
    return { typeIds: ids };
  }

  Object.assign(core, {
    normalizePracticeScope(scope) {
      return applyScope(scope && scope.typeIds);
    },
    hasValidScope(scope) {
      return this.normalizePracticeScope(scope).typeIds.length > 0;
    },
    setPracticeScope(typeIds) {
      return applyScope(typeIds);
    },
    getModeGroups() {
      return currentTypeIds.map((typeId) => {
        const moduleId = typeId;
        const metadata = scopes[typeId];
        return {
          id: typeId,
          moduleId,
          label:
            typeId === "integrales-lineales"
              ? "Trigonométricas directas"
              : "Algebraicas con argumento lineal",
          items: Object.entries(metadata.MODE_FAMILIES).map(
            ([modeId, familyIds]) => ({
              id: `${moduleId}:${modeId}`,
              moduleId,
              modeId,
              label: modeId,
              familyIds: familyIds.slice(),
              mathFamilyIds: metadata.MATH_FAMILIES.map((item) => item.id),
              methodIds: metadata.METHODS.map((item) => item.id),
            }),
          ),
        };
      });
    },
    normalizeActiveModeIds(modeIds) {
      const valid = new Set(
        Object.entries(scopes).flatMap(([scopeId, metadata]) =>
          scopeId.includes("|")
            ? []
            : Object.keys(metadata.MODE_FAMILIES).map(
                (modeId) => `${scopeId}:${modeId}`,
              ),
        ),
      );
      return Array.isArray(modeIds)
        ? modeIds.filter(
            (id, index) =>
              valid.has(id) && modeIds.indexOf(id) === index,
          )
        : [];
    },
    settingsFromModeIds(modeIds, settings) {
      const items = Object.entries(scopes)
        .flatMap(([scopeId, metadata]) =>
          scopeId.includes("|")
            ? []
            : Object.entries(metadata.MODE_FAMILIES).map(
                ([modeId, familyIds]) => ({
                  id: `${scopeId}:${modeId}`,
                  moduleId: scopeId,
                  modeId,
                  familyIds,
                  mathFamilyIds: metadata.MATH_FAMILIES.map((item) => item.id),
                  methodIds: metadata.METHODS.map((item) => item.id),
                }),
              ),
        )
        .filter((item) => modeIds.includes(item.id));
      return {
        ...(settings || {}),
        mode: items.length === 1 ? items[0].modeId : "mixed",
        activeModeIds: modeIds.slice(),
        activeFamilyIds: items.flatMap((item) => item.familyIds),
        activeMathFamilyIds: items.flatMap((item) => item.mathFamilyIds),
        activeMethodIds: items.flatMap((item) => item.methodIds),
      };
    },
    modeIdsForMode(mode) {
      const items = Object.entries(scopes).flatMap(([scopeId, metadata]) =>
        scopeId.includes("|")
          ? []
          : Object.keys(metadata.MODE_FAMILIES).map((modeId) => ({
              id: `${scopeId}:${modeId}`,
              modeId,
            })),
      );
      if (mode === "mixed") {
        return items
          .filter((candidate) => candidate.modeId === mode)
          .map((item) => item.id);
      }
      const item = items.find((candidate) => candidate.modeId === mode);
      return item ? [item.id] : [];
    },
    listTemplates() {
      return this.templates || [];
    },
  });
  applyScope([]);
  return core;
}

function testOldOptionCountIsIgnoredWhenLoadingState() {
  [
    { difficulty: "1", optionCount: 6 },
    { difficulty: "5", optionCount: 4 },
  ].forEach((settings) => {
    const { store } = createStateStore({
      settings: {
        mode: "basic",
        rangeMin: -20,
        rangeMax: 20,
        activeFamilyIds: ["sin"],
        ...settings,
      },
    });

    assert.equal(store.getState().settings.difficulty, settings.difficulty);
    assert.equal(
      Object.prototype.hasOwnProperty.call(
        store.getState().settings,
        "optionCount",
      ),
      false,
    );
  });
}

function testOptionCountIsNotPersistedFromUpdates() {
  const { context, store } = createStateStore();

  store.updateSettings({
    mode: "basic",
    difficulty: "5",
    rangeMin: -20,
    rangeMax: 20,
    optionCount: 4,
    activeFamilyIds: ["sin"],
  });

  assert.equal(store.getState().settings.difficulty, "5");
  assert.equal(
    Object.prototype.hasOwnProperty.call(store.getState().settings, "optionCount"),
    false,
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      context.localStorage.lastSaved().settings,
      "optionCount",
    ),
    false,
  );
}

function testModuleDefaultsComeFromCoreMetadata() {
  const { store } = createStateStore();
  const settings = store.getState().settings;

  assert.deepEqual(Array.from(settings.activeMathFamilyIds), [
    "trigonometrica-directa",
  ]);
  assert.deepEqual(Array.from(settings.activeMethodIds), ["directa"]);
}

function testStateDoesNotRequireBasicMode() {
  const Core = createCore({
    MODE_FAMILIES: {
      starter: ["sin"],
      tailored: ["sin"],
    },
    MODES: [
      { id: "starter", name: "Starter" },
      { id: "tailored", name: "Tailored" },
    ],
    defaultModeId: "starter",
    customModeId: "tailored",
  });
  const { store } = createStateStore(undefined, Core);

  assert.equal(store.getState().settings.mode, "starter");
  store.setCustomFamilies(["sin"]);
  assert.equal(store.getState().settings.mode, "tailored");
  store.applyMode("missing-mode");
  assert.equal(store.getState().settings.mode, "starter");
}

function testPracticeScopePersistsAndValidatesThroughRuntime() {
  const Core = createCore({
    normalizePracticeScope(scope) {
      const allowed = new Set(["integrales-lineales", "integrales-algebraicas-lineales"]);
      return {
        typeIds: Array.isArray(scope && scope.typeIds)
          ? scope.typeIds.filter((id, index) => allowed.has(id) && scope.typeIds.indexOf(id) === index)
          : [],
      };
    },
    hasValidScope(scope) {
      return this.normalizePracticeScope(scope).typeIds.length > 0;
    },
    setPracticeScope(scope) {
      this.lastScope = this.normalizePracticeScope({ typeIds: scope });
      return this.lastScope;
    },
  });
  const { context, store } = createStateStore(undefined, Core);

  assert.equal(store.hasValidPracticeScope(), false);
  store.setPracticeScope(["integrales-lineales", "missing"]);
  assert.equal(store.hasValidPracticeScope(), true);
  assert.deepEqual(store.getPracticeScope().typeIds, ["integrales-lineales"]);
  assert.deepEqual(context.localStorage.lastSaved().practiceScope.typeIds, [
    "integrales-lineales",
  ]);
}

function testScopeChangeRebuildsScopedSettingsFromTrigToMixed() {
  const Core = createScopedCore();
  const { store } = createStateStore(undefined, Core);

  store.setPracticeScope(["integrales-lineales"]);
  store.updateSettings({
    mode: "custom",
    difficulty: "4",
    rangeMin: -12,
    rangeMax: 14,
    activeFamilyIds: ["sin"],
    activeMathFamilyIds: ["trigonometrica-directa"],
    activeMethodIds: ["directa"],
    includeExperimentalMethods: false,
    disabledTemplateIds: ["trig-linear-sin"],
  });
  store.pushRecent("recent-trig");

  store.setPracticeScope([
    "integrales-lineales",
    Core.algebraicTypeId,
  ]);
  const settings = store.getState().settings;

  assert.equal(settings.mode, "mixed");
  assert.equal(settings.difficulty, "4");
  assert.equal(settings.includeExperimentalMethods, false);
  assert.deepEqual(Array.from(settings.activeFamilyIds), [
    "sin",
    "potencia-lineal-positiva",
  ]);
  assert.deepEqual(Array.from(settings.activeMathFamilyIds), [
    "trigonometrica-directa",
    "algebraica-inmediata",
  ]);
  assert.deepEqual(Array.from(settings.activeMethodIds), [
    "directa",
    "sustitucion-lineal-directa",
  ]);
  assert.deepEqual(Array.from(settings.disabledTemplateIds), []);
  assert.deepEqual(Array.from(store.getState().recentExercises), []);
}

function testScopeChangeRebuildsScopedSettingsFromAlgebraicToMixed() {
  const Core = createScopedCore();
  const { store } = createStateStore(undefined, Core);

  store.setPracticeScope(["integrales-algebraicas-lineales"]);
  store.updateSettings({
    mode: "custom",
    difficulty: "2",
    rangeMin: -8,
    rangeMax: 8,
    activeFamilyIds: ["potencia-lineal-positiva"],
    activeMathFamilyIds: ["algebraica-inmediata"],
    activeMethodIds: ["sustitucion-lineal-directa"],
    includeExperimentalMethods: true,
  });

  store.setPracticeScope([
    "integrales-lineales",
    Core.algebraicTypeId,
  ]);
  const settings = store.getState().settings;

  assert.equal(settings.mode, "mixed");
  assert.equal(settings.difficulty, "2");
  assert.deepEqual(Array.from(settings.activeFamilyIds), [
    "sin",
    "potencia-lineal-positiva",
  ]);
  assert.deepEqual(Array.from(settings.activeMathFamilyIds), [
    "trigonometrica-directa",
    "algebraica-inmediata",
  ]);
  assert.deepEqual(Array.from(settings.activeMethodIds), [
    "directa",
    "sustitucion-lineal-directa",
  ]);
}

function testSameScopeKeepsSettingsAndRecentExercises() {
  const Core = createScopedCore();
  const { store } = createStateStore(undefined, Core);

  store.setPracticeScope([
    "integrales-lineales",
    Core.algebraicTypeId,
  ]);
  store.updateSettings({
    mode: "custom",
    difficulty: "5",
    rangeMin: -6,
    rangeMax: 6,
    activeFamilyIds: ["sin"],
    activeMathFamilyIds: ["trigonometrica-directa"],
    activeMethodIds: ["directa"],
    includeExperimentalMethods: true,
    disabledTemplateIds: ["algebraic-linear-power-positive"],
  });
  store.pushRecent("same-scope-recent");

  store.setPracticeScope([
    "integrales-lineales",
    Core.algebraicTypeId,
  ]);
  const state = store.getState();

  assert.equal(state.settings.mode, "custom");
  assert.deepEqual(Array.from(state.settings.activeFamilyIds), ["sin"]);
  assert.deepEqual(Array.from(state.settings.activeMathFamilyIds), [
    "trigonometrica-directa",
  ]);
  assert.deepEqual(Array.from(state.settings.activeMethodIds), ["directa"]);
  assert.deepEqual(Array.from(state.settings.disabledTemplateIds), [
    "algebraic-linear-power-positive",
  ]);
  assert.deepEqual(Array.from(state.recentExercises), ["same-scope-recent"]);
}

function testOldMixedScopeIncompleteSettingsMigrateOnLoad() {
  const Core = createScopedCore();
  const { store } = createStateStore(
    {
      practiceScope: {
        typeIds: [
          "integrales-lineales",
          "integrales-algebraicas-lineales",
        ],
      },
      settings: {
        mode: "custom",
        difficulty: "3",
        rangeMin: -10,
        rangeMax: 10,
        activeFamilyIds: ["sin"],
        activeMathFamilyIds: ["trigonometrica-directa"],
        activeMethodIds: ["directa"],
        includeExperimentalMethods: false,
        disabledTemplateIds: ["algebraic-linear-power-positive"],
      },
      recentExercises: ["legacy-recent"],
    },
    Core,
  );
  const state = store.getState();

  assert.equal(state.settings.mode, "mixed");
  assert.equal(state.settings.difficulty, "3");
  assert.equal(state.settings.includeExperimentalMethods, false);
  assert.equal(state.settings.scopeSettingsVersion, 1);
  assert.deepEqual(Array.from(state.settings.activeFamilyIds), [
    "sin",
    "potencia-lineal-positiva",
  ]);
  assert.deepEqual(Array.from(state.settings.activeMathFamilyIds), [
    "trigonometrica-directa",
    "algebraica-inmediata",
  ]);
  assert.deepEqual(Array.from(state.settings.activeMethodIds), [
    "directa",
    "sustitucion-lineal-directa",
  ]);
  assert.deepEqual(Array.from(state.settings.disabledTemplateIds), []);
  assert.deepEqual(Array.from(state.recentExercises), ["legacy-recent"]);
}

function testVersionedMixedScopeCustomSettingsDoNotMigrateAgain() {
  const Core = createScopedCore();
  const { store } = createStateStore(
    {
      practiceScope: {
        typeIds: [
          "integrales-lineales",
          "integrales-algebraicas-lineales",
        ],
      },
      settings: {
        mode: "custom",
        difficulty: "5",
        rangeMin: -6,
        rangeMax: 6,
        activeFamilyIds: ["sin"],
        activeMathFamilyIds: ["trigonometrica-directa"],
        activeMethodIds: ["directa"],
        includeExperimentalMethods: true,
        disabledTemplateIds: ["algebraic-linear-power-positive"],
        scopeSettingsVersion: 1,
      },
    },
    Core,
  );
  const settings = store.getState().settings;

  assert.equal(settings.mode, "custom");
  assert.equal(settings.scopeSettingsVersion, 1);
  assert.deepEqual(Array.from(settings.activeFamilyIds), ["sin"]);
  assert.deepEqual(Array.from(settings.activeMathFamilyIds), [
    "trigonometrica-directa",
  ]);
  assert.deepEqual(Array.from(settings.activeMethodIds), ["directa"]);
  assert.deepEqual(Array.from(settings.disabledTemplateIds), [
    "algebraic-linear-power-positive",
  ]);
}

function testActiveModeIdsPersistAndDeriveFilters() {
  const Core = createScopedCore();
  const { context, store } = createStateStore(undefined, Core);

  store.setPracticeScope([
    "integrales-lineales",
    Core.algebraicTypeId,
  ]);
  const modeItems = Core.getModeGroups().flatMap((group) => group.items);
  const trigBasic = modeItems.find(
    (item) => item.moduleId === "integrales-lineales" && item.modeId === "basic",
  ).id;
  const algebraicMode = modeItems.find(
    (item) =>
      item.moduleId !== "integrales-lineales" && item.modeId === "algebraic",
  ).id;
  const settings = store.updateSettings({
    ...store.getState().settings,
    activeModeIds: [trigBasic, algebraicMode],
  });

  assert.equal(settings.mode, "mixed");
  assert.deepEqual(Array.from(settings.activeModeIds), [
    trigBasic,
    algebraicMode,
  ]);
  assert.deepEqual(Array.from(settings.activeFamilyIds), [
    "sin",
    "potencia-lineal-positiva",
  ]);
  assert.deepEqual(Array.from(settings.activeMathFamilyIds), [
    "trigonometrica-directa",
    "algebraica-inmediata",
  ]);
  assert.deepEqual(Array.from(settings.activeMethodIds), [
    "directa",
    "sustitucion-lineal-directa",
  ]);
  assert.deepEqual(
    context.localStorage.lastSaved().settings.activeModeIds,
    [trigBasic, algebraicMode],
  );
}

function testScopeChangeFiltersActiveModeIds() {
  const Core = createScopedCore();
  const { store } = createStateStore(undefined, Core);

  store.setPracticeScope([
    "integrales-lineales",
    "integrales-algebraicas-lineales",
  ]);
  const algebraicMode = Core.getModeGroups()
    .flatMap((group) => group.items)
    .find(
      (item) =>
        item.moduleId !== "integrales-lineales" &&
        item.modeId === "algebraic",
    ).id;
  store.updateSettings({
    ...store.getState().settings,
    activeModeIds: ["integrales-lineales:basic", algebraicMode],
  });
  store.setPracticeScope(["integrales-lineales"]);

  assert.deepEqual(Array.from(store.getState().settings.activeModeIds), [
    "integrales-lineales:basic",
  ]);
}

function testManualFamiliesClearActiveModeIdsAndBecomeCustom() {
  const Core = createScopedCore();
  const { store } = createStateStore(undefined, Core);

  store.setPracticeScope([
    "integrales-lineales",
    "integrales-algebraicas-lineales",
  ]);
  const settings = store.updateSettings({
    ...store.getState().settings,
    mode: "custom",
    activeModeIds: [],
    activeFamilyIds: ["sin"],
    activeMathFamilyIds: ["trigonometrica-directa"],
    activeMethodIds: ["directa"],
  });

  assert.equal(settings.mode, "custom");
  assert.deepEqual(Array.from(settings.activeModeIds), []);
  assert.deepEqual(Array.from(settings.activeFamilyIds), ["sin"]);
}

function run() {
  testOldOptionCountIsIgnoredWhenLoadingState();
  testOptionCountIsNotPersistedFromUpdates();
  testModuleDefaultsComeFromCoreMetadata();
  testStateDoesNotRequireBasicMode();
  testPracticeScopePersistsAndValidatesThroughRuntime();
  testScopeChangeRebuildsScopedSettingsFromTrigToMixed();
  testScopeChangeRebuildsScopedSettingsFromAlgebraicToMixed();
  testSameScopeKeepsSettingsAndRecentExercises();
  testOldMixedScopeIncompleteSettingsMigrateOnLoad();
  testVersionedMixedScopeCustomSettingsDoNotMigrateAgain();
  testActiveModeIdsPersistAndDeriveFilters();
  testScopeChangeFiltersActiveModeIds();
  testManualFamiliesClearActiveModeIdsAndBecomeCustom();
  console.log("State tests passed!");
}

run();
