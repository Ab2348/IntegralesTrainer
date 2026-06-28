const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const rootDir = path.resolve(__dirname, "..");

function loadScript(context, relativePath) {
  const filename = path.join(rootDir, relativePath);
  const source = fs.readFileSync(filename, "utf8");
  vm.runInContext(source, context, { filename });
}

function readProjectFile(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), "utf8");
}

function createBrowserContext() {
  const writtenScripts = [];
  const storage = new Map();
  const context = {
    console,
    setTimeout,
    clearTimeout,
    localStorage: {
      getItem(key) {
        return storage.has(key) ? storage.get(key) : null;
      },
      setItem(key, value) {
        storage.set(key, String(value));
      },
      removeItem(key) {
        storage.delete(key);
      },
    },
    document: {
      currentScript: {
        getAttribute(name) {
          return name === "src" ? "js/core/modules/index.js" : "";
        },
      },
      readyState: "loading",
      write(markup) {
        const match = String(markup).match(/<script src="([^"]+)"><\/script>/);
        if (match) {
          writtenScripts.push(match[1]);
        }
      },
    },
    writtenScripts,
  };
  context.window = context;
  context.globalThis = context;
  return vm.createContext(context);
}

function loadCurrentBrowserBootstrapWithoutLegacyFacade(context) {
  [
    "js/core/diagnostico-contratos.js",
    "js/core/contratos.js",
    "js/core/racionales.js",
    "js/core/parametros.js",
    "js/core/identidad-opciones.js",
    "js/core/firmas.js",
    "js/core/math-renderer.js",
    "js/core/math-content.js",
    "js/core/modelo-ejercicio.js",
    "js/core/opciones.js",
    "js/core/validacion.js",
    "js/core/retroalimentacion.js",
    "js/core/generador.js",
    "js/core/registro.js",
  ].forEach((file) => loadScript(context, file));

  loadScript(context, "js/core/modules/index.js");
  context.writtenScripts.forEach((file) => loadScript(context, file));
  assert.ok(
    !context.TrigCoreModules || !context.TrigCoreModules.integralesLineales,
    "El bootstrap no debe publicar el alias legacy TrigCoreModules.integralesLineales",
  );
  loadScript(context, "core.js");
}

function testCommonJsBootstrap() {
  require("../js/core/modules/index.js");
  const Core = require("../core.js");

  assert.equal(globalThis.TrigCoreRegistry.getActive().moduleId, "integrales-lineales");
  assert.equal(Core.moduleId, "integrales-lineales");
  assert.equal(typeof Core.generateExercise, "function");
  assert.equal(typeof Core.validateAnswer, "function");
  assert.equal(typeof Core.renderIntegral, "function");
  assert.equal(typeof Core.renderOption, "function");
  assert.equal(typeof Core.feedbackContent, "function");
  assert.equal(typeof Core.derivationContent, "function");
  assert.equal(typeof Core.formulaCatalog, "function");
}

function testRemovedLegacyFilesAndAliasesStayRemoved() {
  assert.equal(
    fs.existsSync(path.join(rootDir, "js/core/integraleslineales.js")),
    false,
  );
  assert.equal(
    fs.existsSync(path.join(rootDir, "js/core/modules/integrales-lineales/datos.js")),
    false,
  );

  const Bootstrap = require("../js/core/modules/index.js");
  assert.ok(Array.isArray(Bootstrap.modules));
  assert.ok(
    Bootstrap.modules.some(
      (moduleDefinition) =>
        moduleDefinition.moduleId === "integrales-lineales",
    ),
  );
  assert.ok(!Bootstrap.moduleScripts.includes("integrales-lineales/datos.js"));
  assert.ok(
    Bootstrap.moduleScripts.every(
      (scriptPath) => !scriptPath.includes("integraleslineales"),
    ),
  );
  assert.equal(globalThis.TrigLinearData, undefined);
  assert.ok(
    !globalThis.TrigCoreModules ||
      !globalThis.TrigCoreModules.integralesLineales,
  );
}

function testBootstrapManifestMetadata() {
  const Bootstrap = require("../js/core/modules/index.js");
  const source = readProjectFile("js/core/modules/index.js");
  const linearModule = Bootstrap.modules.find(
    (moduleDefinition) => moduleDefinition.moduleId === "integrales-lineales",
  );
  const derivedScripts = Bootstrap.modules.flatMap((moduleDefinition) =>
    moduleDefinition.scripts.map(
      (scriptPath) => `${moduleDefinition.basePath}${scriptPath}`,
    ),
  );

  assert.ok(linearModule);
  assert.equal(linearModule.basePath, "integrales-lineales/");
  assert.equal(linearModule.nodeEntry, "./integrales-lineales/index.js");
  assert.deepEqual(Bootstrap.moduleScripts, derivedScripts);
  assert.ok(!Bootstrap.moduleScripts.includes("integrales-lineales/datos.js"));
  assert.ok(!source.includes("function linearModuleRegistered"));
  assert.ok(source.includes("function moduleRegistered(moduleId)"));
}

