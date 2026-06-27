(function (root) {
  "use strict";

  if (typeof require === "function") {
    require("../../taxonomia.js");
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
    require("./datos.js");
    require("./formato.js");
    require("./distractores.js");
    require("./feedback.js");
    require("./generacion.js");
    require("./derivacion.js");
    require("./renderer.js");
    require("./templates.js");
  }

  const Taxonomy = root.TrigExerciseTaxonomy || {};
  const ExerciseGenerator = root.TrigExerciseGenerator || {};
  const MathRenderer = root.TrigMathRenderer || {};
  const OptionEngine = root.TrigOptionEngine || {};
  const OptionIdentity = root.TrigOptionIdentity || {};
  const Rational = root.TrigRationalUtils || {};
  const Data = root.TrigLinearData || {};
  const Format = root.TrigLinearFormat || {};
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

  const api = {
    moduleId: "integrales-lineales",
    moduleName: "Integrales con argumento lineal",
    modelVersion: "1.4",
    generatorVersion: ExerciseGenerator.ENGINE_VERSION || "1.4",
    ERROR_TAGS: Data.ERROR_TAGS,
    ERROR_LABELS: Data.ERROR_LABELS,
    MATH_FAMILIES: Taxonomy.MATH_FAMILIES || [],
    MATH_FAMILY_MAP: Taxonomy.MATH_FAMILY_MAP || {},
    METHODS: Taxonomy.METHODS || [],
    METHOD_MAP: Taxonomy.METHOD_MAP || {},
    ERROR_TYPES: Taxonomy.ERROR_TYPES || [],
    ERROR_TYPE_MAP: Taxonomy.ERROR_TYPE_MAP || {},
    FAMILIES: Data.FAMILY_DEFINITIONS,
    FAMILY_MAP: Data.FAMILY_MAP,
    MODE_FAMILIES: Data.MODE_FAMILIES,
    RANGE_LIMITS: Data.RANGE_LIMITS,
    COEFFICIENT_TYPES: Data.COEFFICIENT_TYPES,
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
    registerTemplate: ExerciseGenerator.registerTemplate,
    listTemplates: ExerciseGenerator.listTemplates,
    findTemplates: ExerciseGenerator.findTemplates,
    testTemplates: ExerciseGenerator.testTemplates,
    createSeededRng: ExerciseGenerator.createSeededRng,
    validateGeneratedExercise: ExerciseGenerator.validateGeneratedExercise,
    validateAnswer: Feedback.validateAnswer,
    sanitizeRange: Generation.sanitizeRange,
    exerciseSnapshot: Format.exerciseSnapshot,
    optionSnapshot: Format.optionSnapshot,
    errorExampleMath: Format.errorExampleMath,
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
    generalRuleLatex: Format.generalRuleLatex,
    formulaCatalog: Format.formulaCatalog,
    familyLabelLatex: Format.familyLabelLatex,
    familyLabelExpression: Format.familyLabelExpression,
    errorLabelContent: Format.errorLabelContent,
    normalizeMethodIds: Generation.normalizeMethodIds,
    normalizeMathFamilyIds: Generation.normalizeMathFamilyIds,
    shuffle: Generation.shuffle,
    buildCorrectOption: Distractors.buildCorrectOption,
    buildDistractorCandidates: Distractors.buildDistractorCandidates,
  };

  root.TrigCoreModules = root.TrigCoreModules || {};
  root.TrigCoreModules.integralesLineales = api;
  if (root.TrigCoreRegistry) {
    root.TrigCoreRegistry.register(api);
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
