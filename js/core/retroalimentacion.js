(function (root) {
  "use strict";

  const Validation = root.TrigValidation || {};
  function defaultCorrectRenderer() {
    return {
      type: "div",
      className: "feedback-title",
      children: ["Correcto"],
    };
  }

  function defaultIncorrectRenderer(context) {
    const tag = context && context.validation ? context.validation.errorTag : "";
    return [
      {
        type: "div",
        className: "feedback-title",
        children: ["Incorrecto"],
      },
      {
        type: "p",
        children: [tag],
      },
    ];
  }

  function findFeedbackRule(rules, validation) {
    const source = Array.isArray(rules) ? rules : [];
    const errorType =
      (validation && validation.errorType) ||
      (validation && validation.errorTag) ||
      "unknown";
    return (
      source.find((rule) => rule.errorType === errorType) ||
      source.find((rule) => rule.errorTag === errorType) ||
      source.find((rule) => validation && validation.isCorrect && rule.errorType === "correct") ||
      null
    );
  }

  function contentFromTemplate(value, variables) {
    if (value === null || value === undefined || value === false) {
      return [];
    }
    if (Array.isArray(value)) {
      return value.flatMap((item) => contentFromTemplate(item, variables));
    }
    if (typeof value === "object") {
      if (value.var) {
        const resolved = variables[value.var];
        return contentFromTemplate(
          resolved === undefined ? `{${value.var}}` : resolved,
          variables,
        );
      }
      return [
        {
          ...value,
          children: value.children
            ? contentFromTemplate(value.children, variables)
            : value.children,
        },
      ];
    }
    const source = String(value);
    const parts = [];
    let cursor = 0;
    source.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key, index) => {
      if (index > cursor) {
        parts.push(source.slice(cursor, index));
      }
      const resolved = variables[key];
      if (resolved === undefined) {
        parts.push(match);
      } else {
        parts.push(...contentFromTemplate(resolved, variables));
      }
      cursor = index + match.length;
      return match;
    });
    if (cursor < source.length) {
      parts.push(source.slice(cursor));
    }
    return parts;
  }

  function hasContent(value) {
    return Array.isArray(value) ? value.length > 0 : Boolean(value);
  }

  function renderRuleContent(rule, context) {
    if (!rule) {
      return [];
    }
    const variables = context.variables || {};
    const titleContent = contentFromTemplate(rule.title || rule.titleContent, variables);
    const title = hasContent(titleContent)
      ? titleContent
      : context.validation && context.validation.isCorrect
        ? ["Correcto"]
        : ["Incorrecto"];
    const message = contentFromTemplate(rule.message || rule.messageContent, variables);
    const hint = contentFromTemplate(rule.hint || rule.hintContent, variables);
    const details =
      typeof rule.details === "function"
        ? rule.details(context)
        : contentFromTemplate(rule.details || rule.detailsContent, variables);

    return [
      {
        type: "div",
        className: "feedback-title",
        children: title,
      },
      hasContent(message)
        ? {
            type: "p",
            children: message,
          }
        : null,
      hasContent(hint)
        ? {
            type: "p",
            children: hint,
          }
        : null,
      details || "",
    ];
  }

  function buildFeedbackContent(exercise, chosen, renderers) {
    const hooks = renderers || {};
    const validation = hooks.validation
      ? hooks.validation
      : Validation.validateMultipleChoice && chosen
        ? Validation.validateMultipleChoice(exercise, chosen.id)
        : {
            isCorrect: Boolean(chosen && chosen.isCorrect),
            selectedOption: chosen || null,
            errorTag: chosen ? chosen.errorTag : "",
          };
    const context = {
      exercise,
      chosen: validation.selectedOption || chosen,
      validation,
      variables: hooks.variables || {},
      rules: hooks.rules || (exercise && exercise.feedbackRules) || [],
    };
    const rule = findFeedbackRule(context.rules, validation);

    if (rule) {
      return renderRuleContent(rule, context);
    }

    if (validation.isCorrect) {
      return (hooks.correct || defaultCorrectRenderer)(context);
    }
    return (hooks.incorrect || defaultIncorrectRenderer)(context);
  }

  function interpolate(value, variables) {
    const content = contentFromTemplate(value, variables || {});
    return content
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }
        if (item && typeof item === "object") {
          return item.plain || item.latex || "";
        }
        return "";
      })
      .join("");
  }

  root.TrigFeedbackEngine = {
    buildFeedbackContent,
    findFeedbackRule,
    renderRuleContent,
    interpolate,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.TrigFeedbackEngine;
  }
})(typeof window !== "undefined" ? window : globalThis);
