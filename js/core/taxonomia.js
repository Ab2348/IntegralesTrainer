(function (root) {
  "use strict";

  const MATH_FAMILIES = [];
  const METHODS = [];
  const ERROR_TYPES = [];

  function indexById(items) {
    return items.reduce((map, item) => {
      map[item.id] = item;
      return map;
    }, {});
  }

  const MATH_FAMILY_MAP = indexById(MATH_FAMILIES);
  const METHOD_MAP = indexById(METHODS);
  const ERROR_TYPE_MAP = indexById(ERROR_TYPES);

  function getMathFamily(id) {
    return MATH_FAMILY_MAP[id] || null;
  }

  function getMethod(id) {
    return METHOD_MAP[id] || null;
  }

  function getErrorType(id) {
    return ERROR_TYPE_MAP[id] || null;
  }

  function enabledIds(items) {
    return items.filter((item) => item.enabled).map((item) => item.id);
  }

  root.TrigExerciseTaxonomy = {
    MATH_FAMILIES,
    MATH_FAMILY_MAP,
    METHODS,
    METHOD_MAP,
    ERROR_TYPES,
    ERROR_TYPE_MAP,
    getMathFamily,
    getMethod,
    getErrorType,
    enabledMathFamilyIds: () => enabledIds(MATH_FAMILIES),
    enabledMethodIds: () => enabledIds(METHODS),
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.TrigExerciseTaxonomy;
  }
})(typeof window !== "undefined" ? window : globalThis);
