(function (root) {
  "use strict";

  const App = root.TrigTrainerApp;
  if (!App) {
    return;
  }

  const FAMILY_GROUPS = [
    {
      id: "basic-trig",
      label: "Trigonométricas básicas",
      families: ["sin", "cos"],
    },
    {
      id: "quotient-reciprocal",
      label: "Cocientes y recíprocas",
      families: ["tan", "cot", "sec", "csc"],
    },
    {
      id: "trig-derivatives",
      label: "Derivadas trigonométricas",
      families: ["sec2", "csc2", "secTan", "cscCot"],
    },
    {
      id: "inverse-trig",
      label: "Inversas trigonométricas",
      families: ["arctan", "arcsin", "arccos"],
    },
  ];

  const PRACTICE_TIPS = [
    {
      title: "Consejo antes de escoger",
      copy: "Una respuesta puede parecer correcta y fallar por un detalle pequeño. Antes de elegir, comprueba que el argumento se conserve y que el factor externo tenga sentido.",
    },
    {
      title: "Antes de elegir",
      copy: "No respondas solo por parecido visual. Revisa el signo, el argumento interno y el coeficiente antes de elegir una opción.",
    },
    {
      title: "Revisión rápida",
      copy: "Si dos opciones se parecen demasiado, compara primero el argumento interno y después el factor externo.",
    },
    {
      title: "Comprueba la estructura",
      copy: "Primero reconoce la familia de la integral. Después revisa el signo y el ajuste por la derivada interna.",
    },
    {
      title: "Último filtro",
      copy: "Antes de escoger, pregúntate si al derivar esa respuesta regresarías exactamente al integrando original.",
    },
    {
      title: "Detalle importante",
      copy: "Muchas respuestas incorrectas no fallan por la fórmula base, sino por olvidar compensar la derivada interna.",
    },
    {
      title: "Evita el error común",
      copy: "No basta con reconocer la función trigonométrica. En integrales con argumento lineal, el coeficiente también importa.",
    },
  ];

  let lastPracticeTipIndex = -1;

  function clearElement(element) {
    if (!element) {
      return;
    }
    if (element.replaceChildren) {
      element.replaceChildren();
    } else {
      element.textContent = "";
    }
  }

  function renderMathInto(Core, element, expression, options) {
    if (Core.renderInto) {
      Core.renderInto(element, expression, options || {});
      return;
    }
    element.textContent =
      (expression && (expression.plain || expression.latex)) || "";
  }

  function renderContentInto(Core, element, content) {
    if (Core.renderContentInto) {
      Core.renderContentInto(element, content);
      return;
    }
    element.textContent = "";
  }

  function createCollapsible({
    id,
    title,
    badge,
    defaultOpen,
    level,
    className,
  }) {
    const section = document.createElement("section");
    section.className = `collapsible ${className || ""}`.trim();
    if (level) {
      section.dataset.level = String(level);
    }

    const button = document.createElement("button");
    button.type = "button";
    button.className = "collapsible-trigger";
    button.id = `${id}-trigger`;
    button.setAttribute("aria-expanded", String(Boolean(defaultOpen)));
    button.setAttribute("aria-controls", `${id}-content`);

    const label = document.createElement("span");
    label.className = "collapsible-title";
    label.textContent = title;
    button.appendChild(label);

    if (badge) {
      const badgeNode = document.createElement("span");
      badgeNode.className = "collapsible-badge";
      badgeNode.textContent = badge;
      button.appendChild(badgeNode);
    }

    const chevron = document.createElement("span");
    chevron.className = "collapsible-chevron";
    chevron.setAttribute("aria-hidden", "true");
    chevron.textContent = "⌄";
    button.appendChild(chevron);

    const content = document.createElement("div");
    content.className = "collapsible-content";
    content.id = `${id}-content`;
    content.setAttribute("role", "region");
    content.setAttribute("aria-labelledby", button.id);
    content.hidden = !defaultOpen;

    button.addEventListener("click", () => {
      const open = button.getAttribute("aria-expanded") !== "true";
      button.setAttribute("aria-expanded", String(open));
      content.hidden = !open;
    });

    section.append(button, content);
    return { section, button, content };
  }

  function createStaticCollapsible({ id, title, badge, level, className }) {
    const section = document.createElement("section");
    section.className =
      `collapsible static-collapsible ${className || ""}`.trim();
    if (level) {
      section.dataset.level = String(level);
    }

    const header = document.createElement("div");
    header.className = "collapsible-trigger static-collapsible-header";
    header.id = `${id}-trigger`;

    const label = document.createElement("span");
    label.className = "collapsible-title";
    label.textContent = title;
    header.appendChild(label);

    if (badge) {
      const badgeNode = document.createElement("span");
      badgeNode.className = "collapsible-badge";
      badgeNode.textContent = badge;
      header.appendChild(badgeNode);
    }

    const content = document.createElement("div");
    content.className = "collapsible-content";
    content.id = `${id}-content`;

    section.append(header, content);
    return { section, header, content };
  }

  function familyLabelExpression(Core, family) {
    return Core.familyLabelExpression
      ? Core.familyLabelExpression(family)
      : {
          latex: Core.familyLabelLatex
            ? Core.familyLabelLatex(family)
            : family.name,
        };
  }

  function countBadge(activeIds, familyIds) {
    const active = familyIds.filter((id) => activeIds.includes(id)).length;
    if (active === familyIds.length) {
      return "Todas";
    }
    if (!active) {
      return "Ninguna";
    }
    return `${active}/${familyIds.length}`;
  }

  function randomPracticeTip() {
    if (!PRACTICE_TIPS.length) {
      return {
        title: "Consejo antes de escoger",
        copy: "Una respuesta puede parecer correcta y fallar por un detalle pequeño. Antes de elegir, comprueba que el argumento se conserve y que el factor externo tenga sentido.",
      };
    }

    let index = Math.floor(Math.random() * PRACTICE_TIPS.length);
    if (PRACTICE_TIPS.length > 1 && index === lastPracticeTipIndex) {
      index = (index + 1) % PRACTICE_TIPS.length;
    }

    lastPracticeTipIndex = index;
    return PRACTICE_TIPS[index];
  }

  function groupForFamily(familyId) {
    return (
      FAMILY_GROUPS.find((group) => group.families.includes(familyId)) || null
    );
  }

  function setCollapsibleOpen(id, open) {
    const trigger = document.getElementById(`${id}-trigger`);
    const content = document.getElementById(`${id}-content`);
    if (!trigger || !content) {
      return;
    }
    trigger.setAttribute("aria-expanded", String(Boolean(open)));
    content.hidden = !open;
  }

  function syncCurrentFamilyGroup(familyId) {
    const currentGroup = groupForFamily(familyId);
    setCollapsibleOpen("families-active", true);
    FAMILY_GROUPS.forEach((group) => {
      const isCurrent = Boolean(currentGroup && group.id === currentGroup.id);
      setCollapsibleOpen(`family-group-${group.id}`, isCurrent);
    });
  }

  function enhanceStaticCollapsibles() {
    document.querySelectorAll(".nav-section").forEach((section, index) => {
      const trigger = section.querySelector(".nav-item .chev")
        ? section.querySelector(".nav-item")
        : null;
      if (!trigger || trigger.dataset.stableAccordion === "true") {
        return;
      }

      const items = Array.from(
        section.querySelectorAll(".nav-sub, .sidebar-formula-catalog"),
      );
      if (!items.length) {
        return;
      }

      const content = document.createElement("div");
      const contentId = `sidebar-nav-group-${index}`;
      content.className = "nav-subgroup";
      content.id = contentId;
      items[0].before(content);
      items.forEach((item) => content.appendChild(item));

      const open = trigger.textContent.includes("Entrenar");
      content.hidden = !open;
      trigger.dataset.stableAccordion = "true";
      trigger.setAttribute("aria-expanded", String(open));
      trigger.setAttribute("aria-controls", contentId);
      trigger.addEventListener("click", () => {
        const next = trigger.getAttribute("aria-expanded") !== "true";
        trigger.setAttribute("aria-expanded", String(next));
        content.hidden = !next;
      });
    });

    document.querySelectorAll(".right-card").forEach((card, index) => {
      const head = card.querySelector(":scope > .card-head");
      if (!head || head.dataset.stableAccordion === "true") {
        return;
      }

      const children = Array.from(card.children).filter(
        (child) => child !== head,
      );
      if (!children.length) {
        return;
      }

      const content = document.createElement("div");
      const contentId = `right-card-content-${index}`;
      content.className = "right-card-content";
      content.id = contentId;
      children[0].before(content);
      children.forEach((child) => content.appendChild(child));

      const button = document.createElement("button");
      button.type = "button";
      button.className = "card-toggle";
      button.setAttribute("aria-expanded", "true");
      button.setAttribute("aria-controls", contentId);
      while (head.firstChild) {
        button.appendChild(head.firstChild);
      }

      const chevron = document.createElement("span");
      chevron.className = "collapsible-chevron";
      chevron.setAttribute("aria-hidden", "true");
      chevron.textContent = "⌄";
      button.appendChild(chevron);
      head.appendChild(button);
      head.dataset.stableAccordion = "true";

      button.addEventListener("click", () => {
        const next = button.getAttribute("aria-expanded") !== "true";
        button.setAttribute("aria-expanded", String(next));
        content.hidden = !next;
      });
    });
  }

  function bindNextExerciseProxies() {
    document
      .querySelectorAll("[data-next-exercise-proxy]")
      .forEach((button) => {
        if (button.dataset.nextExerciseBound === "true") {
          return;
        }
        button.dataset.nextExerciseBound = "true";
        button.addEventListener("click", () => {
          const target = document.getElementById("nextExerciseButton");
          if (target && target !== button) {
            target.click();
          }
        });
      });
  }

  App.createControlsPanel = function createStableVisualControlsPanel({
    Core,
    els,
    stateStore,
  }) {
    function selectedFamiliesFromDom() {
      return Array.from(
        els.familyChecklist.querySelectorAll("input[type='checkbox']:checked"),
      ).map((input) => input.value);
    }

    function renderFamilyChecklist() {
      const state = stateStore.getState();
      const activeIds = state.settings.activeFamilyIds || [];
      clearElement(els.familyChecklist);

      const rootSection = createCollapsible({
        id: "families-active",
        title: "Familias activas",
        badge: countBadge(
          activeIds,
          FAMILY_GROUPS.flatMap((group) => group.families),
        ),
        defaultOpen: true,
        level: 1,
        className: "family-root",
      });

      FAMILY_GROUPS.forEach((group) => {
        const groupSection = createCollapsible({
          id: `family-group-${group.id}`,
          title: group.label,
          badge: countBadge(activeIds, group.families),
          defaultOpen: false,
          level: 2,
          className: "family-group",
        });

        const list = document.createElement("div");
        list.className = "family-group-list";
        group.families.forEach((familyId) => {
          const family = Core.FAMILY_MAP[familyId];
          if (!family) {
            return;
          }

          const label = document.createElement("label");
          label.className = "family-check";

          const input = document.createElement("input");
          input.type = "checkbox";
          input.value = family.id;
          input.checked = activeIds.includes(family.id);
          input.addEventListener("change", () => {
            const selected = selectedFamiliesFromDom();
            stateStore.setCustomFamilies(selected);
            els.modeSelect.value = "custom";
            renderFamilyChecklist();
          });

          const span = document.createElement("span");
          span.className = "family-check-label";
          renderMathInto(Core, span, familyLabelExpression(Core, family), {
            className: "family-math-label",
          });

          label.append(input, span);
          list.appendChild(label);
        });

        groupSection.content.appendChild(list);
        rootSection.content.appendChild(groupSection.section);
      });

      els.familyChecklist.appendChild(rootSection.section);
    }

    function syncControlsFromState() {
      const state = stateStore.getState();
      if (Core.RANGE_LIMITS) {
        els.rangeMinInput.min = Core.RANGE_LIMITS.min;
        els.rangeMinInput.max = Core.RANGE_LIMITS.max;
        els.rangeMaxInput.min = Core.RANGE_LIMITS.min;
        els.rangeMaxInput.max = Core.RANGE_LIMITS.max;
      }
      els.modeSelect.value = state.settings.mode || "basic";
      els.difficultySelect.value = String(state.settings.difficulty || "1");
      els.rangeMinInput.value = state.settings.rangeMin;
      els.rangeMaxInput.value = state.settings.rangeMax;
      els.optionCountSelect.value = String(state.settings.optionCount || 4);
      renderFamilyChecklist();
    }

    function updateSettingsFromControls() {
      const settings = stateStore.updateSettings({
        mode: els.modeSelect.value,
        difficulty: els.difficultySelect.value,
        rangeMin: els.rangeMinInput.value,
        rangeMax: els.rangeMaxInput.value,
        optionCount: els.optionCountSelect.value,
        activeFamilyIds: selectedFamiliesFromDom(),
      });
      els.rangeMinInput.value = settings.rangeMin;
      els.rangeMaxInput.value = settings.rangeMax;
      return settings;
    }

    function applyModeFromControls() {
      stateStore.applyMode(els.modeSelect.value);
      renderFamilyChecklist();
    }

    function bindEvents() {
      els.modeSelect.addEventListener("change", applyModeFromControls);
      [
        els.difficultySelect,
        els.rangeMinInput,
        els.rangeMaxInput,
        els.optionCountSelect,
      ].forEach((control) => {
        control.addEventListener("change", updateSettingsFromControls);
      });
    }

    return {
      bindEvents,
      renderFamilyChecklist,
      syncControlsFromState,
      updateSettingsFromControls,
    };
  };

  App.createFormulaPanel = function createStableVisualFormulaPanel({
    Core,
    els,
  }) {
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
      renderMathInto(Core, formula, { latex }, { display: "block" });

      block.append(label, formula);
      container.appendChild(block);
    }

    function appendFormulaItem(container, formula, idPrefix) {
      const item = createCollapsible({
        id: `${idPrefix}-formula-family-${formula.id}`,
        title: "",
        defaultOpen: false,
        level: 4,
        className: "formula-family",
      });
      item.section.classList.add("formula-item");
      item.button.querySelector(".collapsible-title").textContent = "";
      renderMathInto(
        Core,
        item.button.querySelector(".collapsible-title"),
        { latex: formula.labelLatex },
        { className: "family-math-label" },
      );

      appendFormulaBlock(item.content, "Regla base", formula.baseLatex);
      appendFormulaBlock(item.content, "Argumento lineal", formula.linearLatex);

      const note = document.createElement("p");
      note.className = "formula-note";
      renderContentInto(Core, note, [
        { type: "math", latex: "u = kx + b", display: "inline" },
        ", con ",
        { type: "math", latex: "k", display: "inline" },
        " distinto de cero.",
      ]);
      item.content.appendChild(note);
      container.appendChild(item.section);
    }

    function appendCurrentFormula(container, formula) {
      const current = document.createElement("div");
      current.className = "current-formula";

      const label = document.createElement("div");
      label.className = "current-formula-label";
      renderMathInto(
        Core,
        label,
        { latex: formula.labelLatex },
        { className: "family-math-label" },
      );

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
      trigger.setAttribute("aria-expanded", "true");
      content.hidden = false;
    }

    function renderCurrentFamily(familyId) {
      const container = els.formulaAccordion;
      if (!container) {
        return;
      }
      clearElement(container);
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
      clearElement(container);
      const formulas = formulaByFamilyId();

      const root = createStaticCollapsible({
        id: "sidebar-formula-root",
        title: "Todas las fórmulas",
        badge: `${Core.formulaCatalog().length}`,
        level: 1,
        className: "formula-root sidebar-formula-root",
      });
      const byType = createStaticCollapsible({
        id: "sidebar-formula-by-type",
        title: "Por tipo de integral",
        level: 2,
        className: "formula-type-root",
      });

      FAMILY_GROUPS.forEach((group) => {
        const groupSection = createCollapsible({
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

      root.content.appendChild(byType.section);
      container.appendChild(root.section);
    }

    function render() {
      renderCatalog();
      renderCurrentFamily(null);
      root.__stableVisualFormulaPanel = { renderCurrentFamily };
    }

    return { render, renderCurrentFamily };
  };

  const originalExerciseFactory = App.createExerciseView;
  App.createExerciseView = function createStableVisualExerciseView(args) {
    const base = originalExerciseFactory(args);
    const { Core, els } = args;
    const originalAnswered = base.renderAnsweredState;
    const originalRenderExercise = base.renderExercise;

    base.renderExercise = function renderExercise(
      exercise,
      settings,
      onAnswer,
    ) {
      originalRenderExercise(exercise, settings, onAnswer);
      renderPracticeTip(exercise);
      if (exercise && exercise.family) {
        syncCurrentFamilyGroup(exercise.family.id);
        if (
          root.__stableVisualFormulaPanel &&
          typeof root.__stableVisualFormulaPanel.renderCurrentFamily ===
            "function"
        ) {
          root.__stableVisualFormulaPanel.renderCurrentFamily(
            exercise.family.id,
          );
        }
      }
    };

    function renderPracticeTip(exercise) {
      if (!exercise) {
        return;
      }

      const tip = randomPracticeTip();
      clearElement(els.feedbackZone);
      els.feedbackZone.className = "feedback-zone practice-tip";

      const title = document.createElement("p");
      title.className = "practice-tip-title";
      renderContentInto(Core, title, [tip.title]);

      const copy = document.createElement("p");
      copy.className = "practice-tip-copy";
      copy.textContent = tip.copy;

      els.feedbackZone.append(title);
      els.feedbackZone.append(copy);
    }

    function appendDiagnosticRow(container, latex) {
      const item = document.createElement("div");
      item.className = "diagnostic-value";
      renderContentInto(Core, item, [
        { type: "math", latex, display: "inline" },
      ]);
      container.appendChild(item);
    }

    function appendMathSection(container, label, latex) {
      const section = document.createElement("section");
      section.className = "diagnostic-section";
      const title = document.createElement("h3");
      title.textContent = label;
      const formula = document.createElement("div");
      formula.className = "centered-formula diagnostic-formula";
      renderMathInto(Core, formula, { latex }, { display: "block" });
      section.append(title, formula);
      container.appendChild(section);
    }

    function renderVisualFeedback(exercise, chosen, validation) {
      if (chosen && chosen.isCorrect) {
        return;
      }
      const vars = Core.feedbackVariables(exercise, chosen);
      clearElement(els.feedbackZone);
      els.feedbackZone.className =
        "feedback-zone incorrect diagnostic-feedback";

      const title = document.createElement("div");
      title.className = "feedback-title";
      const errorTag =
        (validation && validation.errorTag) ||
        (chosen && chosen.errorTag) ||
        "generic-coefficient-error";
      renderContentInto(Core, title, [
        "Incorrecto: ",
        ...(Core.errorLabelContent
          ? Core.errorLabelContent(errorTag)
          : [errorTag]),
      ]);

      const explanation = document.createElement("p");
      explanation.className = "diagnostic-copy";
      explanation.textContent =
        "La opción elegida no coincide con la familia, el signo o el factor de cadena que exige este ejercicio.";

      const values = document.createElement("div");
      values.className = "diagnostic-values";
      appendDiagnosticRow(values, `A = ${vars.ALatex}`);
      appendDiagnosticRow(values, `k = ${vars.kLatex}`);
      appendDiagnosticRow(values, `b = ${vars.bLatex}`);
      appendDiagnosticRow(values, `u = ${vars.uLatex}`);
      appendDiagnosticRow(values, `f(u) = ${vars.fULatex}`);
      appendDiagnosticRow(values, `F(u) = ${vars.FULatex}`);

      els.feedbackZone.append(title, explanation, values);
      appendMathSection(els.feedbackZone, "Regla base", vars.baseRuleLatex);
      appendMathSection(
        els.feedbackZone,
        "Regla general",
        vars.generalRuleLatex,
      );
      appendMathSection(
        els.feedbackZone,
        "Sustituyendo",
        vars.substitutionExpressionLatex,
      );
      appendMathSection(
        els.feedbackZone,
        "Resultado simplificado",
        vars.correctExpressionLatex,
      );
    }

    base.renderAnsweredState = function renderAnsweredState(
      exercise,
      chosen,
      validation,
    ) {
      originalAnswered(exercise, chosen, validation);
      renderVisualFeedback(exercise, chosen, validation);
    };

    return base;
  };

  enhanceStaticCollapsibles();
  bindNextExerciseProxies();
})(typeof window !== "undefined" ? window : globalThis);
