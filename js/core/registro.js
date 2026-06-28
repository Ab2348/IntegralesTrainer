(function (root) {
  "use strict";

  const Diagnostics = root.TrigContractDiagnostics;
  const modules = {};
  let activeModuleId = "";

  function diagnostic(code, moduleApi, field) {
    return Diagnostics.diagnostic(code, moduleApi, field);
  }

  function validateModuleContract(moduleApi) {
    const source = moduleApi || {};
    const codes = [];
    if (typeof source.moduleId !== "string" || !source.moduleId) {
      codes.push("missing-moduleId");
    }
    if (typeof source.moduleName !== "string" || !source.moduleName) {
      codes.push("missing-moduleName");
    }
    if (typeof source.modelVersion !== "string" || !source.modelVersion) {
      codes.push("missing-modelVersion");
    }
    if (
      typeof source.generatorVersion !== "string" ||
      !source.generatorVersion
    ) {
      codes.push("missing-generatorVersion");
    }
    if (
      typeof source.generateExercise !== "function" &&
      !Array.isArray(source.templates) &&
      typeof source.registerTemplates !== "function"
    ) {
      codes.push("missing-moduleGenerationApi");
    }

    const diagnostics = codes.map((code) =>
      diagnostic(code, source, String(code).replace(/^missing-/, "")),
    );
    return {
      valid: !diagnostics.some((item) => item.blocking),
      diagnostics,
      warnings: diagnostics
        .filter((item) => item.severity === "warning")
        .map((item) => item.code),
      errors: diagnostics
        .filter((item) => item.severity === "error")
        .map((item) => item.code),
    };
  }

  function register(moduleApi) {
    const contract = validateModuleContract(moduleApi);
    if (!contract.valid) {
      throw new Error("El modulo matematico debe exponer moduleId.");
    }

    moduleApi.contractDiagnostics = contract.diagnostics;
    moduleApi.contractWarnings = contract.warnings;
    moduleApi.isContractComplete = contract.diagnostics.length === 0;
    modules[moduleApi.moduleId] = moduleApi;
    if (!activeModuleId) {
      activeModuleId = moduleApi.moduleId;
    }
    return moduleApi;
  }

  function get(moduleId) {
    return modules[moduleId] || null;
  }

  function getActive() {
    return get(activeModuleId);
  }

  function setActive(moduleId) {
    if (!modules[moduleId]) {
      throw new Error(`Modulo matematico desconocido: ${moduleId}`);
    }
    activeModuleId = moduleId;
    return modules[moduleId];
  }

  function list() {
    return Object.keys(modules).map((moduleId) => modules[moduleId]);
  }

  root.TrigCoreRegistry = {
    register,
    registerMathModule: register,
    validateModuleContract,
    get,
    getActive,
    setActive,
    list,
  };
})(typeof window !== "undefined" ? window : globalThis);
