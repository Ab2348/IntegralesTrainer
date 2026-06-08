(function (root) {
  "use strict";

  const modules = {};
  let activeModuleId = "";

  function register(moduleApi) {
    if (!moduleApi || typeof moduleApi.moduleId !== "string") {
      throw new Error("El modulo matematico debe exponer moduleId.");
    }

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
    get,
    getActive,
    setActive,
    list,
  };
})(typeof window !== "undefined" ? window : globalThis);
