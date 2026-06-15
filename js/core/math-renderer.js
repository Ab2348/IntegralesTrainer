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

  function mathExpression(content, options) {
    const settings = options || {};
    const classes = ["math-expression"];
    if (settings.display === "inline" || settings.inline) {
      classes.push("math-inline");
    }
    if (settings.display === "block" || settings.block) {
      classes.push("math-block");
    }
    const extraClasses = escapeClassName(settings.className);
    if (extraClasses) {
      classes.push(extraClasses);
    }
    return `<span${classAttribute(classes.join(" "))}>${content}</span>`;
  }

  function mathClass(className, content) {
    return `<span class="${className}">${content}</span>`;
  }

  function normalizeLatexSource(value) {
    return String(value || "")
      .replace(/\\left/g, "")
      .replace(/\\right/g, "")
      .replace(/\\,/g, "\\thinspace ")
      .trim();
  }

  function renderLatex(latex, options) {
    const source = normalizeLatexSource(latex);
    const settings = options || {};
    let index = 0;

    function peek(length) {
      return source.slice(index, index + (length || 1));
    }

    function consume(length) {
      const value = source.slice(index, index + (length || 1));
      index += length || 1;
      return value;
    }

    function consumeCommand() {
      consume(1);
      const match = /^[a-zA-Z]+/.exec(source.slice(index));
      if (match) {
        index += match[0].length;
        return match[0];
      }
      return consume(1);
    }

    function consumeGroup() {
      while (/\s/.test(peek())) {
        consume(1);
      }
      if (peek() !== "{") {
        return consume(1);
      }
      consume(1);
      const start = index;
      let depth = 1;
      while (index < source.length && depth > 0) {
        const char = consume(1);
        if (char === "{") {
          depth += 1;
        } else if (char === "}") {
          depth -= 1;
        }
      }
      return source.slice(start, index - 1);
    }

    function renderNested(value) {
      return renderLatex(value, { bare: true });
    }

    function renderCommand(command) {
      if (command === "frac") {
        const numerator = consumeGroup();
        const denominator = consumeGroup();
        return `<span class="math-frac" aria-label="${escapeHtml(`${numerator}/${denominator}`)}"><span>${renderNested(numerator)}</span><span>${renderNested(denominator)}</span></span>`;
      }
      if (command === "sqrt") {
        const radicand = consumeGroup();
        return `<span class="math-sqrt"><span class="math-radical">&radic;</span><span class="math-radicand">${renderNested(radicand)}</span></span>`;
      }
      if (command === "int") {
        return '<span class="math-integral">&int;</span>';
      }
      if (command === "thinspace") {
        return '<span class="math-thin-space"></span>';
      }
      if (
        [
          "sin",
          "cos",
          "tan",
          "cot",
          "sec",
          "csc",
          "ln",
          "arctan",
          "arcsin",
          "arccos",
        ].includes(command)
      ) {
        return mathClass("math-func", command);
      }
      return escapeHtml(`\\${command}`);
    }

    function renderUntil(stopChar) {
      let html = "";
      while (index < source.length && (!stopChar || peek() !== stopChar)) {
        const char = peek();
        if (char === "\\") {
          html += renderCommand(consumeCommand());
          continue;
        }
        if (char === "{") {
          consume(1);
          html += renderUntil("}");
          if (peek() === "}") {
            consume(1);
          }
          continue;
        }
        if (char === "^") {
          consume(1);
          const exponent = consumeGroup();
          html += `<sup class="math-sup">${renderNested(exponent)}</sup>`;
          continue;
        }
        if (char === "(" || char === ")") {
          html += mathClass("math-paren", escapeHtml(consume(1)));
          continue;
        }
        if (char === "[" || char === "]") {
          html += mathClass("math-bracket", escapeHtml(consume(1)));
          continue;
        }
        if (char === "|") {
          html += mathClass("math-bar", consume(1));
          continue;
        }
        if (char === "+" || char === "=") {
          html += mathClass("math-op", consume(1));
          continue;
        }
        if (char === "-") {
          html += mathClass("math-op", "&minus;");
          consume(1);
          continue;
        }
        if (/\d/.test(char)) {
          const match = /^\d+/.exec(source.slice(index));
          consume(match[0].length);
          html += mathClass("math-num", match[0]);
          continue;
        }
        if (/[A-Za-z]/.test(char)) {
          const letter = consume(1);
          if (letter === "d" && /[A-Za-z]/.test(peek())) {
            html += mathClass("math-d", "d");
            continue;
          }
          html += mathClass("math-var", escapeHtml(letter));
          continue;
        }
        if (/\s/.test(char)) {
          consume(1);
          html += " ";
          continue;
        }
        html += escapeHtml(consume(1));
      }
      return html;
    }

    const html = renderUntil("");
    return settings.bare ? html : mathExpression(html, settings);
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
