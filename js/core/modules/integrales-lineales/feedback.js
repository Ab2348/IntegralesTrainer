(function (root) {
  "use strict";

  if (typeof require === "function") {
    require("../../racionales.js");
    require("../../validacion.js");
    require("../../retroalimentacion.js");
    require("./formato.js");
  }

  const FeedbackEngine = root.TrigFeedbackEngine || {};
  const Validation = root.TrigValidation || {};
  const Rational = root.TrigRationalUtils || {};
  const Format = root.TrigLinearFormat || {};
  const { divide, rational, absRational, rationalPlain, rationalLatex } = Rational;
  const {
    mathInline,
    mathBlock,
    contentNode,
    termLatex,
    termPlain,
    coreLatex,
    integralLatex,
    familyAntiderivativeLatex,
    baseRuleLatex,
    generalRuleLatex,
    antiderivativeWithArgumentPlain,
    integralTermLatex,
    expressionLatex,
    errorLabelContent,
    createSymbolArgument,
  } = Format;

  function feedbackVariables(exercise, chosen) {
    const aOverK = divide(exercise.A, exercise.k);
    const substitutionRightLatex = `${termLatex(exercise.correctCoefficient, exercise.family.baseCore, exercise.argument)} + C`;
    const substitutionRightPlain = `${termPlain(exercise.correctCoefficient, exercise.family.baseCore, exercise.argument)} + C`;
    const fULatex = coreLatex(exercise.family.integrandCore, createSymbolArgument("u"));
    const FULatex = familyAntiderivativeLatex(exercise.family);
    const FWithArgumentLatex = termLatex(
      rational(exercise.family.baseSign, 1),
      exercise.family.baseCore,
      exercise.argument,
    );
    const baseRule = `int ${exercise.family.fDisplay} du = ${exercise.family.FDisplay} + C`;
    const baseRuleLatexValue = baseRuleLatex(exercise.family);
    const generalRuleLatexValue = generalRuleLatex();
    const substitutionExpression = `${exercise.integrandExpression} = ${substitutionRightPlain}`;
    const substitutionExpressionLatex = `${integralLatex(exercise)} = ${substitutionRightLatex}`;
    const correctExpressionLatex =
      exercise.correctAnswer.displayLatex || expressionLatex(exercise.correctAnswer);
    const chosenExpressionLatex = chosen
      ? chosen.displayLatex || expressionLatex(chosen)
      : "";
    return {
      A: rationalPlain(exercise.A),
      ALatex: rationalLatex(exercise.A),
      AMath: mathInline(rationalLatex(exercise.A), rationalPlain(exercise.A)),
      k: rationalPlain(exercise.k),
      kLatex: rationalLatex(exercise.k),
      kMath: mathInline(rationalLatex(exercise.k), rationalPlain(exercise.k)),
      b: rationalPlain(exercise.b),
      bLatex: rationalLatex(exercise.b),
      bMath: mathInline(rationalLatex(exercise.b), rationalPlain(exercise.b)),
      u: exercise.argument.display,
      uLatex: exercise.argument.displayLatex,
      uMath: mathInline(exercise.argument.displayLatex, exercise.argument.display),
      fU: exercise.family.fDisplay,
      fULatex,
      fUMath: mathInline(fULatex, exercise.family.fDisplay),
      FU: exercise.family.FDisplay,
      FULatex,
      FUMath: mathInline(FULatex, exercise.family.FDisplay),
      FWithArgument: antiderivativeWithArgumentPlain(
        exercise.family,
        exercise.argument,
      ),
      FWithArgumentLatex,
      FWithArgumentMath: mathInline(FWithArgumentLatex),
      baseRule,
      baseRuleLatex: baseRuleLatexValue,
      baseRuleMath: mathBlock(baseRuleLatexValue, baseRule),
      generalRule: "int A f(kx + b) dx = (A/k) F(kx + b) + C",
      generalRuleLatex: generalRuleLatexValue,
      generalRuleMath: mathBlock(generalRuleLatexValue),
      AOverK: rationalPlain(aOverK),
      AOverKLatex: rationalLatex(aOverK),
      AOverKMath: mathInline(rationalLatex(aOverK), rationalPlain(aOverK)),
      currentIntegral: exercise.integrandExpression,
      currentIntegralLatex: exercise.integrandLatex,
      currentIntegralMath: mathInline(exercise.integrandLatex, exercise.integrandExpression),
      substitutionExpression,
      substitutionExpressionLatex,
      substitutionExpressionMath: mathBlock(
        substitutionExpressionLatex,
        substitutionExpression,
      ),
      correctCoefficient: rationalPlain(exercise.correctCoefficient),
      correctCoefficientLatex: rationalLatex(exercise.correctCoefficient),
      correctCoefficientMath: mathInline(
        rationalLatex(exercise.correctCoefficient),
        rationalPlain(exercise.correctCoefficient),
      ),
      chosenExpression: chosen ? chosen.displayExpression : "",
      chosenExpressionLatex,
      chosenExpressionMath: chosenExpressionLatex
        ? mathInline(chosenExpressionLatex, chosen ? chosen.displayExpression : "")
        : "",
      correctExpression: exercise.correctAnswer.displayExpression,
      correctExpressionLatex,
      correctExpressionMath: mathInline(
        correctExpressionLatex,
        exercise.correctAnswer.displayExpression,
      ),
      familyName: exercise.family.name,
      baseCore: exercise.family.baseCore,
      baseSign: String(exercise.family.baseSign),
      absK: rationalPlain(absRational(exercise.k)),
      absKMath: mathInline(rationalLatex(absRational(exercise.k))),
    };
  }

  function valueLine(label, value) {
    return contentNode("div", "", [
      contentNode("strong", "", [label]),
      contentNode("span", "", [value]),
    ]);
  }

  function centeredFormula(value) {
    return contentNode("div", "centered-formula", [value]);
  }

  function reconstructionContent(exercise, vars) {
    return contentNode("div", "reconstruction", [
      contentNode("span", "section-label", ["Para este ejercicio"]),
      contentNode("div", "feedback-values", [
        valueLine("A", vars.AMath),
        valueLine("k", vars.kMath),
        valueLine("b", vars.bMath),
        valueLine("u", vars.uMath),
        valueLine("f(u)", vars.fUMath),
        valueLine("F(u)", vars.FUMath),
      ]),
      contentNode("div", "rule-box", [
        contentNode("p", "", ["La regla base es:"]),
        centeredFormula(vars.baseRuleMath),
        contentNode("p", "", ["Regla general:"]),
        centeredFormula(vars.generalRuleMath),
        contentNode("p", "", ["Sustituyendo:"]),
        centeredFormula(vars.substitutionExpressionMath),
        contentNode("p", "", ["Resultado simplificado:"]),
        centeredFormula(mathBlock(vars.correctExpressionLatex, vars.correctExpression)),
      ]),
    ]);
  }

  function incorrectDetailsContent(context) {
    return [
      contentNode("div", "divider", []),
      reconstructionContent(context.exercise, context.variables || {}),
    ];
  }

  function buildTrigFeedbackRules() {
    return [
      {
        id: "trig-linear-correct",
        errorType: "correct",
        errorTag: "correct",
        title: "Correcto",
        message: [
          "Identificaste la antiderivada base F(u) = ",
          { var: "FUMath" },
          " y compensaste la derivada del argumento u' = ",
          { var: "kMath" },
          ".",
        ],
        hint: [contentNode("strong", "math-inline", [{ var: "correctExpressionMath" }])],
      },
      {
        id: "trig-linear-wrong-family",
        errorType: "wrong-family",
        errorTag: "wrong-family",
        title: ["Incorrecto: ", { var: "errorLabelContent" }],
        message: [
          "Usaste una familia incorrecta como antiderivada. En este ejercicio el integrando usa f(u) = ",
          { var: "fUMath" },
          ", cuya antiderivada base es F(u) = ",
          { var: "FUMath" },
          ". Por eso la respuesta debe usar F(u), no la familia que elegiste.",
        ],
        details: incorrectDetailsContent,
      },
      {
        id: "trig-linear-wrong-base-sign",
        errorType: "wrong-base-sign",
        errorTag: "wrong-base-sign",
        title: ["Incorrecto: ", { var: "errorLabelContent" }],
        message: [
          "Recordaste la familia correcta, pero fallaste el signo base de la integral. Para esta familia se cumple que ",
          { var: "baseRuleMath" },
          ". Ese signo debe aplicarse antes de dividir entre k.",
        ],
        details: incorrectDetailsContent,
      },
      {
        id: "trig-linear-forgot-chain-factor",
        errorType: "forgot-chain-factor",
        errorTag: "forgot-chain-factor",
        title: ["Incorrecto: ", { var: "errorLabelContent" }],
        message: [
          "Usaste la antiderivada base correcta, pero olvidaste compensar la derivada del argumento. El argumento es u = ",
          { var: "uMath" },
          ", por lo tanto u' = ",
          { var: "kMath" },
          ". Por eso la antiderivada debe multiplicarse por ",
          { var: "inverseKMath" },
          ".",
        ],
        details: incorrectDetailsContent,
      },
      {
        id: "trig-linear-ignored-negative-k",
        errorType: "ignored-negative-k",
        errorTag: "ignored-negative-k",
        title: ["Incorrecto: ", { var: "errorLabelContent" }],
        message: [
          "Compensaste la derivada del argumento, pero ignoraste su signo. El argumento es u = ",
          { var: "uMath" },
          ", asi que u' = ",
          { var: "kMath" },
          ", no ",
          { var: "absKMath" },
          ". Debias dividir entre ",
          { var: "kMath" },
          ", no solamente entre su valor positivo.",
        ],
        details: incorrectDetailsContent,
      },
      {
        id: "trig-linear-lost-external-sign",
        errorType: "lost-external-sign",
        errorTag: "lost-external-sign",
        title: ["Incorrecto: ", { var: "errorLabelContent" }],
        message: [
          "Perdiste el signo del coeficiente externo. El integrando completo esta multiplicado por A = ",
          { var: "AMath" },
          ". Ese valor debe entrar completo en el coeficiente A/k, incluyendo su signo.",
        ],
        details: incorrectDetailsContent,
      },
      {
        id: "trig-linear-copied-integrand",
        errorType: "copied-integrand",
        errorTag: "copied-integrand",
        title: ["Incorrecto: ", { var: "errorLabelContent" }],
        message: [
          "Tu respuesta conserva demasiado la forma del integrando. Integrar significa buscar una funcion que, al derivarse, regrese al integrando original. Aqui el integrando usa f(u) = ",
          { var: "fUMath" },
          ", pero la antiderivada base debe ser F(u) = ",
          { var: "FUMath" },
          ".",
        ],
        details: incorrectDetailsContent,
      },
      {
        id: "trig-linear-lost-argument-shift",
        errorType: "lost-argument-shift",
        errorTag: "lost-argument-shift",
        title: ["Incorrecto: ", { var: "errorLabelContent" }],
        message: [
          "Usaste la estructura correcta, pero cambiaste el argumento. El argumento original es u = ",
          { var: "uMath" },
          ". La antiderivada debe conservar exactamente ese argumento, porque al derivarlo aparece el factor u' = ",
          { var: "kMath" },
          ".",
        ],
        details: incorrectDetailsContent,
      },
      {
        id: "trig-linear-generic-coefficient-error",
        errorType: "generic-coefficient-error",
        errorTag: "generic-coefficient-error",
        title: ["Incorrecto: ", { var: "errorLabelContent" }],
        message: [
          "El tipo de funcion es correcto, pero el coeficiente no coincide. El coeficiente correcto se obtiene con A por el signo base, dividido entre k. En este ejercicio eso da ",
          { var: "correctCoefficientMath" },
          ".",
        ],
        details: incorrectDetailsContent,
      },
    ];
  }

  function defaultFallbackFeedbackContent(exercise, chosen) {
    const vars = feedbackVariables(exercise, chosen);
    if (!chosen || chosen.isCorrect) {
      return [
        contentNode("div", "feedback-title", ["Correcto"]),
        contentNode("p", "", [
          "Identificaste la antiderivada base F(u) = ",
          vars.FUMath,
          " y compensaste la derivada del argumento u' = ",
          vars.kMath,
          ".",
        ]),
        contentNode("p", "", [
          contentNode("strong", "math-inline", [vars.correctExpressionMath]),
        ]),
      ];
    }
    return [
      contentNode("div", "feedback-title", [
        "Incorrecto: ",
        ...errorLabelContent(chosen.errorTag),
      ]),
      contentNode("p", "", [
        "Revisa la regla general y el tipo de error asociado a la opcion elegida.",
      ]),
      ...incorrectDetailsContent({ exercise, variables: vars }),
    ];
  }

  function feedbackContent(exercise, chosen) {
    if (FeedbackEngine.buildFeedbackContent) {
      const validation = chosen ? validateAnswer(exercise, chosen.id) : null;
      const variables = feedbackVariables(
        exercise,
        validation && validation.selectedOption
          ? validation.selectedOption
          : chosen,
      );
      const errorTag =
        (validation && validation.errorTag) ||
        (chosen && chosen.errorTag) ||
        "generic-coefficient-error";
      variables.errorLabelContent = errorLabelContent(errorTag);
      variables.inverseKMath = mathInline(
        `\\frac{1}{${variables.kLatex}}`,
        `1/${variables.k}`,
      );
      return FeedbackEngine.buildFeedbackContent(exercise, chosen, {
        validation,
        variables,
        rules: exercise.feedbackRules || buildTrigFeedbackRules(),
      });
    }

    return defaultFallbackFeedbackContent(exercise, chosen);
  }

  function validateAnswer(exercise, optionId) {
    if (Validation.validateMultipleChoice) {
      return Validation.validateMultipleChoice(exercise, optionId);
    }
    const chosen = exercise.options.find((option) => option.id === optionId);
    return {
      isValid: Boolean(chosen),
      isCorrect: Boolean(chosen && chosen.isCorrect),
      selectedOption: chosen || null,
      errorTag: chosen ? chosen.errorTag : "invalid-option",
      errorType: chosen ? chosen.errorType || chosen.errorTag : "invalid-option",
      stats: exercise.statsInfo || {},
    };
  }

  root.TrigLinearFeedback = {
    feedbackVariables,
    valueLine,
    centeredFormula,
    reconstructionContent,
    incorrectDetailsContent,
    buildTrigFeedbackRules,
    defaultFallbackFeedbackContent,
    feedbackContent,
    validateAnswer,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.TrigLinearFeedback;
  }
})(typeof window !== "undefined" ? window : globalThis);
