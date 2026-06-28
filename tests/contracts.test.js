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
  });
}

function run() {
  testExerciseCarriesValidationMode();
  testTemplateContractNormalization();
  testLinearTemplatesDeclareV15Fields();
  testModuleRegistryDiagnostics();
  testTemplateDiagnosticsAreReadable();
  testTemplateDiagnosticsAreExposedByTemplateTest();
  console.log("Contract tests passed!");
}

run();
