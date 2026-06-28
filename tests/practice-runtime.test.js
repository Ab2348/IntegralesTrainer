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
  testStateTransitionFromTrigToMixedCanGenerateBothModules();
  testStateTransitionFromAlgebraicToMixedCanGenerateBothModules();
  testMixedScopeWithOnlyTrigFamiliesGeneratesTrig();
  testMixedScopeWithOnlyAlgebraicFamiliesGeneratesAlgebraic();
  console.log("Practice runtime tests passed!");
}

run();
