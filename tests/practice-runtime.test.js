const assert = require("node:assert/strict");

require("../js/core/modules/index.js");
require("../core.js");
require("../js/app/practice-runtime.js");
require("../js/app/state.js");

const App = globalThis.TrigTrainerApp;

function fixedRng() {
  return 0.42;
}

function createRuntime() {
  return App.createPracticeRuntime({
    registry: globalThis.TrigCoreRegistry,
    generator: globalThis.TrigExerciseGenerator,
  });
}

function createLocalStorage() {
  const store = new Map();
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
  };
}

function createRuntimeStatePair() {
  const runtime = createRuntime();
  globalThis.localStorage = createLocalStorage();
  return {
    runtime,
    stateStore: App.createStateStore(runtime),
  };
}

function createContextRuntime() {
  const modules = [
    {
      moduleId: "module-a",
      moduleName: "Module A",
      practiceType: { id: "module-a", title: "Module A", order: 1 },
      FAMILIES: [{ id: "family-a" }],
      MATH_FAMILIES: [{ id: "math-a", enabled: true }],
      METHODS: [{ id: "method-a", enabled: true }],
      MODE_FAMILIES: { basic: ["family-a"] },
      MODES: [{ id: "basic", name: "Basic A" }],
      defaultModeId: "basic",
      customModeId: "custom",
      renderOption() {
        return { plain: "render-a" };
      },
      optionSnapshot() {
        return { plain: "snapshot-a" };
      },
    },
    {
      moduleId: "module-b",
      moduleName: "Module B",
      practiceType: { id: "module-b", title: "Module B", order: 2 },
      FAMILIES: [{ id: "family-b" }],
      MATH_FAMILIES: [{ id: "math-b", enabled: true }],
      METHODS: [{ id: "method-b", enabled: true }],
      MODE_FAMILIES: { basic: ["family-b"] },
      MODES: [{ id: "basic", name: "Basic B" }],
      defaultModeId: "basic",
      customModeId: "custom",
      renderOption() {
        return { plain: "render-b" };
      },
      optionSnapshot() {
        return { plain: "snapshot-b" };
      },
    },
  ];
  return App.createPracticeRuntime({
    registry: { list: () => modules },
    generator: {
      ENGINE_VERSION: "test",
      listTemplates() {
        return [
          { id: "template-a", moduleId: "module-a", familyId: "family-a" },
          { id: "template-b", moduleId: "module-b", familyId: "family-b" },
        ];
      },
      findTemplates() {
        return [];
      },
    },
  });
}

function settingsForGeneration(settings) {
  return {
    ...settings,
    rangeMin: settings.rangeMin === undefined ? -20 : settings.rangeMin,
    rangeMax: settings.rangeMax === undefined ? 20 : settings.rangeMax,
    includeExperimentalMethods: settings.includeExperimentalMethods !== false,
  };
}

function generatedModules(runtime, settings, seedPrefix) {
  const modules = new Set();
  for (let index = 0; index < 50; index += 1) {
    const exercise = runtime.generateExercise({
      settings: settingsForGeneration(settings),
      recentSignatures: [],
      rng: () => (index % 10) / 10,
      seed: `${seedPrefix}-${index}`,
    });
    modules.add(exercise.moduleId);
  }
  return modules;
}

function testListsPracticeTypesWithoutActiveScope() {
  const runtime = createRuntime();
  const types = runtime.getPracticeTypes();

  assert.equal(runtime.hasValidScope(), false);
  assert.ok(types.find((type) => type.title === "Trigonométricas directas"));
  assert.ok(
    types.find((type) => type.title === "Algebraicas con argumento lineal"),
  );
}

function testSingleTrigScopeGeneratesTrigExercise() {
  const runtime = createRuntime();
  const sameRuntime = runtime;
  runtime.setPracticeScope(["integrales-lineales"]);

  assert.equal(runtime, sameRuntime);
  assert.equal(runtime.hasValidScope(), true);
  assert.ok(runtime.FAMILY_MAP.sin);
  assert.equal(runtime.FAMILY_MAP["potencia-lineal-positiva"], undefined);

  const exercise = runtime.generateExercise({
    settings: {
      difficulty: "1",
      rangeMin: -20,
      rangeMax: 20,
      activeFamilyIds: ["sin"],
      activeMathFamilyIds: ["trigonometrica-directa"],
      activeMethodIds: ["directa"],
      includeExperimentalMethods: true,
    },
    recentSignatures: [],
    rng: fixedRng,
    seed: "runtime-trig",
  });

  assert.equal(exercise.moduleId, "integrales-lineales");
  assert.equal(exercise.templateId, "trig-linear-sin");
}

