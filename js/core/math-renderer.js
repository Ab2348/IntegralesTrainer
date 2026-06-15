(function (root) {
  "use strict";

  const renderers = {};
  let defaultRendererId = "";
  const CONTENT_TAGS = new Set([
    "div",
    "span",
    "p",
    "strong",
    "section",
    "ol",
    "ul",
    "li",
    "em",
    "small",
  ]);
  let missingKatexWarningShown = false;

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escapeClassName(value) {
    return String(value || "")
      .split(/\s+/)
      .filter((item) => /^[a-zA-Z0-9_-]+$/.test(item))
      .join(" ");
  }

  function classAttribute(className) {
    const safe = escapeClassName(className);
    return safe ? ` class="${safe}"` : "";
  }

  function latexDisplayMode(options) {
    const settings = options || {};
    return settings.display === "block" || settings.block === true;
  }

  function fallbackLatex(source, options) {
    const settings = options || {};
    const classes = [
      "math-render-error",
      latexDisplayMode(settings) ? "math-block" : "math-inline",
    ];
    const extraClasses = escapeClassName(settings.className);
    if (extraClasses) {
      classes.push(extraClasses);
    }
    return `<span${classAttribute(classes.join(" "))}>${escapeHtml(source)}</span>`;
  }

  function renderLatex(latex, options) {
    const source = String(latex || "").trim();
    const settings = options || {};
    if (!source) {
      return "";
    }
    if (!root.katex || typeof root.katex.renderToString !== "function") {
      if (!missingKatexWarningShown && root.console && typeof root.console.warn === "function") {
        root.console.warn("KaTeX no esta disponible; se usara fallback textual.");
        missingKatexWarningShown = true;
      }
      return fallbackLatex(source, settings);
    }

    const displayMode = latexDisplayMode(settings);
    let html = "";
    try {
      html = root.katex.renderToString(source, {
        displayMode,
        throwOnError: false,
        trust: false,
        strict: "warn",
        output: "htmlAndMathml",
      });
    } catch (error) {
      if (root.console && typeof root.console.warn === "function") {
        root.console.warn("No se pudo renderizar LaTeX con KaTeX.", error);
      }
      return fallbackLatex(source, settings);
    }

    const extraClasses = escapeClassName(settings.className);
    if (!extraClasses) {
      return html;
    }
    const modeClass = displayMode ? "math-block" : "math-inline";
    return `<span class="${modeClass} ${extraClasses}">${html}</span>`;
  }

  function standardExpression(value) {
    if (typeof value === "string") {
      return { plain: value, latex: value, html: renderLatex(value) };
    }
    const source = value && typeof value === "object" ? value : {};
    const plain = source.plain || source.displayPlain || source.value || "";
    const latex = source.latex || source.displayLatex || plain;
    const html = latex ? renderLatex(latex) : escapeHtml(plain);
    return { plain, latex, html };
  }

  function math(latex, options) {
    const settings = options || {};
    return {
      type: "math",
      plain: settings.plain || "",
      latex: String(latex || ""),
      display: settings.display || "inline",
      className: settings.className || "",
    };
  }

  function inlineMath(latex, options) {
    return math(latex, { ...(options || {}), display: "inline" });
  }

  function blockMath(latex, options) {
    return math(latex, { ...(options || {}), display: "block" });
  }

  function text(value) {
    return { type: "text", text: String(value || "") };
  }

  function tag(name, className, children) {
    return {
      type: name,
      className: className || "",
      children: Array.isArray(children) ? children : [children],
    };
  }

  function fragment(children) {
    return {
      type: "fragment",
      children: Array.isArray(children) ? children : [children],
    };
  }

  function normalizeRendererArgs(rendererId, options) {
    if (rendererId && typeof rendererId === "object") {
      return { rendererId: "", options: rendererId };
    }
    return { rendererId: rendererId || "", options: options || {} };
  }

  function registerRenderer(renderer) {
    if (!renderer || typeof renderer.id !== "string" || !renderer.id) {
      throw new Error("El renderizador matematico debe exponer un id.");
    }
    renderers[renderer.id] = renderer;
    if (!defaultRendererId) {
      defaultRendererId = renderer.id;
    }
    return renderer;
  }

  function getRenderer(id) {
    return renderers[id || defaultRendererId] || null;
  }

  function callRenderer(id, hook, fallbackValue, ...args) {
    const renderer = getRenderer(id);
    if (renderer && typeof renderer[hook] === "function") {
      return renderer[hook](...args);
    }
    return fallbackValue;
  }

  function expressionForOption(option, rendererId) {
    const fallback = standardExpression({
      plain: option.displayPlain || option.displayExpression || option.value || "",
      latex: option.displayLatex || option.displayPlain || option.value || "",
    });
    const renderer = getRenderer(rendererId || option.rendererId);
    const serialized =
      renderer && typeof renderer.serializeOption === "function"
        ? renderer.serializeOption(option)
        : callRenderer(rendererId || option.rendererId, "renderOption", fallback, option);
    return standardExpression(
      serialized,
    );
  }

  function integralForExercise(exercise, rendererId) {
    const fallback = standardExpression(
      exercise.integralShown || {
        plain: exercise.integrandExpression || "",
        latex: exercise.integrandLatex || exercise.integrandExpression || "",
      },
    );
    const renderer = getRenderer(rendererId || exercise.rendererId);
    const serialized =
      renderer && typeof renderer.serializeIntegral === "function"
        ? renderer.serializeIntegral(exercise)
        : callRenderer(
            rendererId || exercise.rendererId,
            "renderIntegral",
            fallback,
            exercise,
          );
    return standardExpression(serialized);
  }

  function feedbackContent(exercise, chosen, context) {
    return callRenderer(
      exercise && exercise.rendererId,
      "renderFeedbackContent",
      [],
      exercise,
      chosen,
      context || {},
    );
  }

  function feedbackHtml(exercise, chosen, context) {
    return renderContent(feedbackContent(exercise, chosen, context));
  }

  function derivationContent(exercise) {
    return callRenderer(
      exercise && exercise.rendererId,
      "renderDerivationContent",
      [],
      exercise,
    );
  }

  function derivationHtml(exercise) {
    return renderContent(derivationContent(exercise));
  }

  function familyLabelHtml(family, rendererId) {
    const expression = callRenderer(rendererId, "renderFamilyLabel", null, family);
    if (expression) {
      return renderExpression(expression, rendererId, {
        className: "family-math-label",
      }).html;
    }
    return "";
  }

  function formulaCatalog(rendererId, context) {
    return callRenderer(rendererId, "renderFormulaCatalog", [], context || {});
  }

  function errorExampleMath(rendererId, example) {
    const args = normalizeRendererArgs(rendererId, {});
    const value = args.rendererId ? example : rendererId;
    return callRenderer(
      args.rendererId,
      "renderErrorExampleMath",
      null,
      value,
    );
  }

  function errorExampleMathHtml(rendererId, example) {
    const mathExample = errorExampleMath(rendererId, example);
    if (!mathExample) {
      return null;
    }
    return Object.keys(mathExample).reduce((result, key) => {
      result[`${key}Html`] = renderExpression(mathExample[key]).html;
      return result;
    }, {});
  }

  function renderExpression(value, rendererId, options) {
    const args = normalizeRendererArgs(rendererId, options);
    const expression = standardExpression(
      callRenderer(args.rendererId, "renderExpression", value, value),
    );
    if (args.options.className || args.options.display) {
      expression.html = expression.latex
        ? renderLatex(expression.latex, args.options)
        : escapeHtml(expression.plain);
    }
    return expression;
  }

  function renderInto(element, value, rendererId, options) {
    if (!element) {
      return null;
    }
    const expression = renderExpression(value, rendererId, options);
    element.innerHTML = expression.html;
    return expression;
  }

  function renderContent(content) {
    if (content === null || content === undefined || content === false) {
      return "";
    }
    if (typeof content === "string" || typeof content === "number") {
      return escapeHtml(content);
    }
    if (Array.isArray(content)) {
      return content.map(renderContent).join("");
    }
    if (typeof content !== "object") {
      return escapeHtml(content);
    }

    if (content.type === "text") {
      return escapeHtml(content.text);
    }
    if (content.type === "fragment") {
      return renderContent(content.children || []);
    }
    if (content.type === "math") {
      return renderLatex(content.latex || "", {
        display: content.display || "inline",
        className: content.className || "",
      });
    }
    if (content.type === "expression") {
      return renderExpression(content.expression || content, {
        display: content.display,
        className: content.className,
      }).html;
    }

    const tagName = CONTENT_TAGS.has(content.type) ? content.type : "";
    if (!tagName) {
      return escapeHtml(content.text || "");
    }
    const classes = classAttribute(content.className || "");
    return `<${tagName}${classes}>${renderContent(content.children || [])}</${tagName}>`;
  }

  function renderContentInto(element, content) {
    if (!element) {
      return "";
    }
    const html = renderContent(content);
    element.innerHTML = html;
    return html;
  }

  root.TrigMathRenderer = {
    standardExpression,
    math,
    inlineMath,
    blockMath,
    text,
    tag,
    fragment,
    renderLatex,
    renderExpression,
    renderInto,
    renderContent,
    renderContentInto,
    registerRenderer,
    getRenderer,
    expressionForOption,
    integralForExercise,
    feedbackContent,
    feedbackHtml,
    derivationContent,
    derivationHtml,
    familyLabelHtml,
    formulaCatalog,
    errorExampleMath,
    errorExampleMathHtml,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.TrigMathRenderer;
  }
})(typeof window !== "undefined" ? window : globalThis);
