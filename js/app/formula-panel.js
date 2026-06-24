(function (root) {
  "use strict";

  const App = (root.TrigTrainerApp = root.TrigTrainerApp || {});

  App.createFormulaPanel = function createFormulaPanel({ Core, els }) {
    function clearElement(element) {
      if (element.replaceChildren) {
        element.replaceChildren();
      } else {
        element.textContent = "";
      }
    }

    function renderMathInto(element, latex, options) {
      if (Core.renderInto) {
        Core.renderInto(element, { latex }, options || {});
      } else {
        element.textContent = latex || "";
      }
    }

    function appendFormulaBlock(container, label, latex) {
      const block = document.createElement("div");
      const sectionLabel = document.createElement("span");
      sectionLabel.className = "section-label";
      sectionLabel.textContent = label;
      const formula = document.createElement("div");
      formula.className = "centered-formula";
      renderMathInto(formula, latex, { display: "block" });
      block.append(sectionLabel, formula);
      container.appendChild(block);
    }

    function render() {
      const container = els.formulaAccordion;
      if (!container) {
        return;
      }
      clearElement(container);
      Core.formulaCatalog().forEach((formula) => {
        const item = document.createElement("details");
        item.className = "formula-item";

        const summary = document.createElement("summary");
        summary.className = "formula-summary";
        renderMathInto(summary, formula.labelLatex, {
          className: "family-math-label",
        });

        const body = document.createElement("div");
        body.className = "formula-body";
        appendFormulaBlock(body, "Base", formula.baseLatex);
        appendFormulaBlock(body, "Argumento lineal", formula.linearLatex);

        const note = document.createElement("p");
        note.className = "formula-note";
        if (Core.renderContentInto) {
          Core.renderContentInto(note, [
            { type: "math", latex: "u = kx + b", display: "inline" },
            ", con ",
            { type: "math", latex: "k", display: "inline" },
            " distinto de cero.",
          ]);
        } else {
          note.textContent = "u = kx + b, con k distinto de cero.";
        }
        body.appendChild(note);

        item.append(summary, body);
        container.appendChild(item);
      });
    }

    return {
      render,
    };
  };
})(typeof window !== "undefined" ? window : globalThis);
