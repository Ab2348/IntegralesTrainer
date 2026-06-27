(function (root) {
  "use strict";

  if (typeof require === "function") {
    require("./math-renderer.js");
  }

  const MathRenderer = root.TrigMathRenderer || {};

  function mathInline(latex, plain) {
    return MathRenderer.inlineMath
      ? MathRenderer.inlineMath(latex, { plain })
      : { type: "math", latex, plain: plain || "", display: "inline" };
  }

  function mathBlock(latex, plain) {
    return MathRenderer.blockMath
      ? MathRenderer.blockMath(latex, { plain })
      : { type: "math", latex, plain: plain || "", display: "block" };
  }

  function contentNode(type, className, children) {
    return { type, className: className || "", children: children || [] };
  }

  root.TrigMathContent = {
    mathInline,
    mathBlock,
    contentNode,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.TrigMathContent;
  }
})(typeof window !== "undefined" ? window : globalThis);
