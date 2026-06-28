const assert = require("node:assert/strict");

const Core = require("../core.js");

function stableOption(option) {
  return {
    id: option.id,
    key: Core.optionIdentity(option),
    value: option.value,
    isCorrect: option.isCorrect,
    errorTag: option.errorTag,
    errorType: option.errorType,
    sourceStrategy: option.sourceStrategy,
    generatedFallbackId: Boolean(
      option.metadata && option.metadata.generatedFallbackId,
    ),
    displayPlain: option.displayPlain,
    displayLatex: option.displayLatex,
    rendererId: option.rendererId,
  };
}

function stableExercise(exercise) {
  return {
    id: exercise.id,
    modelVersion: exercise.modelVersion,
    familyId: exercise.familyId,
    mathFamilyId: exercise.mathFamilyId,
    methodId: exercise.methodId,
    submethodId: exercise.submethodId,
    templateId: exercise.templateId,
    variantId: exercise.variantId,
    difficulty: exercise.difficulty,
    validationMode: exercise.validationMode,
    rendererId: exercise.rendererId,
    integralShown: exercise.integralShown,
    correctAnswer: stableOption(exercise.correctAnswer),
    options: exercise.options.map(stableOption),
    distractors: exercise.distractors.map(stableOption),
    answer: exercise.answer,
    generation: exercise.generation,
    statsInfo: exercise.statsInfo,
    signature: exercise.signature,
    metadata: {
      explicitValidationMode:
        exercise.metadata && exercise.metadata.explicitValidationMode,
      contractWarnings:
        exercise.metadata && exercise.metadata.contractWarnings,
    },
    params: {
      A: exercise.A,
      k: exercise.k,
      b: exercise.b,
      familyId: exercise.familyId,
    },
  };
}

function generated(settings) {
  return Core.generateExercise(
    settings,
    [],
    () => 0.137,
  );
}

function assertNoGeneratedFallbackIds(exercise) {
  exercise.options.forEach((option) => {
    assert.equal(
      option.metadata && option.metadata.generatedFallbackId,
      false,
      `Opcion normal genero fallback ID: ${option.displayPlain}`,
    );
  });
}

function testSameSeedSameExercise() {
  const settings = {
    mode: "mixed",
    difficulty: "5",
    rangeMin: -20,
    rangeMax: 20,
    activeFamilyIds: ["sin", "cos", "tan", "sec2", "arctan"],
    activeMathFamilyIds: ["trigonometrica-directa"],
    activeMethodIds: ["directa"],
    includeExperimentalMethods: true,
    disabledTemplateIds: [],
    seed: "reproducible-v1-5",
    maxAttempts: 80,
  };

  const first = stableExercise(generated(settings));
  const second = stableExercise(generated(settings));

  assert.deepEqual(second, first);
  assert.equal(first.validationMode, "multiple-choice");
  assert.equal(first.rendererId, "trig-linear-renderer");
  assert.ok(first.signature.includes(first.templateId));
  assert.ok(first.signature.includes(first.variantId));
  assert.equal(first.options.some((option) => option.generatedFallbackId), false);
}

function testDifferentSeedCanChangeOptionIdsWithoutChangingIdentities() {
  const baseSettings = {
    mode: "basic",
    difficulty: "4",
    rangeMin: -20,
    rangeMax: 20,
    activeFamilyIds: ["sin"],
    activeMathFamilyIds: ["trigonometrica-directa"],
    activeMethodIds: ["directa"],
    includeExperimentalMethods: true,
    maxAttempts: 80,
  };

  const first = generated({ ...baseSettings, seed: "option-seed-a" });
  const second = generated({ ...baseSettings, seed: "option-seed-b" });

  assert.equal(first.templateId, "trig-linear-sin");
  assert.equal(second.templateId, "trig-linear-sin");
  assertNoGeneratedFallbackIds(first);
  assertNoGeneratedFallbackIds(second);
  assert.notDeepEqual(
    first.options.map((option) => option.id),
    second.options.map((option) => option.id),
  );
}

function run() {
  testSameSeedSameExercise();
  testDifferentSeedCanChangeOptionIdsWithoutChangingIdentities();
  console.log("Reproducibility tests passed!");
}

run();
