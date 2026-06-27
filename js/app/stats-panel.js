(function (root) {
  "use strict";

  const App = (root.TrigTrainerApp = root.TrigTrainerApp || {});
  const Dom = App.DomUtils;

  App.createStatsPanel = function createStatsPanel({
    Core,
    els,
    stateStore,
    statsService,
  }) {
    const service =
      statsService || App.createStatsService({ Core, stateStore });
    const floatingLayers = [];

    function appendEmptyState(container, description) {
      const item = document.createElement("li");
      item.className = "empty-stat";

      const title = document.createElement("strong");
      title.className = "empty-stat-title";
      title.textContent = "Aún no hay datos";

      const copy = document.createElement("span");
      copy.className = "empty-stat-copy";
      copy.textContent = description;

      item.append(title, copy);
      container.appendChild(item);
    }

    function removeFloatingErrorTooltips() {
      while (floatingLayers.length) {
        floatingLayers.pop().cleanup();
      }
      if (!root.document) {
        return;
      }
      root.document
        .querySelectorAll('.error-tooltip[data-stats-tooltip="true"]')
        .forEach((tooltip) => tooltip.remove());
    }

    function appendTooltipRow(container, labelText, valueText, expression) {
      const row = document.createElement("div");
      row.className = "error-tooltip-row";

      const label = document.createElement("span");
      label.className = "error-tooltip-label";
      label.textContent = labelText;

      const value = document.createElement("span");
      value.className = "error-tooltip-value";
      Dom.renderMathInto(Core, value, expression, {}, valueText || "Sin datos");

      row.append(label, value);
      container.appendChild(row);
    }

    function appendErrorTooltip(item, tag) {
      const tooltip = document.createElement("div");
      const tooltipId = `error-tooltip-${tag}`;
      tooltip.className = "error-tooltip stat-error-tooltip";
      tooltip.dataset.statsTooltip = "true";
      tooltip.id = tooltipId;
      tooltip.setAttribute("role", "tooltip");

      const example = service.latestErrorExample(tag);
      if (example) {
        const math = Core.errorExampleMath
          ? Core.errorExampleMath(example)
          : null;
        appendTooltipRow(
          tooltip,
          "Ejercicio",
          example.exercisePlain,
          math
            ? math.exercise
            : Core.plainMathExpression
              ? Core.plainMathExpression(example.exercisePlain)
              : null,
        );
        appendTooltipRow(
          tooltip,
          "Elegiste",
          example.chosenPlain,
          math
            ? math.chosen
            : Core.plainMathExpression
              ? Core.plainMathExpression(example.chosenPlain)
              : null,
        );
        appendTooltipRow(
          tooltip,
          "Correcta",
          example.correctPlain,
          math
            ? math.correct
            : Core.plainMathExpression
              ? Core.plainMathExpression(example.correctPlain)
              : null,
        );
      } else {
        const fallback = document.createElement("p");
        fallback.className = "error-tooltip-empty";
        fallback.textContent = "Sin ejemplo reciente disponible";
        tooltip.appendChild(fallback);
      }

      if (root.document && root.document.body) {
        root.document.body.appendChild(tooltip);
      } else {
        item.appendChild(tooltip);
      }
      return tooltip;
    }

    function renderErrorList(errorEntries) {
      removeFloatingErrorTooltips();
      Dom.clearElement(els.errorList);
      if (!errorEntries.length) {
        appendEmptyState(
          els.errorList,
          "Resuelve ejercicios para ver tu diagnóstico personalizado.",
        );
        return;
      }

      errorEntries.forEach(([tag, value]) => {
        const item = document.createElement("li");
        item.className = "stat-error-item";

        const trigger = document.createElement("button");
        trigger.type = "button";
        trigger.className = "stat-error-trigger";

        const label = document.createElement("span");
        label.className = "stat-item-label";
        Dom.renderContentInto(
          Core,
          label,
          Core.errorLabelContent ? Core.errorLabelContent(tag) : [tag],
          tag,
        );

        const count = document.createElement("span");
        count.className = "stat-item-count";
        count.textContent = value;

        trigger.append(label, count);
        item.appendChild(trigger);
        const tooltip = appendErrorTooltip(item, tag);
        trigger.setAttribute("aria-describedby", tooltip.id);
        floatingLayers.push(
          App.createFloatingLayer({
            hoverTarget: item,
            layer: tooltip,
            trigger,
          }),
        );
        els.errorList.appendChild(item);
      });
    }

    function renderRankedList(container, entries, renderLabel) {
      Dom.clearElement(container);
      if (!entries.length) {
        appendEmptyState(
          container,
          "Resuelve ejercicios para ver las familias con más errores.",
        );
        return;
      }

      entries.forEach(([key, value]) => {
        const item = document.createElement("li");
        const label = document.createElement("span");
        label.className = "stat-item-label";
        renderLabel(label, key);

        const count = document.createElement("span");
        count.className = "stat-item-count";
        count.textContent = value;

        item.append(label, count);
        container.appendChild(item);
      });
    }

    function render() {
      const viewModel = service.getStatsViewModel();

      els.totalAnswered.textContent = viewModel.total;
      els.totalCorrect.textContent = viewModel.correct;
      els.totalIncorrect.textContent = viewModel.incorrect;
      els.accuracyRate.textContent = `${viewModel.accuracy}%`;

      renderErrorList(viewModel.errorEntries);
      renderRankedList(
        els.familyErrorList,
        viewModel.familyErrorEntries,
        (label, familyId) => {
          const family = Core.FAMILY_MAP[familyId];
          if (family) {
            Dom.renderMathInto(
              Core,
              label,
              App.UIData.familyLabelExpression(Core, family),
              { className: "family-math-label" },
              family.name,
            );
            return;
          }
          label.textContent = familyId;
        },
      );
    }

    return {
      recordAnswer: service.recordAnswer,
      render,
    };
  };
})(typeof window !== "undefined" ? window : globalThis);
