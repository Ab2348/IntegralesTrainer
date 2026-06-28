(function (root) {
  "use strict";

  if (typeof require === "function") {
    require("../../generador.js");
    require("./familias.js");
    require("./errores.js");
    require("./variantes.js");
    require("./parametros.js");
    require("./formato.js");
    require("./distractores.js");
    require("./generacion.js");
    require("./feedback.js");
  }

  const ExerciseGenerator = root.TrigExerciseGenerator || {};
  const Families = root.TrigAlgebraicLinearFamilies || {};
  const Errors = root.TrigAlgebraicLinearErrors || {};
  const Variants = root.TrigAlgebraicLinearVariants || {};
  const Parameters = root.TrigAlgebraicLinearParameters || {};
  const Format = root.TrigAlgebraicLinearFormat || {};
  const Distractors = root.TrigAlgebraicLinearDistractors || {};
  const Generation = root.TrigAlgebraicLinearGeneration || {};
  const Feedback = root.TrigAlgebraicLinearFeedback || {};
  const {
    FAMILY_MAP,
    DEFAULT_MATH_FAMILY_ID,
    DEFAULT_METHOD_ID,
  } = Families;
  const { ERROR_TAGS, DISTRACTOR_STRATEGIES } = Errors;
  const {
    BASE_VARIANT,
    ALGEBRAIC_LINEAR_VARIANTS,
    ALGEBRAIC_LINEAR_RENDERER_ID,
  } = Variants;
  const {
    ALGEBRAIC_LINEAR_DIFFICULTY_PROFILE,
    parameterDescriptors,
  } = Parameters;
  const { integralPlain, integralLatex } = Format;
  const { buildCorrectOption, buildDistractorCandidates } = Distractors;
  const { paramsForDifficulty, sanitizeRange, buildExerciseFromParams } = Generation;
  const { buildAlgebraicFeedbackRules } = Feedback;

  const TEMPLATE_DEFINITIONS = [
    {
      id: "algebraic-linear-power-positive",
      name: "Potencia lineal positiva",
      familyId: "potencia-lineal-positiva",
      submethodId: "potencia-lineal",
      tags: ["algebraica", "potencia", "argumento-lineal"],
    },
    {
      id: "algebraic-linear-power-negative",
      name: "Potencia lineal negativa",
      familyId: "potencia-lineal-negativa",
      submethodId: "potencia-lineal",
      tags: ["algebraica", "potencia-negativa", "argumento-lineal"],
    },
    {
      id: "algebraic-linear-reciprocal",
      name: "Recíproca lineal",
      familyId: "reciproca-lineal",
      submethodId: "reciproca-lineal",
      tags: ["algebraica", "logaritmica", "argumento-lineal"],
    },
  ];

  function registerAlgebraicLinearTemplates() {
    if (!ExerciseGenerator.registerTemplate) {
      return;
    }
    TEMPLATE_DEFINITIONS.forEach((definition) => {
      const family = FAMILY_MAP[definition.familyId];
      ExerciseGenerator.registerTemplate({
        id: definition.id,
        moduleId: "integrales-algebraicas-lineales",
        name: definition.name,
        status: "active",
        familyId: definition.familyId,
        mathFamilyId: DEFAULT_MATH_FAMILY_ID,
        methodId: DEFAULT_METHOD_ID,
        submethodId: definition.submethodId,
        validationMode: "multiple-choice",
        rendererId: ALGEBRAIC_LINEAR_RENDERER_ID,
        tags: definition.tags,
        difficultyMin: 1,
        difficultyMax: 5,
        variants: ALGEBRAIC_LINEAR_VARIANTS.map((variant) => ({
          ...variant,
          appliesToTemplate: definition.id,
        })),
        parameters: parameterDescriptors(),
        restrictions: [
          {
            id: "non-zero-external-coefficient",
            description: "A no puede ser cero.",
          },
          {
            id: "non-zero-inner-coefficient",
            description: "k no puede ser cero.",
          },
          {
            id: "family-exponent-domain",
            description:
              "n debe pertenecer al dominio de la familia: positivo, negativo menor o igual que -2, o -1 reciproco.",
          },
          {
            id: "unique-options",
            description: "Las opciones generadas no pueden duplicarse.",
          },
        ],
        commonErrors: ERROR_TAGS.slice(),
        distractorStrategies: DISTRACTOR_STRATEGIES.slice(),
        feedbackRules: buildAlgebraicFeedbackRules(),
        difficultyProfile: ALGEBRAIC_LINEAR_DIFFICULTY_PROFILE,
        buildIntegral(exercise) {
          return {
            plain: integralPlain(exercise),
            latex: integralLatex(exercise),
          };
        },
        buildCorrectAnswer: buildCorrectOption,
        buildDistractors: buildDistractorCandidates,
        buildSignature(params, context) {
          return [
            context.templateId || definition.id,
            context.variantId || "",
            params.A,
            params.k,
            params.b,
            params.n,
            params.familyId,
          ].join("|");
        },
        buildExplanation(exercise) {
          return {
            plain:
              exercise.n === -1
                ? "Aplicar int A/(kx + b) dx = (A/k) ln |kx + b| + C."
                : "Aplicar int A(kx + b)^n dx = A/(k(n + 1))(kx + b)^(n + 1) + C.",
          };
        },
        validateInstance(exercise) {
          const optionKeys = new Set(
            (exercise.options || []).map((option) => option.key),
          );
          return Boolean(
            exercise &&
              exercise.A &&
              exercise.k &&
              exercise.A.n !== 0 &&
              exercise.k.n !== 0 &&
              Number.isInteger(exercise.n) &&
              exercise.correctAnswer &&
              Array.isArray(exercise.options) &&
              optionKeys.size === exercise.options.length,
          );
        },
        generate(context) {
          const template = context.template || {};
          const variant = context.variant || BASE_VARIANT;
          const settings = context.settings || {};
          const params = paramsForDifficulty(
            settings.difficulty,
            [family.id],
            context.range || sanitizeRange(settings.rangeMin, settings.rangeMax),
            context.rng || Math.random,
            variant,
          );
          return buildExerciseFromParams(
            params,
            context.optionCount || 4,
            context.rng || Math.random,
            {
              templateId: template.id || definition.id,
              mathFamilyId: template.mathFamilyId || DEFAULT_MATH_FAMILY_ID,
              methodId: template.methodId || DEFAULT_METHOD_ID,
              submethodId: template.submethodId || definition.submethodId,
              difficulty: settings.difficulty,
              generatorId: "integrales-algebraicas-lineales",
              variantId: variant.id || BASE_VARIANT.id,
              rendererId: ALGEBRAIC_LINEAR_RENDERER_ID,
              validationMode: template.validationMode,
              template,
              seed: context.seed || null,
              attempt: context.attempt,
              engineVersion: context.engineVersion || "",
              feedbackRules: template.feedbackRules || [],
            },
          );
        },
      });
    });
  }

  root.TrigAlgebraicLinearTemplates = {
    TEMPLATE_DEFINITIONS,
    registerAlgebraicLinearTemplates,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.TrigAlgebraicLinearTemplates;
  }
})(typeof window !== "undefined" ? window : globalThis);
