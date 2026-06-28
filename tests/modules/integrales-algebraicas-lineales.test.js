const assert = require("node:assert/strict");

const Core = require("../../js/core/modules/integrales-algebraicas-lineales/index.js");
const Generation = globalThis.TrigAlgebraicLinearGeneration;
const ParameterPolicy = globalThis.TrigParameterPolicy;

function fixedRng() {
  return 0.42;
}

function testModuleContractSurface() {
  assert.equal(Core.moduleId, "integrales-algebraicas-lineales");
  assert.equal(Core.moduleName, "Integrales algebraicas con argumento lineal");
  assert.equal(Core.modelVersion, "1.5");
  assert.ok(Array.isArray(Core.FAMILIES));
  assert.deepEqual(Core.FAMILIES.map((family) => family.id), [
    "potencia-lineal-positiva",
    "potencia-lineal-negativa",
    "reciproca-lineal",
  ]);
  assert.equal(Core.defaultModeId, "basic");
  assert.equal(Core.customModeId, "custom");
  assert.deepEqual(Core.MATH_FAMILIES.map((family) => family.id), [
    "algebraica-inmediata",
  ]);
  assert.deepEqual(Core.METHODS.map((method) => method.id), [
    "sustitucion-lineal-directa",
  ]);
  assert.ok(Core.ERROR_TYPE_MAP["wrong-power-exponent"]);
  assert.deepEqual(Core.RANGE_LIMITS, { min: -12, max: 12 });
  assert.deepEqual(Core.K_RANGE_LIMITS, { min: -8, max: 8 });
  assert.deepEqual(Core.COEFFICIENT_TYPES, ["integer"]);
  assert.equal(typeof Core.buildExerciseFromParams, "function");
  assert.equal(typeof Core.buildDistractorCandidates, "function");
  assert.equal(typeof Core.feedbackContent, "function");
  assert.equal(typeof Core.derivationContent, "function");
  assert.equal(typeof Core.formulaCatalog, "function");
}

function testTemplatesDeclareModuleOwner() {
  const templates = Core.findTemplates({
    moduleId: "integrales-algebraicas-lineales",
    difficulty: "5",
  });
  const unrelated = Core.findTemplates({
    moduleId: "synthetic-module",
    difficulty: "5",
  });

  assert.equal(templates.length, 3);
  assert.equal(unrelated.length, 0);
  assert.deepEqual(templates.map((template) => template.id).sort(), [
    "algebraic-linear-power-negative",
    "algebraic-linear-power-positive",
    "algebraic-linear-reciprocal",
  ]);
  templates.forEach((template) => {
    assert.equal(template.moduleId, "integrales-algebraicas-lineales");
    assert.equal(template.validationMode, "multiple-choice");
    assert.equal(template.rendererId, "algebraic-linear-renderer");
    assert.equal(template.mathFamilyId, "algebraica-inmediata");
    assert.equal(template.methodId, "sustitucion-lineal-directa");
  });
}

function testKnownAntiderivatives() {
  const positive = Core.buildExerciseFromParams(
    { A: 3, k: 2, b: -5, n: 4, familyId: "potencia-lineal-positiva" },
    6,
    fixedRng,
    { templateId: "algebraic-linear-power-positive", variantId: "test" },
  );
  assert.equal(positive.correctAnswer.displayPlain, "(3/10)(2x - 5)^5 + C");

  const negative = Core.buildExerciseFromParams(
    { A: 6, k: 3, b: 1, n: -2, familyId: "potencia-lineal-negativa" },
    6,
    fixedRng,
    { templateId: "algebraic-linear-power-negative", variantId: "test" },
  );
  assert.equal(negative.correctAnswer.displayPlain, "-2(3x + 1)^(-1) + C");

  const reciprocal = Core.buildExerciseFromParams(
    { A: 8, k: 4, b: -3, n: -1, familyId: "reciproca-lineal" },
    6,
    fixedRng,
    { templateId: "algebraic-linear-reciprocal", variantId: "test" },
  );
  assert.equal(reciprocal.correctAnswer.displayPlain, "2ln |4x - 3| + C");
}

function testDifficultyParameterProfilesRemainIntegerBased() {
  const range = { min: -12, max: 12 };
  const familyIds = ["potencia-lineal-positiva"];
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
  assert.ok([1, 2, 3].includes(level1.n));

  const level5 = Generation.paramsForDifficulty("5", [
    "potencia-lineal-negativa",
  ], range, fixedRng);
  assert.notEqual(level5.A, 0);
  assert.notEqual(level5.k, 0);
  assert.ok(level5.n <= -2);
}

