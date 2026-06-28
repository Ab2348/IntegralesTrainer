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
  const Families = root.TrigLinearFamilies || {};
  const Errors = root.TrigLinearErrors || {};
  const Variants = root.TrigLinearVariants || {};
  const Parameters = root.TrigLinearParameters || {};
  const Format = root.TrigLinearFormat || {};
  const Distractors = root.TrigLinearDistractors || {};
  const Generation = root.TrigLinearGeneration || {};
  const Feedback = root.TrigLinearFeedback || {};
  const {
    FAMILY_DEFINITIONS,
    DEFAULT_MATH_FAMILY_ID,
    DEFAULT_METHOD_ID,
    DEFAULT_SUBMETHOD_ID,
  } = Families;
  const { ERROR_TAGS, DISTRACTOR_STRATEGIES } = Errors;
  const {
    BASE_VARIANT,
    TRIG_LINEAR_VARIANTS,
    TRIG_LINEAR_RENDERER_ID,
  } = Variants;
  const { TRIG_LINEAR_DIFFICULTY_PROFILE, RANGE_LIMITS } = Parameters;
  const { integralPlain, integralLatex } = Format;
  const { buildCorrectOption, buildDistractorCandidates } = Distractors;
  const { paramsForDifficulty, sanitizeRange, buildExerciseFromParams } = Generation;
  const { buildTrigFeedbackRules } = Feedback;

  function registerLinearTemplates() {
    if (!ExerciseGenerator.registerTemplate) {
      return;
    }
    FAMILY_DEFINITIONS.forEach((family) => {
      const templateId = `trig-linear-${family.id}`;
      ExerciseGenerator.registerTemplate({
        id: templateId,
        name: `Integral directa de ${family.name}`,
        status: "active",
        familyId: family.id,
        mathFamilyId: DEFAULT_MATH_FAMILY_ID,
        methodId: DEFAULT_METHOD_ID,
        submethodId: DEFAULT_SUBMETHOD_ID,
        validationMode: "multiple-choice",
        rendererId: TRIG_LINEAR_RENDERER_ID,
        tags: ["trigonometrica", "directa", "argumento-lineal", family.group],
        difficultyMin: 1,
        difficultyMax: 5,
        variants: TRIG_LINEAR_VARIANTS.map((variant) => ({
          ...variant,
          appliesToTemplate: templateId,
        })),
        commonErrors: ERROR_TAGS.slice(),
        distractorStrategies: DISTRACTOR_STRATEGIES.slice(),
        difficultyProfile: TRIG_LINEAR_DIFFICULTY_PROFILE,
        parameters: [
          {
            id: "A",
            name: "Coeficiente externo",
            type: "integer",
            range: RANGE_LIMITS,
            prohibited: [0],
            restrictions: ["A != 0"],
          },
          {
            id: "k",
            name: "Coeficiente interno",
            type: "integer",
            range: RANGE_LIMITS,
            prohibited: [0],
            restrictions: ["k != 0"],
          },
          {
            id: "b",
            name: "Termino independiente",
            type: "integer",
            range: RANGE_LIMITS,
            prohibited: [],
            restrictions: [],
          },
        ],
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
            id: "unique-options",
            description: "Las opciones generadas no pueden duplicarse.",
          },
        ],
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
            context.templateId || templateId,
            context.variantId || "",
            params.A,
            params.familyId,
            params.k,
            params.b,
          ].join("|");
        },
        buildExplanation(exercise) {
          return {
            plain: `Aplicar int A f(kx + b) dx = (A/k) F(kx + b) + C para ${exercise.family.name}.`,
          };
        },
        feedbackRules: buildTrigFeedbackRules(),
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
              templateId: template.id || `trig-linear-${family.id}`,
              mathFamilyId: template.mathFamilyId || DEFAULT_MATH_FAMILY_ID,
              methodId: template.methodId || DEFAULT_METHOD_ID,
              submethodId: template.submethodId || DEFAULT_SUBMETHOD_ID,
              difficulty: settings.difficulty,
              generatorId: "integrales-lineales",
              variantId: variant.id || BASE_VARIANT.id,
              rendererId: TRIG_LINEAR_RENDERER_ID,
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

  root.TrigLinearTemplates = { registerLinearTemplates };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.TrigLinearTemplates;
  }
})(typeof window !== "undefined" ? window : globalThis);
