(function (root) {
  "use strict";

  const App = (root.TrigTrainerApp = root.TrigTrainerApp || {});
  const Dom = App.DomUtils;
  const UIData = App.UIData;
  const CollapsibleView = App.CollapsibleView;

  App.createFormulaPanel = function createFormulaPanel({ Core, els }) {
    function formulaByFamilyId() {
      return Core.formulaCatalog().reduce((result, formula) => {
        result[formula.id] = formula;
        return result;
      }, {});
    }

    function appendFormulaBlock(container, labelText, latex) {
      const block = document.createElement("div");
      block.className = "formula-block";

      const label = document.createElement("span");
      label.className = "section-label";
      label.textContent = labelText;

      const formula = document.createElement("div");
      formula.className = "centered-formula";
      Dom.renderLatexInto(Core, formula, latex, { display: "block" });

      block.append(label, formula);
      container.appendChild(block);
    }

    function appendFormulaNote(container) {
      const note = document.createElement("p");
      note.className = "formula-note";
      Dom.renderContentInto(Core, note, [
        { type: "math", latex: "u = kx + b", display: "inline" },
        ", con ",
        { type: "math", latex: "k", display: "inline" },
        " distinto de cero.",
      ], "u = kx + b, con k distinto de cero.");
      container.appendChild(note);
    }

    function appendFormulaItem(container, formula, idPrefix) {
      const item = CollapsibleView.createCollapsible({
        id: `${idPrefix}-formula-family-${formula.id}`,
        title: "",
        defaultOpen: false,
        level: 4,
        className: "formula-family",
      });
      item.section.classList.add("formula-item");
      const title = item.button.querySelector(".collapsible-title");
      Dom.clearElement(title);
      Dom.renderLatexInto(Core, title, formula.labelLatex, {
        className: "family-math-label",
      });

      appendFormulaBlock(item.content, "Regla base", formula.baseLatex);
      appendFormulaBlock(item.content, "Argumento lineal", formula.linearLatex);
      appendFormulaNote(item.content);
      container.appendChild(item.section);
    }

    function appendCurrentFormula(container, formula) {
      const current = document.createElement("div");
      current.className = "current-formula";

      const label = document.createElement("div");
      label.className = "current-formula-label";
      Dom.renderLatexInto(Core, label, formula.labelLatex, {
        className: "family-math-label",
      });

      current.appendChild(label);
      appendFormulaBlock(current, "Regla base", formula.baseLatex);
      appendFormulaBlock(current, "Argumento lineal", formula.linearLatex);
      container.appendChild(current);
    }

    function openCurrentFormulaCard() {
      const panel = document.getElementById("formulaPanel");
      const trigger = panel
        ? panel.querySelector(":scope > .card-head .card-toggle")
        : null;
      const content = trigger
        ? document.getElementById(trigger.getAttribute("aria-controls"))
        : null;
      if (!trigger || !content) {
        return;
      }
      App.CollapseAnimator.setOpen(trigger, content, true);
    }

    function renderCurrentFamily(familyId) {
      const container = els.formulaAccordion;
      if (!container) {
        return;
      }
      Dom.clearElement(container);
      const formulas = formulaByFamilyId();
      const formula = formulas[familyId];
      if (!formula) {
        const empty = document.createElement("p");
        empty.className = "formula-note";
        empty.textContent =
          "La fórmula aplicable aparecerá al generar un ejercicio.";
        container.appendChild(empty);
        return;
      }
      appendCurrentFormula(container, formula);
      openCurrentFormulaCard();
    }

    function renderCatalog() {
      const container = document.getElementById("sidebarFormulaAccordion");
      if (!container) {
        return;
      }
      Dom.clearElement(container);
      const formulas = formulaByFamilyId();

      const rootSection = CollapsibleView.createStaticSection({
        id: "sidebar-formula-root",
        title: "Todas las fórmulas",
        badge: `${Core.formulaCatalog().length}`,
        level: 1,
        className: "formula-root sidebar-formula-root",
      });
      const byType = CollapsibleView.createStaticSection({
        id: "sidebar-formula-by-type",
        title: "Por tipo de integral",
        level: 2,
        className: "formula-type-root",
      });

      UIData.FAMILY_GROUPS.forEach((group) => {
        const groupSection = CollapsibleView.createCollapsible({
          id: `sidebar-formula-group-${group.id}`,
          title: group.label,
          badge: `${group.families.length}`,
          defaultOpen: false,
          level: 3,
          className: "formula-group",
        });

        group.families.forEach((familyId) => {
          if (formulas[familyId]) {
            appendFormulaItem(
              groupSection.content,
              formulas[familyId],
              "sidebar",
            );
          }
        });

        byType.content.appendChild(groupSection.section);
      });

      rootSection.content.appendChild(byType.section);
      container.appendChild(rootSection.section);
    }

    function render() {
      renderCatalog();
      renderCurrentFamily(null);
    }

    return {
      render,
      renderCatalog,
      renderCurrentFamily,
    };
  };
})(typeof window !== "undefined" ? window : globalThis);
