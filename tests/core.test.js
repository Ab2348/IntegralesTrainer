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

function testPublicApiCompatibility() {
  [
    "generateExercise",
    "validateAnswer",
    "renderIntegral",
    "renderOption",
    "feedbackContent",
    "derivationContent",
    "formulaCatalog",
    "listTemplates",
    "findTemplates",
    "testTemplates",
    "optionCountForDifficulty",
    "optionIdentity",
    "sanitizeRange",
    "buildExerciseFromParams",
    "createSeededRng",
  ].forEach((name) => {
    assert.equal(typeof Core[name], "function", `Falta API publica Core.${name}()`);
  });

  assert.equal(Core.moduleId, "integrales-lineales");
  assert.equal(Core.modelVersion, "1.4");
  assert.ok(Array.isArray(Core.FAMILIES));
  assert.ok(Core.FAMILIES.length > 0);
  assert.ok(Core.FAMILY_MAP.sin);
  assert.ok(Array.isArray(Core.MATH_FAMILIES));
  assert.ok(Array.isArray(Core.METHODS));
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
  assert.equal(exercise.validationMode, "multiple-choice");
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

function testAllModesAndDifficulties() {
  const modes = ["basic", "intermediate", "products", "logarithmic", "inverse", "mixed"];
  const difficulties = ["1", "2", "3", "4", "5"];

  for (const mode of modes) {
    for (const difficulty of difficulties) {
      const expectedOptionCount = difficulty === "1" || difficulty === "2" || difficulty === "3" ? 4 : 6;

      const seed = `test-${mode}-diff-${difficulty}`;
      const exercise = Core.generateExercise(
        {
          mode,
          difficulty,
          rangeMin: -20,
          rangeMax: 20,
          includeExperimentalMethods: true,
          seed,
        },
        [],
        fixedRng,
      );

      // Verificar que el ejercicio existe
      assert.ok(exercise, `Ejercicio no generado para mode=${mode}, difficulty=${difficulty}`);

      // Verificar integralShown
      assert.ok(exercise.integralShown, `Falta integralShown para mode=${mode}, difficulty=${difficulty}`);

      // Verificar correctAnswer
      assert.ok(exercise.correctAnswer, `Falta correctAnswer para mode=${mode}, difficulty=${difficulty}`);
      assert.ok(exercise.correctAnswer.id, `Falta correctAnswer.id para mode=${mode}, difficulty=${difficulty}`);

      // Verificar options
      assert.ok(exercise.options, `Falta options para mode=${mode}, difficulty=${difficulty}`);
      assert.ok(Array.isArray(exercise.options), `options no es array para mode=${mode}, difficulty=${difficulty}`);

      // Verificar exactamente una opción correcta
      const correctOptions = exercise.options.filter((opt) => opt.isCorrect);
      assert.equal(
        correctOptions.length,
        1,
        `Debe haber exactamente una opción correcta para mode=${mode}, difficulty=${difficulty} (encontradas: ${correctOptions.length})`
      );

      // Verificar número de opciones según dificultad
      assert.equal(
        exercise.options.length,
        expectedOptionCount,
        `Número de opciones incorrecto para mode=${mode}, difficulty=${difficulty}: esperado ${expectedOptionCount}, obtenido ${exercise.options.length}`
      );

      // Verificar no hay opciones duplicadas por Core.optionIdentity
      const identities = new Set();
      for (const option of exercise.options) {
        const identity = Core.optionIdentity(option);
        assert.ok(identity, `optionIdentity devuelve falsy para mode=${mode}, difficulty=${difficulty}`);
        assert.ok(
          !identities.has(identity),
          `Opción duplicada detectada por optionIdentity para mode=${mode}, difficulty=${difficulty}: ${identity}`
        );
        identities.add(identity);
      }

      // Verificar que todos los distractores tienen errorTag, errorType y sourceStrategy
      for (const option of exercise.options) {
        if (!option.isCorrect) {
          assert.ok(option.errorTag, `Falta errorTag en distractor para mode=${mode}, difficulty=${difficulty}`);
          assert.ok(option.errorType, `Falta errorType en distractor para mode=${mode}, difficulty=${difficulty}`);
          assert.ok(option.sourceStrategy, `Falta sourceStrategy en distractor para mode=${mode}, difficulty=${difficulty}`);
        }
      }

      // Verificar templateId
      assert.ok(exercise.templateId, `Falta templateId para mode=${mode}, difficulty=${difficulty}`);

      // Verificar variantId
      assert.ok(exercise.variantId, `Falta variantId para mode=${mode}, difficulty=${difficulty}`);

      // Verificar signature
      assert.ok(exercise.signature, `Falta signature para mode=${mode}, difficulty=${difficulty}`);
    }
  }
}

function testTemplatesComprehensive() {
  const result = Core.testTemplates({ iterations: 5 });
  assert.equal(result.passed, true, "Core.testTemplates falló: " + JSON.stringify(result, null, 2));
}

function run() {
  testRationalUtilsArePublic();
  testOptionCountPolicy();
  testPublicApiCompatibility();
  testGenerationSmoke();
  testContractWarningsDoNotBlockValidation();
  testOptionIdsIncludeGenerationContext();
  testAllModesAndDifficulties();
  testTemplatesComprehensive();
  console.log("All tests passed!");
}

run();