function testSingleAlgebraicScopeGeneratesAlgebraicExercise() {
  const runtime = createRuntime();
  runtime.setPracticeScope(["integrales-algebraicas-lineales"]);

  assert.ok(runtime.FAMILY_MAP["potencia-lineal-positiva"]);
  assert.equal(runtime.FAMILY_MAP.sin, undefined);

  const exercise = runtime.generateExercise({
    settings: {
      difficulty: "1",
      rangeMin: -20,
      rangeMax: 20,
      activeFamilyIds: ["potencia-lineal-positiva"],
      activeMathFamilyIds: ["algebraica-inmediata"],
      activeMethodIds: ["sustitucion-lineal-directa"],
      includeExperimentalMethods: true,
    },
    recentSignatures: [],
    rng: fixedRng,
    seed: "runtime-algebraic",
  });

  assert.equal(exercise.moduleId, "integrales-algebraicas-lineales");
  assert.equal(exercise.templateId, "algebraic-linear-power-positive");
}

function testMixedScopeCombinesFamiliesAndFiltersFormulas() {
  const runtime = createRuntime();
  runtime.setPracticeScope([
    "integrales-lineales",
    "integrales-algebraicas-lineales",
  ]);

  assert.equal(runtime.defaultModeId, "mixed");
  assert.ok(runtime.FAMILY_MAP.sin);
  assert.ok(runtime.FAMILY_MAP["potencia-lineal-positiva"]);
  assert.ok(runtime.familyGroups.length >= 2);
  assert.equal(runtime.familyCollisions.length, 0);

  const formulaIds = runtime.formulaCatalog().map((formula) => formula.id);
  assert.ok(formulaIds.includes("sin"));
  assert.ok(formulaIds.includes("potencia-lineal-positiva"));

  const algebraic = runtime.generateExercise({
    settings: {
      difficulty: "1",
      rangeMin: -20,
      rangeMax: 20,
      activeFamilyIds: ["potencia-lineal-positiva"],
      activeMathFamilyIds: ["algebraica-inmediata"],
      activeMethodIds: ["sustitucion-lineal-directa"],
      includeExperimentalMethods: true,
    },
    recentSignatures: [],
    rng: fixedRng,
    seed: "runtime-mixed-algebraic",
  });

  const trig = runtime.generateExercise({
    settings: {
      difficulty: "1",
      rangeMin: -20,
      rangeMax: 20,
      activeFamilyIds: ["sin"],
      activeMathFamilyIds: ["trigonometrica-directa"],
      activeMethodIds: ["directa"],
      includeExperimentalMethods: true,
    },
    recentSignatures: [],
    rng: fixedRng,
    seed: "runtime-mixed-trig",
  });

  assert.equal(algebraic.moduleId, "integrales-algebraicas-lineales");
  assert.equal(trig.moduleId, "integrales-lineales");
  assert.ok(runtime.renderOption(algebraic.options[0]));
  assert.ok(runtime.feedbackContent(trig, trig.options[0]));
}

function testModeGroupsReflectActiveScope() {
  const runtime = createRuntime();

  runtime.setPracticeScope(["integrales-lineales"]);
  let groups = runtime.getModeGroups();
  assert.equal(groups.length, 1);
  assert.equal(groups[0].moduleId, "integrales-lineales");
  assert.ok(groups[0].items.some((item) => item.id === "integrales-lineales:basic"));

  runtime.setPracticeScope([
    "integrales-lineales",
    "integrales-algebraicas-lineales",
  ]);
  groups = runtime.getModeGroups();
  assert.deepEqual(
    groups.map((group) => group.moduleId),
    ["integrales-lineales", "integrales-algebraicas-lineales"],
  );
  assert.ok(
    groups
      .flatMap((group) => group.items)
      .some((item) => item.id === "integrales-algebraicas-lineales:basic"),
  );
}

function testModeIdsDeriveFamiliesMathFamiliesAndMethods() {
  const runtime = createRuntime();
  runtime.setPracticeScope([
    "integrales-lineales",
    "integrales-algebraicas-lineales",
  ]);

  const settings = runtime.settingsFromModeIds(
    [
      "integrales-lineales:basic",
      "integrales-algebraicas-lineales:logarithmic",
    ],
    { difficulty: "1" },
  );

  assert.deepEqual(settings.activeFamilyIds, [
    "sin",
    "cos",
    "reciproca-lineal",
  ]);
  assert.deepEqual(settings.activeMathFamilyIds, [
    "trigonometrica-directa",
    "algebraica-inmediata",
  ]);
  assert.deepEqual(settings.activeMethodIds, [
    "directa",
    "sustitucion-lineal-directa",
  ]);
}

