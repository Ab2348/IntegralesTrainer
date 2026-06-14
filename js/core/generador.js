(function (root) {
  "use strict";

  const templates = {};

  function registerTemplate(template) {
    if (!template || typeof template.id !== "string" || !template.id) {
      throw new Error("La plantilla debe exponer un id.");
    }
    if (typeof template.generate !== "function") {
      throw new Error(`La plantilla ${template.id} debe exponer generate().`);
    }
    templates[template.id] = {
      difficultyMin: 1,
      difficultyMax: 5,
      enabled: true,
      pending: false,
      ...template,
    };
    return templates[template.id];
  }

  function listTemplates() {
    return Object.keys(templates).map((id) => templates[id]);
  }

  function templateSupportsDifficulty(template, difficulty) {
    const level = Number.parseInt(difficulty, 10) || 1;
    return (
      level >= Number(template.difficultyMin || 1) &&
      level <= Number(template.difficultyMax || 5)
    );
  }

  function findTemplates(filters) {
    const source = filters || {};
    const familyIds = Array.isArray(source.familyIds)
      ? new Set(source.familyIds)
      : null;
    const methodIds = Array.isArray(source.methodIds)
      ? new Set(source.methodIds)
      : null;
    const includePending = Boolean(source.includePending);

    return listTemplates().filter((template) => {
      if (!template.enabled || (template.pending && !includePending)) {
        return false;
      }
      if (familyIds && !familyIds.has(template.familyId)) {
        return false;
      }
      if (methodIds && !methodIds.has(template.methodId)) {
        return false;
      }
      return templateSupportsDifficulty(template, source.difficulty);
    });
  }

  function choose(items, rng) {
    const random = rng || Math.random;
    return items[Math.floor(random() * items.length)];
  }

  function generateExercise(config) {
    const source = config || {};
    const random = source.rng || Math.random;
    const recent = new Set(
      Array.isArray(source.recentSignatures) ? source.recentSignatures : [],
    );
    const candidates = findTemplates({
      familyIds: source.familyIds,
      methodIds: source.methodIds,
      difficulty: source.settings && source.settings.difficulty,
      includePending:
        source.settings && source.settings.includePendingMethods,
    });

    if (!candidates.length) {
      return source.fallback ? source.fallback() : null;
    }

    for (let attempt = 0; attempt < 300; attempt += 1) {
      const template = choose(candidates, random);
      const exercise = template.generate({
        settings: source.settings || {},
        range: source.range,
        optionCount: source.optionCount,
        rng: random,
        template,
      });
      if (!exercise) {
        continue;
      }
      if (recent.has(exercise.signature) && attempt < 250) {
        continue;
      }
      return exercise;
    }

    throw new Error(
      "No se pudo generar un ejercicio unico con la configuracion actual.",
    );
  }

  root.TrigExerciseGenerator = {
    registerTemplate,
    listTemplates,
    findTemplates,
    generateExercise,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.TrigExerciseGenerator;
  }
})(typeof window !== "undefined" ? window : globalThis);
