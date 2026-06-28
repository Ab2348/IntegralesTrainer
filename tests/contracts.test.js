const assert = require("node:assert/strict");

const Core = require("../core.js");

function testExerciseCarriesValidationMode() {
  const exercise = Core.generateExercise(
    {
      mode: "basic",
      difficulty: "2",
      rangeMin: -20,
      rangeMax: 20,
      activeFamilyIds: ["sin"],
      activeMathFamilyIds: ["trigonometrica-directa"],
      activeMethodIds: ["directa"],
      includeExperimentalMethods: true,
      seed: "contract-validation-mode",
    },
    [],
    () => 0.42,
  );

  assert.equal(exercise.validationMode, "multiple-choice");
}

function testTemplateContractNormalization() {
  const Contracts = globalThis.TrigContractModels;
  const template = Contracts.normalizeTemplate({
    id: "synthetic-template",
    familyId: "synthetic-family",
    mathFamilyId: "synthetic-math",
    methodId: "synthetic-method",
    submethodId: "synthetic-submethod",
    difficultyMin: 1,
    difficultyMax: 5,
    parameters: ["x"],
    restrictions: ["x != 0"],
    commonErrors: ["synthetic-error"],
    distractorStrategies: ["synthetic-error"],
    feedbackRules: [{ errorType: "synthetic-error", title: "Error" }],
    buildCorrectAnswer() {},
    buildDistractors() {},
    generate() {},
  });

  assert.equal(template.validationMode, "multiple-choice");
  assert.ok(Array.isArray(Contracts.VALIDATION_MODES));
  assert.ok(Contracts.VALIDATION_MODES.includes("symbolic"));
  assert.ok(Contracts.VALIDATION_MODES.includes("numeric"));
  assert.ok(Contracts.VALIDATION_MODES.includes("hybrid"));
}

function testInvalidValidationModeSurvivesNormalizationDiagnostics() {
  const Contracts = globalThis.TrigContractModels;
  const template = Contracts.normalizeTemplate({
    id: "synthetic-invalid-validation-mode",
    familyId: "synthetic-family",
    mathFamilyId: "synthetic-math",
    methodId: "synthetic-method",
    submethodId: "synthetic-submethod",
    validationMode: "symbollic",
    rendererId: "synthetic-renderer",
    difficultyMin: 1,
    difficultyMax: 5,
    variants: [{ id: "base" }],
    parameters: ["x"],
    restrictions: ["x != 0"],
    commonErrors: ["synthetic-error"],
    distractorStrategies: ["synthetic-error"],
    feedbackRules: [{ errorType: "synthetic-error", title: "Error" }],
    buildCorrectAnswer() {},
    buildDistractors() {},
    generate() {},
  });
  const contract = Contracts.validateTemplateContract(template);

  assert.equal(template.validationMode, "multiple-choice");
  assert.ok(contract.warnings.includes("invalid-validationMode"));
  assert.ok(
    contract.diagnostics.some(
      (diagnostic) =>
        diagnostic.code === "invalid-validationMode" && diagnostic.blocking,
    ),
  );
}

function testLinearTemplatesDeclareV15Fields() {
  const templates = Core.listTemplates();
  assert.ok(templates.length > 0);

  templates.forEach((template) => {
    assert.equal(template.validationMode, "multiple-choice");
    assert.equal(template.rendererId, "trig-linear-renderer");
    assert.ok(template.familyId);
    assert.ok(template.mathFamilyId);
    assert.ok(template.methodId);
    assert.ok(template.submethodId);
    assert.ok(Number.isFinite(Number(template.difficultyMin)));
    assert.ok(Number.isFinite(Number(template.difficultyMax)));
    assert.ok(Array.isArray(template.variants) && template.variants.length > 0);
    assert.ok(Array.isArray(template.parameters) && template.parameters.length > 0);
    assert.ok(Array.isArray(template.restrictions) && template.restrictions.length > 0);
    assert.ok(
      Array.isArray(template.distractorStrategies) &&
        template.distractorStrategies.length > 0,
    );
    assert.ok(Array.isArray(template.feedbackRules) && template.feedbackRules.length > 0);
    assert.equal(typeof template.generate, "function");
    assert.equal(template.hasBlockingContractErrors, false);
    assert.ok(
      !template.contractWarnings.includes("missing-validationMode"),
      `${template.id} no declaro validationMode`,
    );
    assert.ok(
      !template.contractWarnings.includes("missing-rendererId"),
      `${template.id} no declaro rendererId`,
    );
  });
}

