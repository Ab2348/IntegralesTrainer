const assert = require("node:assert/strict");

const Core = require("../core.js");

function fixedRng() {
  return 0.42;
}

function testRationalUtilsArePublic() {
  assert.equal(Core.rational, globalThis.TrigRationalUtils.rational);
  assert.deepEqual(Core.rational(6, -8), { n: -3, d: 4 });
  assert.equal(Core.rationalPlain(Core.rational(3, 2)), "3/2");
  assert.equal(Core.rationalLatex(Core.rational(-3, 2)), "-\\frac{3}{2}");
}

function testOptionCountPolicy() {
  assert.equal(Core.optionCountForDifficulty("1"), 4);
  assert.equal(Core.optionCountForDifficulty("3"), 4);
  assert.equal(Core.optionCountForDifficulty("4"), 6);
  assert.equal(Core.optionCountForDifficulty("5"), 6);
}

function testGenerationSmoke() {
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
      disabledTemplateIds: ["missing-template-id"],
      seed: "core-test-smoke",
    },
    [],
    fixedRng,
  );

  assert.equal(exercise.templateId, "trig-linear-sin");
  assert.equal(exercise.options.length, 6);
  assert.equal(exercise.options.filter((option) => option.isCorrect).length, 1);
  assert.ok(exercise.correctAnswer.id);
  assert.ok(exercise.signature);
}

function testContractWarningsDoNotBlockValidation() {
  const exercise = Core.buildExerciseFromParams(
    { A: 1, k: 1, b: 0, familyId: "sin", difficulty: "1" },
    4,
    fixedRng,
    {
      templateId: "trig-linear-sin",
      variantId: "directa-unitaria",
      seed: "contract-warning-test",
      attempt: 0,
    },
  );
  const validation = Core.validateGeneratedExercise(exercise, {
    template: {
      id: "synthetic-warning-template",
      difficultyMin: 1,
      difficultyMax: 5,
      contractWarnings: ["synthetic-warning"],
      hasBlockingContractErrors: false,
      feedbackRules: exercise.feedbackRules,
      validateInstance: () => true,
    },
    settings: { difficulty: "1" },
  });

  assert.equal(validation.valid, true);
  assert.deepEqual(validation.errors, []);
  assert.ok(
    validation.warnings.includes("template-contract-incomplete:synthetic-warning"),
  );
}

function testOptionIdsIncludeGenerationContext() {
  const params = { A: 1, k: 1, b: 0, familyId: "sin", difficulty: "1" };
  const first = Core.buildExerciseFromParams(params, 4, fixedRng, {
    templateId: "trig-linear-sin",
    variantId: "directa-unitaria",
    seed: "option-id-a",
    attempt: 0,
  });
  const second = Core.buildExerciseFromParams(params, 4, fixedRng, {
    templateId: "trig-linear-sin",
    variantId: "directa-unitaria",
    seed: "option-id-b",
    attempt: 0,
  });

  assert.notEqual(first.correctAnswer.id, second.correctAnswer.id);
  assert.equal(first.correctAnswer.key, second.correctAnswer.key);
}

function run() {
  testRationalUtilsArePublic();
  testOptionCountPolicy();
  testGenerationSmoke();
  testContractWarningsDoNotBlockValidation();
  testOptionIdsIncludeGenerationContext();
}

run();