function testFamiliesGenerateUniqueOptionsAndFeedbackRules() {
  [
    { familyId: "potencia-lineal-positiva", n: 3 },
    { familyId: "potencia-lineal-negativa", n: -3 },
    { familyId: "reciproca-lineal", n: -1 },
  ].forEach((config) => {
    const exercise = Core.buildExerciseFromParams(
      { A: -6, k: -3, b: 4, familyId: config.familyId, n: config.n },
      6,
      fixedRng,
      {
        templateId: `algebraic-linear-${config.familyId}`,
        variantId: "module-test",
        seed: `module-${config.familyId}`,
        attempt: 0,
      },
    );
    const optionIdentities = new Set(exercise.options.map(Core.optionIdentity));
    const feedbackTypes = new Set(
      exercise.feedbackRules.map((rule) => rule.errorType),
    );

    assert.equal(exercise.options.length, 6, `${config.familyId} no genero 6 opciones`);
    assert.equal(optionIdentities.size, exercise.options.length, `${config.familyId} duplico opciones`);
    assert.equal(
      exercise.options.filter((option) => option.isCorrect).length,
      1,
      `${config.familyId} no tiene correcta unica`,
    );
    exercise.distractors.forEach((distractor) => {
      assert.ok(distractor.id, `${config.familyId} distractor sin id`);
      assert.notEqual(
        distractor.metadata && distractor.metadata.generatedFallbackId,
        true,
        `${config.familyId} genero fallback ID en flujo normal`,
      );
      assert.ok(distractor.errorTag, `${config.familyId} distractor sin errorTag`);
      assert.ok(distractor.errorType, `${config.familyId} distractor sin errorType`);
      assert.ok(distractor.sourceStrategy, `${config.familyId} distractor sin sourceStrategy`);
      assert.ok(
        feedbackTypes.has(distractor.errorType),
        `${config.familyId} distractor sin feedback: ${distractor.errorType}`,
      );
    });
  });
}

function testGeneratedExercisesDeclareModuleMetadata() {
  const exercise = Core.generateExercise({
    settings: {
      mode: "logarithmic",
      difficulty: "5",
      rangeMin: -12,
      rangeMax: 12,
      activeFamilyIds: ["reciproca-lineal"],
      activeMathFamilyIds: ["algebraica-inmediata"],
      activeMethodIds: ["sustitucion-lineal-directa"],
      includeExperimentalMethods: true,
      seed: "algebraic-linear-module-metadata",
    },
    recentSignatures: [],
    rng: fixedRng,
  });

  assert.equal(exercise.methodId, "sustitucion-lineal-directa");
  assert.equal(exercise.mathFamilyId, "algebraica-inmediata");
  assert.equal(exercise.submethodId, "reciproca-lineal");
  assert.equal(exercise.familyId, "reciproca-lineal");
  assert.equal(exercise.n, -1);
}

function testSnapshotsAndFormulaCatalog() {
  const exercise = Core.buildExerciseFromParams(
    { A: 5, k: -2, b: 7, familyId: "potencia-lineal-positiva", n: 2 },
    6,
    fixedRng,
    {
      templateId: "algebraic-linear-power-positive",
      variantId: "snapshots",
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
  assert.ok(formulas.some((formula) => formula.linearPlain.includes("n != -1")));
  assert.ok(formulas.some((formula) => formula.linearPlain.includes("ln |kx + b|")));
}

function testLegacyGenerateSignatureIsRejected() {
  assert.throws(
    () =>
      Core.generateExercise(
        {
          mode: "basic",
          difficulty: "1",
          rangeMin: -12,
          rangeMax: 12,
          activeFamilyIds: ["potencia-lineal-positiva"],
        },
        [],
        fixedRng,
      ),
    /config con settings/,
  );
}

function run() {
  testModuleContractSurface();
  testTemplatesDeclareModuleOwner();
  testKnownAntiderivatives();
  testDifficultyParameterProfilesRemainIntegerBased();
  testFamiliesGenerateUniqueOptionsAndFeedbackRules();
  testGeneratedExercisesDeclareModuleMetadata();
  testSnapshotsAndFormulaCatalog();
  testLegacyGenerateSignatureIsRejected();
  assert.ok(ParameterPolicy);
  console.log("Integrales-algebraicas-lineales module tests passed!");
}

run();