function testModuleRegistryDiagnostics() {
  const Registry = globalThis.TrigCoreRegistry;

  assert.throws(
    () => Registry.register({ moduleName: "Modulo sin id" }),
    /moduleId/,
  );

  const diagnostics = Registry.validateModuleContract({
    moduleId: "synthetic-module",
  }).diagnostics;

  assert.ok(diagnostics.some((diagnostic) => diagnostic.code === "missing-moduleName"));
  diagnostics.forEach((diagnostic) => {
    assert.ok(diagnostic.message);
    assert.notEqual(diagnostic.message, diagnostic.code);
    assert.ok(Object.prototype.hasOwnProperty.call(diagnostic, "recommendation"));
    assert.ok(["error", "warning", "info", "pending"].includes(diagnostic.severity));
  });
}

function testTemplateDiagnosticsAreReadable() {
  const Contracts = globalThis.TrigContractModels;
  const diagnostics = Contracts.validateTemplateContract({
    id: "diagnostic-template",
    status: "active",
    generate() {},
  }).diagnostics;

  assert.ok(diagnostics.some((diagnostic) => diagnostic.blocking));
  diagnostics.forEach((diagnostic) => {
    assert.ok(diagnostic.message);
    assert.notEqual(diagnostic.message, diagnostic.code);
    assert.ok(Object.prototype.hasOwnProperty.call(diagnostic, "recommendation"));
    assert.ok(diagnostic.field);
  });
}

function testTemplateDiagnosticsAreExposedByTemplateTest() {
  const result = Core.testTemplates({ iterations: 1 });
  assert.equal(result.passed, true);
  result.results.forEach((templateResult) => {
    assert.ok(Array.isArray(templateResult.contractDiagnostics));
    assert.ok(Array.isArray(templateResult.warnings));
    assert.ok(Array.isArray(templateResult.instanceWarnings));
  });
}

function testTemplateInstanceWarningsAreExposedByTemplateTest() {
  const template = Core.registerTemplate({
    id: "synthetic-instance-warning-template",
    name: "Synthetic warning template",
    status: "active",
    familyId: "synthetic-family",
    mathFamilyId: "synthetic-math",
    methodId: "synthetic-method",
    submethodId: "synthetic-submethod",
    validationMode: "multiple-choice",
    rendererId: "synthetic-renderer",
    difficultyMin: 1,
    difficultyMax: 1,
    variants: [{ id: "base" }],
    parameters: ["x"],
    restrictions: ["x != 0"],
    commonErrors: ["synthetic-error"],
    distractorStrategies: ["synthetic-error"],
    feedbackRules: [{ errorType: "synthetic-error", title: "Error" }],
    buildCorrectAnswer() {},
    buildDistractors() {},
    generate(context) {
      return {
        id: "synthetic-instance-warning-exercise",
        familyId: "synthetic-family",
        mathFamilyId: "synthetic-math",
        methodId: "synthetic-method",
        submethodId: "synthetic-submethod",
        templateId: context.template.id,
        difficulty: "1",
        validationMode: "multiple-choice",
        integralShown: {
          plain: "int f(x) dx",
          latex: "\\int f(x) dx",
        },
        correctAnswer: {
          id: "correct",
          displayPlain: "F(x) + C",
          displayLatex: "F(x) + C",
          isCorrect: true,
          key: "correct",
        },
        options: [
          {
            id: "correct",
            displayPlain: "F(x) + C",
            displayLatex: "F(x) + C",
            isCorrect: true,
            key: "correct",
          },
          {
            id: "fallback-warning",
            displayPlain: "f(x) + C",
            displayLatex: "f(x) + C",
            isCorrect: false,
            key: "fallback-warning",
            errorType: "synthetic-error",
            errorTag: "synthetic-error",
            metadata: { generatedFallbackId: true },
          },
        ],
      };
    },
  });
  const result = Core.testTemplates({ templates: [template], iterations: 1 });

  assert.equal(result.passed, true);
  assert.deepEqual(result.results[0].instanceWarnings, [
    {
      index: 0,
      seed: "template-test:synthetic-instance-warning-template:0",
      warnings: ["option-with-generated-fallback-id"],
    },
  ]);
}

function run() {
  testExerciseCarriesValidationMode();
  testTemplateContractNormalization();
  testInvalidValidationModeSurvivesNormalizationDiagnostics();
  testLinearTemplatesDeclareV15Fields();
  testModuleRegistryDiagnostics();
  testTemplateDiagnosticsAreReadable();
  testTemplateDiagnosticsAreExposedByTemplateTest();
  testTemplateInstanceWarningsAreExposedByTemplateTest();
  console.log("Contract tests passed!");
}

run();