function testHtmlUsesOnlyModuleBootstrap() {
  ["index.html", "PrototiposVisuales/indexvisual.html"].forEach((file) => {
    const source = readProjectFile(file);
    assert.ok(source.includes("js/core/modules/index.js"));
    if (file === "index.html") {
      assert.ok(!source.includes("moduleSelect"));
      assert.ok(!source.includes(">Módulo<"));
      assert.ok(source.includes("changePracticeTypesButton"));
      assert.ok(source.includes("js/app/practice-runtime.js"));
      assert.ok(source.includes("js/app/practice-scope-selector.js"));
    }
    assert.ok(!source.includes("integraleslineales.js"));
    assert.ok(!source.includes("modules/integrales-lineales/"));
    assert.ok(!source.includes("optionCountSelect"));
  });
}

function testBrowserIifeBootstrapWithoutLegacyFacade() {
  const context = createBrowserContext();
  loadCurrentBrowserBootstrapWithoutLegacyFacade(context);
  const Core = context.TrigCore;
  const Bootstrap = context.TrigCoreModuleBootstrap;

  assert.ok(Core, "window.TrigCore no quedo disponible");
  assert.ok(Array.isArray(Bootstrap.modules));
  assert.deepEqual(
    Bootstrap.moduleScripts,
    Bootstrap.modules.flatMap((moduleDefinition) =>
      moduleDefinition.scripts.map(
        (scriptPath) => `${moduleDefinition.basePath}${scriptPath}`,
      ),
    ),
  );
  assert.equal(Core.moduleId, "integrales-lineales");
  assert.equal(context.TrigCoreRegistry.getActive().moduleId, "integrales-lineales");
  assert.equal(typeof Core.generateExercise, "function");
  assert.equal(typeof Core.validateAnswer, "function");
  assert.equal(typeof Core.renderIntegral, "function");
  assert.equal(typeof Core.renderOption, "function");
  assert.equal(typeof Core.feedbackContent, "function");
  assert.equal(typeof Core.derivationContent, "function");
  assert.equal(typeof Core.formulaCatalog, "function");

  const exercise = Core.generateExercise({
    settings: {
      mode: "basic",
      difficulty: "1",
      rangeMin: -20,
      rangeMax: 20,
      activeFamilyIds: ["sin"],
      activeMathFamilyIds: ["trigonometrica-directa"],
      activeMethodIds: ["directa"],
      includeExperimentalMethods: true,
      seed: "browser-bootstrap",
    },
    recentSignatures: [],
    rng: () => 0.42,
  });

  assert.equal(exercise.templateId, "trig-linear-sin");
  assert.equal(exercise.options.length, 4);
}

function testBrowserCoreIgnoresStoredModuleSelection() {
  const context = createBrowserContext();
  context.localStorage.setItem(
    "trig-integral-trainer:active-module",
    "integrales-algebraicas-lineales",
  );
  loadCurrentBrowserBootstrapWithoutLegacyFacade(context);

  assert.equal(context.TrigCore.moduleId, "integrales-lineales");
  assert.equal(
    context.TrigCoreRegistry.getActive().moduleId,
    "integrales-lineales",
  );
}

function testNoReloadBasedModuleSwitching() {
  [
    "core.js",
    "app.js",
    "js/app/controls-panel.js",
    "index.html",
  ].forEach((file) => {
    const source = readProjectFile(file);
    assert.ok(!source.includes("location.reload"));
    assert.ok(!source.includes("TrigCoreModuleSelection"));
  });
}

function testBrowserBootstrapRejectsLateDocumentWrite() {
  const context = createBrowserContext();
  context.document.readyState = "complete";

  assert.throws(
    () => loadScript(context, "js/core/modules/index.js"),
    /parseo inicial del documento/,
  );
  assert.deepEqual(context.writtenScripts, []);
}

function run() {
  testCommonJsBootstrap();
  testRemovedLegacyFilesAndAliasesStayRemoved();
  testBootstrapManifestMetadata();
  testHtmlUsesOnlyModuleBootstrap();
  testBrowserIifeBootstrapWithoutLegacyFacade();
  testBrowserCoreIgnoresStoredModuleSelection();
  testNoReloadBasedModuleSwitching();
  testBrowserBootstrapRejectsLateDocumentWrite();
  console.log("Bootstrap tests passed!");
}

run();