function testRenderOptionAndSnapshotUseExerciseOwner() {
  const runtime = createContextRuntime();
  runtime.setPracticeScope(["module-a", "module-b"]);

  assert.equal(
    runtime.renderOption({ id: "option-1" }, { templateId: "template-b" }).plain,
    "render-b",
  );
  assert.equal(
    runtime.optionSnapshot({ id: "option-1" }, { familyId: "family-b" }).plain,
    "snapshot-b",
  );
}

function testFormulaCatalogCarriesNotes() {
  const runtime = createRuntime();
  runtime.setPracticeScope([
    "integrales-lineales",
    "integrales-algebraicas-lineales",
  ]);
  const formulas = runtime.formulaCatalog();

  assert.ok(formulas.length);
  assert.ok(formulas.every((formula) => Array.isArray(formula.noteContent)));
}

function testStateTransitionFromTrigToMixedCanGenerateBothModules() {
  const { runtime, stateStore } = createRuntimeStatePair();

  stateStore.setPracticeScope(["integrales-lineales"]);
  stateStore.setPracticeScope([
    "integrales-lineales",
    "integrales-algebraicas-lineales",
  ]);

  const modules = generatedModules(
    runtime,
    stateStore.getState().settings,
    "p0-trig-to-mixed",
  );

  assert.ok(modules.has("integrales-lineales"));
  assert.ok(modules.has("integrales-algebraicas-lineales"));
}

function testStateTransitionFromAlgebraicToMixedCanGenerateBothModules() {
  const { runtime, stateStore } = createRuntimeStatePair();

  stateStore.setPracticeScope(["integrales-algebraicas-lineales"]);
  stateStore.setPracticeScope([
    "integrales-lineales",
    "integrales-algebraicas-lineales",
  ]);

  const modules = generatedModules(
    runtime,
    stateStore.getState().settings,
    "p0-algebraic-to-mixed",
  );

  assert.ok(modules.has("integrales-lineales"));
  assert.ok(modules.has("integrales-algebraicas-lineales"));
}

function testMixedScopeWithOnlyTrigFamiliesGeneratesTrig() {
  const { runtime, stateStore } = createRuntimeStatePair();

  stateStore.setPracticeScope(["integrales-algebraicas-lineales"]);
  stateStore.setPracticeScope([
    "integrales-lineales",
    "integrales-algebraicas-lineales",
  ]);
  const settings = stateStore.updateSettings({
    ...stateStore.getState().settings,
    mode: "custom",
    activeModeIds: [],
    activeFamilyIds: ["sin"],
  });
  const exercise = runtime.generateExercise({
    settings: settingsForGeneration(settings),
    recentSignatures: [],
    rng: fixedRng,
    seed: "p0-only-trig-family",
  });

  assert.equal(exercise.moduleId, "integrales-lineales");
}

function testMixedScopeWithOnlyAlgebraicFamiliesGeneratesAlgebraic() {
  const { runtime, stateStore } = createRuntimeStatePair();

  stateStore.setPracticeScope(["integrales-lineales"]);
  stateStore.setPracticeScope([
    "integrales-lineales",
    "integrales-algebraicas-lineales",
  ]);
  const settings = stateStore.updateSettings({
    ...stateStore.getState().settings,
    mode: "custom",
    activeModeIds: [],
    activeFamilyIds: ["potencia-lineal-positiva"],
  });
  const exercise = runtime.generateExercise({
    settings: settingsForGeneration(settings),
    recentSignatures: [],
    rng: fixedRng,
    seed: "p0-only-algebraic-family",
  });

  assert.equal(exercise.moduleId, "integrales-algebraicas-lineales");
}

function run() {
  testListsPracticeTypesWithoutActiveScope();
  testSingleTrigScopeGeneratesTrigExercise();
  testSingleAlgebraicScopeGeneratesAlgebraicExercise();
  testMixedScopeCombinesFamiliesAndFiltersFormulas();
  testModeGroupsReflectActiveScope();
  testModeIdsDeriveFamiliesMathFamiliesAndMethods();
  testRenderOptionAndSnapshotUseExerciseOwner();
  testFormulaCatalogCarriesNotes();
  testStateTransitionFromTrigToMixedCanGenerateBothModules();
  testStateTransitionFromAlgebraicToMixedCanGenerateBothModules();
  testMixedScopeWithOnlyTrigFamiliesGeneratesTrig();
  testMixedScopeWithOnlyAlgebraicFamiliesGeneratesAlgebraic();
  console.log("Practice runtime tests passed!");
}

run();
