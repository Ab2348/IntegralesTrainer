const assert = require("node:assert/strict");

const Core = require("../../js/core/modules/integrales-lineales/index.js");
const Generation = globalThis.TrigLinearGeneration;
const ParameterPolicy = globalThis.TrigParameterPolicy;

function fixedRng() {
  return 0.42;
}

function testModuleContractSurface() {
  assert.equal(Core.moduleId, "integrales-lineales");
  assert.equal(Core.moduleName, "Integrales con argumento lineal");
  assert.equal(globalThis.TrigLinearData, undefined);
  assert.ok(Array.isArray(Core.FAMILIES));
  assert.equal(Core.FAMILIES.length, 13);
  assert.ok(Core.FAMILY_MAP.sin);
  assert.ok(Core.FAMILY_MAP.arccos);
  assert.deepEqual(Core.RANGE_LIMITS, { min: -20, max: 20 });
  assert.ok(Core.COEFFICIENT_TYPES.includes("integer"));
  assert.equal(typeof Core.buildExerciseFromParams, "function");
  assert.equal(typeof Core.buildDistractorCandidates, "function");
  assert.equal(typeof Core.feedbackContent, "function");
  assert.equal(typeof Core.derivationContent, "function");
  assert.equal(typeof Core.formulaCatalog, "function");
}

function testDifficultyParameterProfilesRemainIntegerBased() {
  const range = { min: -20, max: 20 };
  const familyIds = ["sin"];
  const rulesByLevel = ["1", "2", "3", "4", "5"].map((level) =>
    Generation.parameterRulesForLevel(level),
  );

  rulesByLevel.forEach((rules, index) => {
    assert.equal(rules.A.type, undefined);
    assert.ok(rules.A.kind, `Nivel ${index + 1} no normalizo A`);
    assert.ok(rules.k.kind, `Nivel ${index + 1} no normalizo k`);
    assert.ok(rules.b.kind, `Nivel ${index + 1} no normalizo b`);
  });

  const level1 = Generation.paramsForDifficulty("1", familyIds, range, fixedRng);
  assert.ok([-1, 1].includes(level1.A));
  assert.equal(level1.k, 1);
  assert.equal(level1.b, 0);

  const level2 = Generation.paramsForDifficulty("2", familyIds, range, fixedRng);
  assert.ok([-1, 1].includes(level2.A));
  assert.notEqual(level2.k, 0);
  assert.equal(level2.b, 0);

  const level3 = Generation.paramsForDifficulty("3", familyIds, range, fixedRng);
  assert.notEqual(level3.A, 0);
  assert.notEqual(level3.k, 0);
  assert.equal(level3.b, 0);

  const level4 = Generation.paramsForDifficulty("4", familyIds, range, fixedRng);
  assert.notEqual(level4.A, 0);
  assert.notEqual(level4.k, 0);
  assert.ok(Number.isInteger(level4.b));

  const level5 = Generation.paramsForDifficulty("5", familyIds, range, fixedRng);
  const coefficient5 = Core.correctCoefficient(
    Core.rational(level5.A, 1),
    Core.FAMILY_MAP[level5.familyId],
    Core.rational(level5.k, 1),
  );
  assert.notEqual(level5.A, 0);
  assert.notEqual(level5.k, 0);
  assert.notEqual(level5.b, 0);
  assert.equal(
    ParameterPolicy.satisfiesParameterRule(
      rulesByLevel[4].result,
      { result: coefficient5 },
    ),
    true,
  );
}

function testFamiliesGenerateUniqueOptionsAndFeedbackRules() {
  Core.FAMILIES.forEach((family) => {
    const exercise = Core.buildExerciseFromParams(
      { A: -6, k: -3, b: 4, familyId: family.id, difficulty: "4" },
      6,
      fixedRng,
      {
        templateId: `trig-linear-${family.id}`,
        variantId: "desplazada",
        seed: `module-${family.id}`,
        attempt: 0,
      },
    );
    const optionIdentities = new Set(exercise.options.map(Core.optionIdentity));
    const feedbackTypes = new Set(
      exercise.feedbackRules.map((rule) => rule.errorType),
    );

    assert.equal(exercise.options.length, 6, `${family.id} no genero 6 opciones`);
    assert.equal(optionIdentities.size, exercise.options.length, `${family.id} duplico opciones`);
    assert.equal(
      exercise.options.filter((option) => option.isCorrect).length,
      1,
      `${family.id} no tiene correcta unica`,
    );

    exercise.distractors.forEach((distractor) => {
      assert.ok(distractor.id, `${family.id} distractor sin id`);
      assert.notEqual(
        distractor.metadata && distractor.metadata.generatedFallbackId,
        true,
        `${family.id} genero fallback ID en flujo normal`,
      );
      assert.ok(distractor.errorTag, `${family.id} distractor sin errorTag`);
      assert.ok(distractor.errorType, `${family.id} distractor sin errorType`);
      assert.ok(distractor.sourceStrategy, `${family.id} distractor sin sourceStrategy`);
      assert.ok(
        feedbackTypes.has(distractor.errorType),
        `${family.id} distractor sin feedback: ${distractor.errorType}`,
      );
    });
    exercise.options.forEach((option) => {
      assert.notEqual(
        option.metadata && option.metadata.generatedFallbackId,
        true,
        `${family.id} opcion con fallback ID en flujo normal`,
      );
    });
  });
}

function testSnapshotsAndFormulaCatalog() {
  const exercise = Core.buildExerciseFromParams(
    { A: 3, k: -2, b: 5, familyId: "cos", difficulty: "4" },
    6,
    fixedRng,
    {
      templateId: "trig-linear-cos",
      variantId: "desplazada",
      seed: "snapshots",
      attempt: 0,
    },
  );
  const wrong = exercise.options.find((option) => !option.isCorrect);
  const mathExample = Core.errorExampleMath({
    exerciseMath: Core.exerciseSnapshot(exercise),
    chosenMath: Core.optionSnapshot(wrong),
  });
  const formulas = Core.formulaCatalog();

  assert.ok(mathExample.exercise.plain.includes("int"));
  assert.ok(mathExample.chosen.plain.includes("+ C"));
  assert.ok(mathExample.correct.plain.includes("+ C"));
  assert.equal(formulas.length, Core.FAMILIES.length);
  assert.ok(formulas.every((formula) => formula.linearPlain.includes("kx + b")));
}

function testGeneratedExercisesDeclareModuleMetadata() {
  const exercise = Core.generateExercise(
    {
      mode: "basic",
      difficulty: "4",
      rangeMin: -20,
      rangeMax: 20,
      activeFamilyIds: ["sin"],
      activeMathFamilyIds: ["trigonometrica-directa"],
      activeMethodIds: ["directa"],
      includeExperimentalMethods: true,
      seed: "linear-module-metadata",
    },
    [],
    fixedRng,
  );

  assert.equal(exercise.methodId, "directa");
  assert.equal(exercise.mathFamilyId, "trigonometrica-directa");
  assert.equal(exercise.submethodId, "argumento-lineal");
}

function run() {
  testModuleContractSurface();
  testDifficultyParameterProfilesRemainIntegerBased();
  testFamiliesGenerateUniqueOptionsAndFeedbackRules();
  testSnapshotsAndFormulaCatalog();
  testGeneratedExercisesDeclareModuleMetadata();
  console.log("Integrales-lineales module tests passed!");
}

run();
