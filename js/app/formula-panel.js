(function (root) {
  "use strict";

  const App = (root.TrigTrainerApp = root.TrigTrainerApp || {});

  App.createFormulaPanel = function createFormulaPanel({ Core, els }) {
    function render() {
      const container = els.formulaAccordion;
      if (!container) {
        return;
      }
      container.innerHTML = "";
      Core.formulaCatalog().forEach((formula) => {
        const item = document.createElement("details");
        item.className = "formula-item";

        const summary = document.createElement("summary");
        summary.className = "formula-summary";
        summary.innerHTML = formula.labelHtml;

        const body = document.createElement("div");
        body.className = "formula-body";
        body.innerHTML = `
          <div>
            <span class="section-label">Base</span>
            <div class="centered-formula">${formula.baseHtml}</div>
          </div>
          <div>
            <span class="section-label">Argumento lineal</span>
            <div class="centered-formula">${formula.linearHtml}</div>
          </div>
          <p class="formula-note">u = kx + b, con k distinto de cero.</p>`;

        item.append(summary, body);
        container.appendChild(item);
      });
    }

    return {
      render,
    };
  };
})(typeof window !== "undefined" ? window : globalThis);
