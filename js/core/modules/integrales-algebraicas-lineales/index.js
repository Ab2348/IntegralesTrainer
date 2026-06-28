(function (root) {
  "use strict";

  if (typeof require === "function") {
    require("../../diagnostico-contratos.js");
    require("../../contratos.js");
    require("../../racionales.js");
    require("../../parametros.js");
    require("../../identidad-opciones.js");
    require("../../firmas.js");
    require("../../math-renderer.js");
    require("../../modelo-ejercicio.js");
    require("../../opciones.js");
    require("../../validacion.js");
    require("../../retroalimentacion.js");
    require("../../generador.js");
    require("../../registro.js");
    require("./familias.js");
    require("./errores.js");
    require("./variantes.js");
    require("./parametros.js");
    require("./formato.js");
    require("./formulas.js");
    require("./snapshots.js");
    require("./distractores.js");
    require("./feedback.js");
    require("./generacion.js");
    require("./derivacion.js");
    require("./renderer.js");
    require("./templates.js");
  }

  const ExerciseGenerator = root.TrigExerciseGenerator || {};
  const MathRenderer = root.TrigMathRenderer || {};
  const OptionEngine = root.TrigOptionEngine || {};
  const OptionIdentity = root.TrigOptionIdentity || {};
  const Validation = root.TrigValidation || {};
  const Rational = root.TrigRationalUtils || {};
  const Families = root.TrigAlgebraicLinearFamilies || {};
  const Errors = root.TrigAlgebraicLinearErrors || {};
  const Parameters = root.TrigAlgebraicLinearParameters || {};
  const Format = root.TrigAlgebraicLinearFormat || {};
  const Formulas = root.TrigAlgebraicLinearFormulas || {};
  const Snapshots = root.TrigAlgebraicLinearSnapshots || {};
  const Distractors = root.TrigAlgebraicLinearDistractors || {};
  const Feedback = root.TrigAlgebraicLinearFeedback || {};
  const Generation = root.TrigAlgebraicLinearGeneration || {};
  const Derivation = root.TrigAlgebraicLinearDerivation || {};
  const Renderer = root.TrigAlgebraicLinearRenderer || {};
  const Templates = root.TrigAlgebraicLinearTemplates || {};

  if (Renderer.registerAlgebraicLinearRenderer) {
    Renderer.registerAlgebraicLinearRenderer();
  }
  if (Templates.registerAlgebraicLinearTemplates) {
    Templates.registerAlgebraicLinearTemplates();
  }

  const MODULE_ID = "integrales-algebraicas-lineales";
  const PRACTICE_TYPE = {
    id: MODULE_ID,
    title: "Algebraicas con argumento lineal",
    description: "potencias, exponentes negativos y recíprocas lineales.",
    preview: [
      "potencia lineal positiva",
      "potencia lineal negativa",
      "recíproca lineal",
    ],
    shortLabel: "Algebraicas",
    order: 20,
  };

  function hasModuleFilter(filters) {
    return Boolean(
      filters &&
        (typeof filters.moduleId === "string" ||
          Array.isArray(filters.moduleIds)),
    );
  }

  function scopedFilters(filters) {
    const source = filters || {};
    return hasModuleFilter(source) ? source : { ...source, moduleId: MODULE_ID };
  }

  function registerTemplate(template) {
    return ExerciseGenerator.registerTemplate({
      ...(template || {}),
      moduleId: (template && template.moduleId) || MODULE_ID,
    });
  }

  function listTemplates() {
    return ExerciseGenerator.listTemplates().filter(
      (template) => template.moduleId === MODULE_ID,
    );
  }

  function findTemplates(filters) {
    return ExerciseGenerator.findTemplates(scopedFilters(filters));
  }

  function testTemplates(config) {
    const source = config || {};
    if (Array.isArray(source.templates)) {
      return ExerciseGenerator.testTemplates(source);
    }
    return ExerciseGenerator.testTemplates({
      ...source,
      filters: scopedFilters(source.filters),
    });
  }

  const api = {
    moduleId: MODULE_ID,
    moduleName: "Integrales algebraicas con argumento lineal",
    practiceType: PRACTICE_TYPE,
    modelVersion: "1.5",
    generatorVersion: ExerciseGenerator.ENGINE_VERSION || "1.5",
    ERROR_TAGS: Errors.ERROR_TAGS,
    ERROR_LABELS: Errors.ERROR_LABELS,
    MATH_FAMILIES: Families.MATH_FAMILIES || [],
    MATH_FAMILY_MAP: Families.MATH_FAMILY_MAP || {},
    METHODS: Families.METHODS || [],
    METHOD_MAP: Families.METHOD_MAP || {},
    ERROR_TYPES: Errors.ERROR_TYPES || [],
    ERROR_TYPE_MAP: Errors.ERROR_TYPE_MAP || {},
    FAMILIES: Families.FAMILY_DEFINITIONS,
    FAMILY_MAP: Families.FAMILY_MAP,
    MODE_FAMILIES: Families.MODE_FAMILIES,
    MODES: Families.MODES,
    MODE_MAP: Families.MODE_MAP,
    defaultModeId: Families.defaultModeId,
    customModeId: Families.customModeId,
    FAMILY_GROUPS: Families.FAMILY_GROUPS,
    familyGroups: Families.familyGroups || Families.FAMILY_GROUPS,
    RANGE_LIMITS: Parameters.RANGE_LIMITS,
    K_RANGE_LIMITS: Parameters.K_RANGE_LIMITS,
    COEFFICIENT_TYPES: Parameters.COEFFICIENT_TYPES,
    optionCountForDifficulty: OptionEngine.optionCountForDifficulty,
    optionIdentity: OptionEngine.optionIdentity || OptionIdentity.optionIdentity,
    rational: Rational.rational,
    rationalPlain: Rational.rationalPlain,
    rationalLatex: Rational.rationalLatex,
    rationalKey: Rational.rationalKey,
    equals: Rational.equals,
    createArgument: Format.createArgument,
    formatArgumentPlain: Format.formatArgumentPlain,
    powerTermPlain: Format.powerTermPlain,
    powerTermLatex: Format.powerTermLatex,
    logTermPlain: Format.logTermPlain,
    logTermLatex: Format.logTermLatex,
    expressionPlain: Format.expressionPlain,
    expressionLatex: Format.expressionLatex,
    integralPlain: Format.integralPlain,
    integralLatex: Format.integralLatex,
    correctAnswerShape: Format.correctAnswerShape,
    correctCoefficient: Format.correctCoefficient,
    buildExerciseFromParams: Generation.buildExerciseFromParams,
    generateExercise: Generation.generateExercise,
    registerTemplate,
    listTemplates,
    findTemplates,
    testTemplates,
    createSeededRng: ExerciseGenerator.createSeededRng,
    validateGeneratedExercise: ExerciseGenerator.validateGeneratedExercise,
    validateAnswer: Validation.validateAnswer || Feedback.validateAnswer,
    sanitizeRange: Generation.sanitizeRange,
    exerciseSnapshot: Snapshots.exerciseSnapshot,
    optionSnapshot: Snapshots.optionSnapshot,
    errorExampleMath: Snapshots.errorExampleMath,
    renderLatex: MathRenderer.renderLatex,
    renderExpression: MathRenderer.renderExpression,
    renderInto: MathRenderer.renderInto,
    renderContent: MathRenderer.renderContent,
    renderContentInto: MathRenderer.renderContentInto,
    renderIntegral: Format.renderIntegral,
    renderOption: Format.renderOption,
    feedbackContent: Feedback.feedbackContent,
    derivationContent: Derivation.derivationContent,
    feedbackVariables: Feedback.feedbackVariables,
    generalRuleLatex: Formulas.generalRuleLatex,
    logarithmicRuleLatex: Formulas.logarithmicRuleLatex,
    formulaCatalog: Formulas.formulaCatalog,
    familyLabelLatex: Formulas.familyLabelLatex,
    familyLabelExpression: Formulas.familyLabelExpression,
    errorLabelContent: Formulas.errorLabelContent,
    normalizeMethodIds: Generation.normalizeMethodIds,
    normalizeMathFamilyIds: Generation.normalizeMathFamilyIds,
    shuffle: Generation.shuffle,
    buildCorrectOption: Distractors.buildCorrectOption,
    buildDistractorCandidates: Distractors.buildDistractorCandidates,
  };

  if (root.TrigCoreRegistry) {
    root.TrigCoreRegistry.register(api);
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
