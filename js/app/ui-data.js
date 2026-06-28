(function (root) {
  "use strict";

  const App = (root.TrigTrainerApp = root.TrigTrainerApp || {});

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
      copy: "No basta con reconocer la familia de la integral. En argumentos lineales, el coeficiente también importa.",
    },
  ];

  let lastPracticeTipIndex = -1;

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

  function getFamilyGroups(Core) {
    const familyMap = (Core && Core.FAMILY_MAP) || {};
    const groups = Array.isArray(Core && Core.familyGroups)
      ? Core.familyGroups
      : Array.isArray(Core && Core.FAMILY_GROUPS)
        ? Core.FAMILY_GROUPS
        : [];
    const normalized = groups
      .map((group) => ({
        id: group.id || group.label || "family-group",
        label: group.label || group.name || "Familias",
        families: Array.isArray(group.families)
          ? group.families.filter(
              (familyId, index) =>
                familyMap[familyId] &&
                group.families.indexOf(familyId) === index,
            )
          : [],
      }))
      .filter((group) => group.families.length);

    if (normalized.length) {
      return normalized;
    }

    return [
      {
        id: "all-families",
        label: "Familias",
        families: Array.isArray(Core && Core.FAMILIES)
          ? Core.FAMILIES.map((family) => family.id).filter(Boolean)
          : [],
      },
    ].filter((group) => group.families.length);
  }

  function groupForFamily(Core, familyId) {
    return (
      getFamilyGroups(Core).find((group) =>
        group.families.includes(familyId),
      ) || null
    );
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

  App.UIData = {
    PRACTICE_TIPS,
    countBadge,
    familyLabelExpression,
    getFamilyGroups,
    groupForFamily,
    randomPracticeTip,
  };
})(typeof window !== "undefined" ? window : globalThis);
