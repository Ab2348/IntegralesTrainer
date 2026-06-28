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
  const Families = root.TrigLinearFamilies || {};
  const Errors = root.TrigLinearErrors || {};
  const Parameters = root.TrigLinearParameters || {};
  const Format = root.TrigLinearFormat || {};
  const Formulas = root.TrigLinearFormulas || {};
  const Snapshots = root.TrigLinearSnapshots || {};
  const Distractors = root.TrigLinearDistractors || {};
  const Feedback = root.TrigLinearFeedback || {};
  const Generation = root.TrigLinearGeneration || {};
  const Derivation = root.TrigLinearDerivation || {};
  const Renderer = root.TrigLinearRenderer || {};
  const Templates = root.TrigLinearTemplates || {};

  if (Renderer.registerLinearRenderer) {
    Renderer.registerLinearRenderer();
  }
  if (Templates.registerLinearTemplates) {
    Templates.registerLinearTemplates();
  }

  const MODULE_ID = "integrales-lineales";

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
    moduleName: "Integrales con argumento lineal",
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
    corePlain: Format.corePlain,
    coreLatex: Format.coreLatex,
    expressionPlain: Format.expressionPlain,
    expressionLatex: Format.expressionLatex,
    integralPlain: Format.integralPlain,
    integralLatex: Format.integralLatex,
    plainMathExpression: Format.plainMathExpression,
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
