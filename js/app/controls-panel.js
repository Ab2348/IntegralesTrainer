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
    const ACTIVE_MODULE_STORAGE_KEY =
      (root.TrigCoreModuleSelection &&
        root.TrigCoreModuleSelection.ACTIVE_MODULE_STORAGE_KEY) ||
      "trig-integral-trainer:active-module";

    function moduleOptions() {
      const registry = root.TrigCoreRegistry;
      if (!registry || typeof registry.list !== "function") {
        return [Core].filter(Boolean);
      }
      const modules = registry.list();
      return modules.length ? modules : [Core].filter(Boolean);
    }

    function renderModuleOptions() {
      if (!els.moduleSelect) {
        return;
      }
      Dom.clearElement(els.moduleSelect);
      moduleOptions().forEach((moduleApi) => {
        const option = document.createElement("option");
        option.value = moduleApi.moduleId;
        option.textContent = moduleApi.moduleName || moduleApi.moduleId;
        els.moduleSelect.appendChild(option);
      });
      els.moduleSelect.value = Core.moduleId;
    }

    function persistActiveModule(moduleId) {
      try {
        if (root.localStorage) {
          root.localStorage.setItem(ACTIVE_MODULE_STORAGE_KEY, moduleId);
        }
      } catch (error) {
        // Si localStorage no esta disponible, el fallback inmediato queda abajo.
      }
    }

    function applyModuleFromControls() {
      if (!els.moduleSelect || els.moduleSelect.value === Core.moduleId) {
        return;
      }
      persistActiveModule(els.moduleSelect.value);
      if (root.location && typeof root.location.reload === "function") {
        root.location.reload();
        return;
      }
      if (
        root.TrigCoreRegistry &&
        typeof root.TrigCoreRegistry.setActive === "function"
      ) {
        root.TrigCoreRegistry.setActive(els.moduleSelect.value);
      }
    }

    function modeOptions() {
      if (Array.isArray(Core.MODES) && Core.MODES.length) {
        return Core.MODES.filter(
          (mode) =>
            mode &&
            typeof mode.id === "string" &&
            Core.MODE_FAMILIES &&
            Array.isArray(Core.MODE_FAMILIES[mode.id]),
        );
      }
      return Object.keys(Core.MODE_FAMILIES || {}).map((modeId) => ({
        id: modeId,
        name: modeId,
      }));
    }

    function renderModeOptions(selectedMode) {
      Dom.clearElement(els.modeSelect);
      modeOptions().forEach((mode) => {
        const option = document.createElement("option");
        option.value = mode.id;
        option.textContent = mode.name || mode.label || mode.id;
        els.modeSelect.appendChild(option);
      });
      els.modeSelect.value = selectedMode;
    }

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
            const settings = stateStore.setCustomFamilies(selected);
            els.modeSelect.value = settings.mode;
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
      renderModuleOptions();
      if (Core.RANGE_LIMITS) {
        els.rangeMinInput.min = Core.RANGE_LIMITS.min;
        els.rangeMinInput.max = Core.RANGE_LIMITS.max;
        els.rangeMaxInput.min = Core.RANGE_LIMITS.min;
        els.rangeMaxInput.max = Core.RANGE_LIMITS.max;
      }
      renderModeOptions(state.settings.mode);
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
      if (els.moduleSelect) {
        els.moduleSelect.addEventListener("change", applyModuleFromControls);
      }
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
      renderModuleOptions,
      syncControlsFromState,
      syncCurrentFamilyGroup,
      updateSettingsFromControls,
    };
  };
})(typeof window !== "undefined" ? window : globalThis);
