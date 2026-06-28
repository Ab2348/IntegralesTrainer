const assert = require("node:assert/strict");

const Core = require("../core.js");

function buildExercise() {
  return Core.generateExercise(
    {
      mode: "basic",
      difficulty: "4",
      rangeMin: -20,
      rangeMax: 20,
      activeFamilyIds: ["cos"],
      activeMathFamilyIds: ["trigonometrica-directa"],
      activeMethodIds: ["directa"],
      includeExperimentalMethods: true,
      seed: "validation-v1-5",
    },
    [],
    () => 0.25,
  );
}

function assertValidationShape(result) {
  [
    "isValid",
    "isCorrect",
    "selectedOption",
    "selectedDistractor",
    "distractor",
    "correctOption",
    "errorTag",
    "errorType",
    "familyId",
    "mathFamilyId",
    "methodId",
    "submethodId",
    "templateId",
    "variantId",
    "difficulty",
    "stats",
  ].forEach((field) => {
    assert.ok(Object.prototype.hasOwnProperty.call(result, field), `Falta ${field}`);
  });
}

function testCorrectAnswerValidation() {
  const exercise = buildExercise();
  const result = Core.validateAnswer(exercise, exercise.correctAnswer.id);

  assertValidationShape(result);
  assert.equal(result.isValid, true);
  assert.equal(result.isCorrect, true);
  assert.equal(result.selectedOption.id, exercise.correctAnswer.id);
  assert.equal(result.selectedDistractor, null);
  assert.equal(result.distractor, null);
  assert.equal(result.correctOption.id, exercise.correctAnswer.id);
  assert.equal(result.errorTag, "correct");
  assert.equal(result.errorType, "correct");
  assert.equal(result.familyId, exercise.familyId);
  assert.equal(result.mathFamilyId, exercise.mathFamilyId);
  assert.equal(result.methodId, exercise.methodId);
  assert.equal(result.submethodId, exercise.submethodId);
  assert.equal(result.templateId, exercise.templateId);
  assert.equal(result.variantId, exercise.variantId);
  assert.equal(result.difficulty, exercise.difficulty);
  assert.equal(result.stats.errorTag, "correct");
  assert.equal(result.stats.errorType, "correct");
}

function testIncorrectAnswerValidation() {
  const exercise = buildExercise();
  const wrong = exercise.options.find((option) => !option.isCorrect);
  const result = Core.validateAnswer(exercise, wrong.id);

  assertValidationShape(result);
  assert.equal(result.isValid, true);
  assert.equal(result.isCorrect, false);
  assert.equal(result.selectedOption.id, wrong.id);
  assert.equal(result.selectedDistractor.id, wrong.id);
  assert.equal(result.distractor.id, wrong.id);
  assert.equal(result.correctOption.id, exercise.correctAnswer.id);
  assert.equal(result.errorTag, wrong.errorTag);
  assert.equal(result.errorType, wrong.errorType);
  assert.equal(result.stats.templateId, exercise.templateId);
  assert.equal(result.stats.variantId, exercise.variantId);
}

function testInvalidOptionValidation() {
  const exercise = buildExercise();
  const result = Core.validateAnswer(exercise, "missing-option");

  assertValidationShape(result);
  assert.equal(result.isValid, false);
  assert.equal(result.isCorrect, false);
  assert.equal(result.selectedOption, null);
  assert.equal(result.selectedDistractor, null);
  assert.equal(result.distractor, null);
  assert.equal(result.errorTag, "invalid-option");
  assert.equal(result.errorType, "invalid-option");
  assert.equal(result.correctOption.id, exercise.correctAnswer.id);
  assert.equal(result.familyId, exercise.familyId);
  assert.equal(result.templateId, exercise.templateId);
  assert.equal(result.variantId, exercise.variantId);
}

function testMissingValidationModeDefaultsToMultipleChoice() {
  const exercise = buildExercise();
  const withoutMode = { ...exercise };
  delete withoutMode.validationMode;
  const result = Core.validateAnswer(withoutMode, exercise.correctAnswer.id);

  assertValidationShape(result);
  assert.equal(result.isValid, true);
  assert.equal(result.isCorrect, true);
  assert.equal(result.errorTag, "correct");
  assert.equal(result.errorType, "correct");
}

function testUnsupportedValidationModesReturnNormalizedInvalidResult() {
  const exercise = buildExercise();
  ["symbolic", "numeric", "hybrid"].forEach((validationMode) => {
    const result = Core.validateAnswer(
      { ...exercise, validationMode },
      exercise.correctAnswer.displayPlain,
    );

    assertValidationShape(result);
    assert.equal(result.isValid, false);
    assert.equal(result.isCorrect, false);
    assert.equal(result.selectedOption, null);
    assert.equal(result.selectedDistractor, null);
    assert.equal(result.distractor, null);
    assert.equal(result.correctOption.id, exercise.correctAnswer.id);
    assert.equal(result.errorTag, "unsupported-validation-mode");
    assert.equal(result.errorType, "unsupported-validation-mode");
    assert.equal(result.familyId, exercise.familyId);
    assert.equal(result.mathFamilyId, exercise.mathFamilyId);
    assert.equal(result.methodId, exercise.methodId);
    assert.equal(result.submethodId, exercise.submethodId);
    assert.equal(result.templateId, exercise.templateId);
    assert.equal(result.variantId, exercise.variantId);
    assert.equal(result.difficulty, exercise.difficulty);
    assert.equal(result.stats.errorTag, "unsupported-validation-mode");
    assert.equal(result.stats.errorType, "unsupported-validation-mode");
  });
}

function testCentralFacadeIsPublicApi() {
  assert.equal(Core.validateAnswer, globalThis.TrigValidation.validateAnswer);
}

function run() {
  testCorrectAnswerValidation();
  testIncorrectAnswerValidation();
  testInvalidOptionValidation();
  testMissingValidationModeDefaultsToMultipleChoice();
  testUnsupportedValidationModesReturnNormalizedInvalidResult();
  testCentralFacadeIsPublicApi();
  console.log("Validation tests passed!");
}

run();
