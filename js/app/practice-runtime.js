(function (root) {
  "use strict";

  const App = (root.TrigTrainerApp = root.TrigTrainerApp || {});

  App.createPracticeRuntime = function createPracticeRuntime(options) {
    const source = options || {};
    const registry = source.registry || root.TrigCoreRegistry;
    const generator = source.generator || root.TrigExerciseGenerator || {};
    const modules =
      registry && typeof registry.list === "function"
        ? registry.list().filter(Boolean)
        : [];
    const moduleById = modules.reduce((map, moduleApi) => {
      map[moduleApi.moduleId] = moduleApi;
      return map;
    }, {});
    const rendererOwnerById = {};
    const typeToModule = {};
    const typeById = {};
    let activeTypeIds = [];
    let activeModuleIds = [];
    let familyOwnerById = {};
    let mathFamilyOwnerById = {};
    let methodOwnerById = {};
    let errorOwnerById = {};
    let familyCollisions = [];
    let templateOwnerById = {};

    function uniqueStrings(values) {
      if (!Array.isArray(values)) {
        return [];
      }
      return values.filter(
        (value, index) =>
          typeof value === "string" &&
          value &&
          values.indexOf(value) === index,
      );
    }

    function firstAvailableModule() {
      return (
        activeModuleIds.map((moduleId) => moduleById[moduleId]).find(Boolean) ||
        modules[0] ||
        null
      );
    }

    function fallbackPracticePreview(moduleApi) {
      return (moduleApi.FAMILIES || [])
        .slice(0, 5)
        .map((family) => family.name || family.id)
        .filter(Boolean);
    }

    function normalizePracticeType(moduleApi) {
      const sourceType = moduleApi.practiceType || {};
      const id =
        typeof sourceType.id === "string" && sourceType.id
          ? sourceType.id
          : moduleApi.moduleId;
      return {
        id,
        moduleId: moduleApi.moduleId,
        title:
          sourceType.title ||
          sourceType.name ||
          moduleApi.moduleName ||
          moduleApi.moduleId,
        description:
          sourceType.description ||
          "Práctica disponible desde el módulo matemático.",
        preview: Array.isArray(sourceType.preview) && sourceType.preview.length
          ? sourceType.preview.slice()
          : fallbackPracticePreview(moduleApi),
        shortLabel:
          sourceType.shortLabel ||
          sourceType.label ||
          moduleApi.moduleName ||
          moduleApi.moduleId,
        order: Number.isFinite(Number(sourceType.order))
          ? Number(sourceType.order)
          : 100,
      };
    }

    const practiceTypes = modules
      .map((moduleApi) => {
        const type = normalizePracticeType(moduleApi);
        typeToModule[type.id] = moduleApi;
        typeById[type.id] = type;
        return type;
      })
      .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));

    modules.forEach((moduleApi) => {
      (moduleApi.listTemplates ? moduleApi.listTemplates() : []).forEach(
        (template) => {
          if (template && template.id) {
            templateOwnerById[template.id] = moduleApi;
          }
        },
      );
    });

    function normalizeTypeIds(typeIds) {
      return uniqueStrings(typeIds).filter((typeId) => typeToModule[typeId]);
    }

    function normalizeScope(scope) {
      if (Array.isArray(scope)) {
        return { typeIds: normalizeTypeIds(scope) };
      }
      if (scope && Array.isArray(scope.typeIds)) {
        return { typeIds: normalizeTypeIds(scope.typeIds) };
      }
      return { typeIds: [] };
    }

    function activeModules() {
      return activeModuleIds
        .map((moduleId) => moduleById[moduleId])
        .filter(Boolean);
    }

    function indexOwner(map, id, moduleApi, collisionList) {
      if (!id || !moduleApi) {
        return;
      }
      if (map[id] && map[id] !== moduleApi) {
        collisionList.push({
          id,
          firstModuleId: map[id].moduleId,
          nextModuleId: moduleApi.moduleId,
        });
        return;
      }
      map[id] = moduleApi;
    }

    function mapById(items) {
      return (items || []).reduce((map, item) => {
        if (item && item.id && !map[item.id]) {
          map[item.id] = item;
        }
        return map;
      }, {});
    }

    function combinedModes(selectedModules, familyIds) {
      if (selectedModules.length === 1) {
        const moduleApi = selectedModules[0];
        return {
          MODES: Array.isArray(moduleApi.MODES) ? moduleApi.MODES.slice() : [],
          MODE_FAMILIES: { ...(moduleApi.MODE_FAMILIES || {}) },
          MODE_MAP: { ...(moduleApi.MODE_MAP || {}) },
          defaultModeId: moduleApi.defaultModeId || "",
          customModeId: moduleApi.customModeId || "",
        };
      }

      const modes = familyIds.length
        ? [
            { id: "mixed", name: "Mixto" },
            { id: "custom", name: "Personalizado" },
          ]
        : [];
      return {
        MODES: modes,
        MODE_FAMILIES: {
          mixed: familyIds.slice(),
          custom: familyIds.slice(),
        },
        MODE_MAP: mapById(modes),
        defaultModeId: familyIds.length ? "mixed" : "",
        customModeId: familyIds.length ? "custom" : "",
      };
    }

    function currentTemplateMap() {
      if (generator && typeof generator.listTemplates === "function") {
        templateOwnerById = generator.listTemplates().reduce((map, template) => {
          if (template && template.id && moduleById[template.moduleId]) {
            map[template.id] = moduleById[template.moduleId];
          }
          return map;
        }, {});
      }
      return templateOwnerById;
    }

    function resolveModuleForFamily(familyId) {
      return familyOwnerById[familyId] || null;
    }

    function resolveModuleForRenderer(rendererId) {
      return rendererOwnerById[rendererId] || null;
    }

    function resolveModuleForExercise(exercise) {
      const templates = currentTemplateMap();
      if (exercise && exercise.templateId && templates[exercise.templateId]) {
        return templates[exercise.templateId];
      }
      if (
        exercise &&
        exercise.generation &&
        exercise.generation.templateId &&
        templates[exercise.generation.templateId]
      ) {
        return templates[exercise.generation.templateId];
      }
      if (exercise && exercise.familyId && familyOwnerById[exercise.familyId]) {
        return familyOwnerById[exercise.familyId];
      }
      return firstAvailableModule();
    }

    function resolveModuleForOption(option) {
      if (option && option.rendererId && rendererOwnerById[option.rendererId]) {
        return rendererOwnerById[option.rendererId];
      }
      return firstAvailableModule();
    }

    function resolveModuleForErrorTag(errorTag) {
      return errorOwnerById[errorTag] || firstAvailableModule();
    }

    function resolveModuleForExample(example) {
      if (example && example.moduleId && moduleById[example.moduleId]) {
        return moduleById[example.moduleId];
      }
      if (example && example.templateId && currentTemplateMap()[example.templateId]) {
        return currentTemplateMap()[example.templateId];
      }
      if (example && example.familyId && familyOwnerById[example.familyId]) {
        return familyOwnerById[example.familyId];
      }
      if (
        example &&
        example.exerciseMath &&
        example.exerciseMath.familyId &&
        familyOwnerById[example.exerciseMath.familyId]
      ) {
        return familyOwnerById[example.exerciseMath.familyId];
      }
      return firstAvailableModule();
    }

    function defaultRenderExpression(value) {
      if (!value) {
        return { plain: "", latex: "" };
      }
      return typeof value === "object" ? value : { plain: String(value) };
    }

    function mergeAggregate() {
      const selectedModules = activeModules();
      const familyCollisionsNext = [];
      const familyMap = {};
      const mathFamilyMap = {};
      const methodMap = {};
      const errorTypeMap = {};
      const errorLabels = {};
      const familyIds = [];
      const familyGroups = [];
      const families = [];
      const mathFamilies = [];
      const methods = [];
      const errorTypes = [];
      const errorTags = [];

      familyOwnerById = {};
      mathFamilyOwnerById = {};
      methodOwnerById = {};
      errorOwnerById = {};

      selectedModules.forEach((moduleApi) => {
        const type =
          practiceTypes.find((item) => item.moduleId === moduleApi.moduleId) ||
          normalizePracticeType(moduleApi);
        const moduleFamilyIds = [];

        (moduleApi.FAMILIES || []).forEach((family) => {
          if (!family || !family.id) {
            return;
          }
          indexOwner(familyOwnerById, family.id, moduleApi, familyCollisionsNext);
          if (!familyMap[family.id]) {
            familyMap[family.id] = family;
            families.push(family);
            familyIds.push(family.id);
            moduleFamilyIds.push(family.id);
          }
        });

        if (moduleFamilyIds.length) {
          familyGroups.push({
            id: `practice-type-${type.id}`,
            label: type.title,
            families: moduleFamilyIds,
          });
        }

        (moduleApi.MATH_FAMILIES || []).forEach((family) => {
          if (!family || !family.id || mathFamilyMap[family.id]) {
            return;
          }
          mathFamilyOwnerById[family.id] = moduleApi;
          mathFamilyMap[family.id] = family;
          mathFamilies.push(family);
        });

        (moduleApi.METHODS || []).forEach((method) => {
          if (!method || !method.id || methodMap[method.id]) {
            return;
          }
          methodOwnerById[method.id] = moduleApi;
          methodMap[method.id] = method;
          methods.push(method);
        });

        (moduleApi.ERROR_TYPES || []).forEach((errorType) => {
          if (!errorType || !errorType.id || errorTypeMap[errorType.id]) {
            return;
          }
          errorOwnerById[errorType.id] = moduleApi;
          errorTypeMap[errorType.id] = errorType;
          errorTypes.push(errorType);
        });

        (moduleApi.ERROR_TAGS || []).forEach((tag) => {
          if (tag && !errorTags.includes(tag)) {
            errorOwnerById[tag] = errorOwnerById[tag] || moduleApi;
            errorTags.push(tag);
          }
        });

        Object.entries(moduleApi.ERROR_LABELS || {}).forEach(([tag, label]) => {
          if (!Object.prototype.hasOwnProperty.call(errorLabels, tag)) {
            errorLabels[tag] = label;
            errorOwnerById[tag] = errorOwnerById[tag] || moduleApi;
          }
        });
      });

      const modeAggregate = combinedModes(selectedModules, familyIds);
      familyCollisions = familyCollisionsNext;
      if (
        familyCollisions.length &&
        typeof console !== "undefined" &&
        typeof console.warn === "function"
      ) {
        console.warn("Colisiones de familias detectadas:", familyCollisions);
      }

      Object.assign(runtime, {
        moduleId: activeModuleIds.join("+") || "practice-runtime",
        moduleName: "Práctica aleatoria",
        modelVersion: "1.5",
        generatorVersion: generator.ENGINE_VERSION || "1.5",
        RANGE_LIMITS:
          (selectedModules[0] && selectedModules[0].RANGE_LIMITS) ||
          (modules[0] && modules[0].RANGE_LIMITS) ||
          null,
        FAMILIES: families,
        FAMILY_MAP: familyMap,
        familyGroups,
        FAMILY_GROUPS: familyGroups,
        MATH_FAMILIES: mathFamilies,
        MATH_FAMILY_MAP: mathFamilyMap,
        METHODS: methods,
        METHOD_MAP: methodMap,
        ERROR_TYPES: errorTypes,
        ERROR_TYPE_MAP: errorTypeMap,
        ERROR_TAGS: errorTags,
        ERROR_LABELS: errorLabels,
        MODE_FAMILIES: modeAggregate.MODE_FAMILIES,
        MODES: modeAggregate.MODES,
        MODE_MAP: modeAggregate.MODE_MAP,
        defaultModeId: modeAggregate.defaultModeId,
        customModeId: modeAggregate.customModeId,
        familyCollisions: familyCollisions.slice(),
      });
    }

    function setPracticeScope(typeIds) {
      activeTypeIds = normalizeTypeIds(typeIds);
      activeModuleIds = activeTypeIds
        .map((typeId) => typeToModule[typeId])
        .filter(Boolean)
        .map((moduleApi) => moduleApi.moduleId);
      mergeAggregate();
      return runtime.getPracticeScope();
    }

    function hasValidScope(scope) {
      if (scope === undefined) {
        return activeTypeIds.length > 0;
      }
      return normalizeScope(scope).typeIds.length > 0;
    }

    const runtime = {
      getPracticeTypes() {
        return practiceTypes.map((type) => ({
          ...type,
          preview: type.preview.slice(),
        }));
      },
      getPracticeScope() {
        return {
          typeIds: activeTypeIds.slice(),
          moduleIds: activeModuleIds.slice(),
        };
      },
      getActiveModuleIds() {
        return activeModuleIds.slice();
      },
      hasValidScope,
      setPracticeScope,
      normalizePracticeScope(scope) {
        return normalizeScope(scope);
      },
      moduleForExercise: resolveModuleForExercise,
      moduleForFamily: resolveModuleForFamily,
      findTemplates(filters) {
        return generator.findTemplates
          ? generator.findTemplates({
              ...(filters || {}),
              moduleIds: activeModuleIds.slice(),
            })
          : [];
      },
      listTemplates() {
        const ids = new Set(activeModuleIds);
        return generator.listTemplates
          ? generator
              .listTemplates()
              .filter((template) => ids.has(template.moduleId))
          : [];
      },
      generateExercise(config) {
        if (!hasValidScope()) {
          throw new Error("Selecciona al menos un tipo de práctica.");
        }
        const sourceConfig = config || {};
        const settings = {
          ...(sourceConfig.settings || {}),
          moduleIds: activeModuleIds.slice(),
        };
        const exercise = generator.generateExercise({
          ...sourceConfig,
          settings,
          moduleIds: activeModuleIds.slice(),
        });
        if (!exercise) {
          throw new Error("No hay ejercicios disponibles para la configuración actual.");
        }
        const owner = resolveModuleForExercise(exercise);
        exercise.moduleId = exercise.moduleId || (owner && owner.moduleId) || "";
        if (exercise.statsInfo) {
          exercise.statsInfo.moduleId =
            exercise.statsInfo.moduleId || exercise.moduleId;
        }
        return exercise;
      },
      validateAnswer(exercise, optionId) {
        const owner = resolveModuleForExercise(exercise);
        return owner && owner.validateAnswer
          ? owner.validateAnswer(exercise, optionId)
          : { isValid: false, isCorrect: false, selectedOption: null };
      },
      renderIntegral(exercise) {
        const owner = resolveModuleForExercise(exercise);
        return owner && owner.renderIntegral
          ? owner.renderIntegral(exercise)
          : defaultRenderExpression(exercise && exercise.integralShown);
      },
      renderOption(option) {
        const owner = resolveModuleForOption(option);
        return owner && owner.renderOption
          ? owner.renderOption(option)
          : defaultRenderExpression(option && option.display);
      },
      feedbackContent(exercise, chosen) {
        const owner = resolveModuleForExercise(exercise);
        return owner && owner.feedbackContent
          ? owner.feedbackContent(exercise, chosen)
          : [];
      },
      derivationContent(exercise) {
        const owner = resolveModuleForExercise(exercise);
        return owner && owner.derivationContent
          ? owner.derivationContent(exercise)
          : [];
      },
      feedbackVariables(exercise, chosen) {
        const owner = resolveModuleForExercise(exercise);
        return owner && owner.feedbackVariables
          ? owner.feedbackVariables(exercise, chosen)
          : {};
      },
      errorLabelContent(errorTag) {
        const owner = resolveModuleForErrorTag(errorTag);
        return owner && owner.errorLabelContent
          ? owner.errorLabelContent(errorTag)
          : [errorTag];
      },
      familyLabelExpression(family) {
        const familyId = typeof family === "string" ? family : family && family.id;
        const owner = resolveModuleForFamily(familyId) || firstAvailableModule();
        return owner && owner.familyLabelExpression
          ? owner.familyLabelExpression(family)
          : { plain: (family && family.name) || familyId || "" };
      },
      familyLabelLatex(family) {
        const familyId = typeof family === "string" ? family : family && family.id;
        const owner = resolveModuleForFamily(familyId) || firstAvailableModule();
        return owner && owner.familyLabelLatex
          ? owner.familyLabelLatex(family)
          : (family && family.name) || familyId || "";
      },
      formulaCatalog() {
        return activeModules().flatMap((moduleApi) =>
          moduleApi.formulaCatalog ? moduleApi.formulaCatalog() : [],
        );
      },
      exerciseSnapshot(exercise) {
        const owner = resolveModuleForExercise(exercise);
        return owner && owner.exerciseSnapshot
          ? owner.exerciseSnapshot(exercise)
          : null;
      },
      optionSnapshot(option) {
        const owner = resolveModuleForOption(option);
        return owner && owner.optionSnapshot ? owner.optionSnapshot(option) : null;
      },
      errorExampleMath(example) {
        const owner = resolveModuleForExample(example);
        return owner && owner.errorExampleMath
          ? owner.errorExampleMath(example)
          : null;
      },
      optionIdentity(option) {
        const owner = resolveModuleForOption(option);
        return owner && owner.optionIdentity
          ? owner.optionIdentity(option)
          : option && (option.key || option.id);
      },
      sanitizeRange(min, max) {
        const owner = firstAvailableModule();
        return owner && owner.sanitizeRange
          ? owner.sanitizeRange(min, max)
          : { min: Number(min) || -20, max: Number(max) || 20 };
      },
      optionCountForDifficulty(difficulty) {
        const owner = firstAvailableModule();
        return owner && owner.optionCountForDifficulty
          ? owner.optionCountForDifficulty(difficulty)
          : ["4", "5"].includes(String(difficulty))
            ? 6
            : 4;
      },
      renderLatex(latex, options) {
        const owner = firstAvailableModule();
        return owner && owner.renderLatex ? owner.renderLatex(latex, options) : latex;
      },
      renderExpression(expression, options) {
        const owner = firstAvailableModule();
        return owner && owner.renderExpression
          ? owner.renderExpression(expression, options)
          : expression;
      },
      renderInto(element, expression, options) {
        const owner = firstAvailableModule();
        if (owner && owner.renderInto) {
          owner.renderInto(element, expression, options);
          return;
        }
        element.textContent =
          (expression && (expression.plain || expression.latex)) || "";
      },
      renderContent(content) {
        const owner = firstAvailableModule();
        return owner && owner.renderContent ? owner.renderContent(content) : content;
      },
      renderContentInto(element, content) {
        const owner = firstAvailableModule();
        if (owner && owner.renderContentInto) {
          owner.renderContentInto(element, content);
          return;
        }
        element.textContent = Array.isArray(content) ? content.join("") : "";
      },
      errorExampleOwner(example) {
        const owner = resolveModuleForExample(example);
        return owner ? owner.moduleId : "";
      },
    };

    modules.forEach((moduleApi) => {
      (moduleApi.findTemplates ? moduleApi.findTemplates() : []).forEach(
        (template) => {
          if (template && template.rendererId) {
            rendererOwnerById[template.rendererId] = moduleApi;
          }
        },
      );
      (moduleApi.FAMILIES || []).forEach((family) => {
        if (family && family.rendererId) {
          rendererOwnerById[family.rendererId] = moduleApi;
        }
      });
    });

    currentTemplateMap();
    mergeAggregate();
    return runtime;
  };
})(typeof window !== "undefined" ? window : globalThis);
