(function (root) {
  "use strict";

  const App = (root.TrigTrainerApp = root.TrigTrainerApp || {});
  const Dom = App.DomUtils;
  const UIData = App.UIData;
  const CollapsibleView = App.CollapsibleView;

  App.createControlsPanel = function createControlsPanel({
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
      const familyGroups = UIData.getFamilyGroups(Core);
      Dom.clearElement(els.familyChecklist);

      const rootSection = CollapsibleView.createCollapsible({
        id: "families-active",
        title: "Familias activas",
        badge: UIData.countBadge(
          activeIds,
          familyGroups.flatMap((group) => group.families),
        ),
        defaultOpen: true,
        level: 1,
        className: "family-root",
      });

      familyGroups.forEach((group) => {
        const groupSection = CollapsibleView.createCollapsible({
          id: `family-group-${group.id}`,
          title: group.label,
          badge: UIData.countBadge(activeIds, group.families),
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
          Dom.renderMathInto(
            Core,
            span,
            UIData.familyLabelExpression(Core, family),
            { className: "family-math-label" },
            family.name,
          );

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
      renderFamilyChecklist();
    }

    function updateSettingsFromControls() {
      const settings = stateStore.updateSettings({
        mode: els.modeSelect.value,
        difficulty: els.difficultySelect.value,
        rangeMin: els.rangeMinInput.value,
        rangeMax: els.rangeMaxInput.value,
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

    function syncCurrentFamilyGroup(familyId) {
      const familyGroups = UIData.getFamilyGroups(Core);
      const currentGroup = UIData.groupForFamily(Core, familyId);
      CollapsibleView.setOpen("families-active", true);
      familyGroups.forEach((group) => {
        const isCurrent = Boolean(currentGroup && group.id === currentGroup.id);
        CollapsibleView.setOpen(`family-group-${group.id}`, isCurrent);
      });
    }

    function bindEvents() {
      els.modeSelect.addEventListener("change", applyModeFromControls);
      [
        els.difficultySelect,
        els.rangeMinInput,
        els.rangeMaxInput,
      ].forEach((control) => {
        control.addEventListener("change", updateSettingsFromControls);
      });
    }

    return {
      bindEvents,
      renderFamilyChecklist,
      syncControlsFromState,
      syncCurrentFamilyGroup,
      updateSettingsFromControls,
    };
  };
})(typeof window !== "undefined" ? window : globalThis);
