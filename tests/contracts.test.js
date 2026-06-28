const assert = require("node:assert/strict");

const Core = require("../core.js");

function testExerciseCarriesValidationMode() {
  const exercise = Core.generateExercise({
    settings: {
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
    recentSignatures: [],
    rng: () => 0.42,
  });

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
  const ParameterPolicy = globalThis.TrigParameterPolicy;
  assert.ok(templates.length > 0);

  templates.forEach((template) => {
    assert.equal(template.validationMode, "multiple-choice");
    assert.equal(template.rendererId, "trig-linear-renderer");
    assert.equal(template.moduleId, "integrales-lineales");
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
    assert.equal(typeof template.buildSignature, "function");
    assert.ok(template.difficultyProfile);
    assert.ok(Array.isArray(template.difficultyProfile.levels));
    template.difficultyProfile.levels.forEach((level) => {
      const rules = ParameterPolicy.normalizeParameterRules(level.parameterRules);
      assert.ok(rules.A, `${template.id} nivel ${level.id} no declara regla para A`);
      assert.ok(rules.k, `${template.id} nivel ${level.id} no declara regla para k`);
      assert.ok(rules.b, `${template.id} nivel ${level.id} no declara regla para b`);
      assert.ok(rules.A.kind, `${template.id} nivel ${level.id} regla A no normaliza`);
      assert.ok(rules.k.kind, `${template.id} nivel ${level.id} regla k no normaliza`);
      assert.ok(rules.b.kind, `${template.id} nivel ${level.id} regla b no normaliza`);
    });
  });
}

function testUniversalExerciseModelUsesNeutralModuleDefaults() {
  const exercise = globalThis.TrigExerciseModel.createUniversalExercise({
    id: "neutral-model-defaults",
    integralShown: {
      plain: "int f(x) dx",
      latex: "\\int f(x)\\,dx",
    },
    options: [
      {
        id: "correct",
        displayPlain: "F(x) + C",
        displayLatex: "F(x) + C",
        isCorrect: true,
        key: "correct",
      },
    ],
  });

  assert.equal(exercise.methodId, "");
  assert.equal(exercise.mathFamilyId, "");
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
      return globalThis.TrigExerciseModel.createUniversalExercise({
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
            displayPlain: "f(x) + C",
            displayLatex: "f(x) + C",
            isCorrect: false,
            key: "fallback-warning",
            errorType: "synthetic-error",
            errorTag: "synthetic-error",
            metadata: { generatedFallbackId: true },
          },
        ],
      });
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

function testTemplateBuildSignatureHookIsUsed() {
  const template = Core.registerTemplate({
    id: "synthetic-signature-template",
    name: "Synthetic signature template",
    status: "active",
    familyId: "sin",
    mathFamilyId: "trigonometrica-directa",
    methodId: "synthetic-signature-method",
    submethodId: "synthetic-signature-submethod",
    validationMode: "multiple-choice",
    rendererId: "trig-linear-renderer",
    difficultyMin: 1,
    difficultyMax: 1,
    variants: [{ id: "base" }],
    parameters: ["A", "k", "b"],
    restrictions: ["A != 0", "k != 0"],
    commonErrors: ["wrong-base-sign"],
    distractorStrategies: ["wrong-base-sign"],
    feedbackRules: globalThis.TrigLinearFeedback.buildTrigFeedbackRules(),
    buildCorrectAnswer() {},
    buildDistractors() {},
    buildSignature(params, context) {
      return [
        "hook",
        context.templateId,
        context.variantId,
        params.A,
        params.familyId,
        params.k,
        params.b,
      ].join("|");
    },
    generate(context) {
      return Core.buildExerciseFromParams(
        { A: 1, k: 1, b: 0, familyId: "sin", difficulty: "1" },
        4,
        context.rng,
        {
          templateId: context.template.id,
          mathFamilyId: context.template.mathFamilyId,
          methodId: context.template.methodId,
          submethodId: context.template.submethodId,
          difficulty: "1",
          validationMode: context.template.validationMode,
          variantId: "base",
          rendererId: context.template.rendererId,
          seed: context.seed,
          attempt: context.attempt,
          feedbackRules: context.template.feedbackRules,
          template: context.template,
        },
      );
    },
  });
  const exercise = globalThis.TrigExerciseGenerator.generateExercise({
    settings: {
      difficulty: "1",
      activeFamilyIds: ["sin"],
      activeMathFamilyIds: ["trigonometrica-directa"],
      activeMethodIds: ["synthetic-signature-method"],
      includeExperimentalMethods: true,
    },
    seed: "synthetic-signature-hook",
  });

  assert.equal(template.id, "synthetic-signature-template");
  assert.equal(
    exercise.signature,
    "hook|synthetic-signature-template|base|1|sin|1|0",
  );
}

function run() {
  testExerciseCarriesValidationMode();
  testTemplateContractNormalization();
  testInvalidValidationModeSurvivesNormalizationDiagnostics();
  testLinearTemplatesDeclareV15Fields();
  testUniversalExerciseModelUsesNeutralModuleDefaults();
  testModuleRegistryDiagnostics();
  testTemplateDiagnosticsAreReadable();
  testTemplateDiagnosticsAreExposedByTemplateTest();
  testTemplateInstanceWarningsAreExposedByTemplateTest();
  testTemplateBuildSignatureHookIsUsed();
  console.log("Contract tests passed!");
}

run();
