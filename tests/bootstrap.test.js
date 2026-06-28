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

function createBrowserContext() {
  const writtenScripts = [];
  const context = {
    console,
    setTimeout,
    clearTimeout,
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
    "js/core/taxonomia.js",
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

function testBrowserIifeBootstrapWithoutLegacyFacade() {
  const context = createBrowserContext();
  loadCurrentBrowserBootstrapWithoutLegacyFacade(context);
  const Core = context.TrigCore;

  assert.ok(Core, "window.TrigCore no quedo disponible");
  assert.equal(Core.moduleId, "integrales-lineales");
  assert.equal(context.TrigCoreRegistry.getActive().moduleId, "integrales-lineales");
  assert.equal(typeof Core.generateExercise, "function");
  assert.equal(typeof Core.validateAnswer, "function");
  assert.equal(typeof Core.renderIntegral, "function");
  assert.equal(typeof Core.renderOption, "function");
  assert.equal(typeof Core.feedbackContent, "function");
  assert.equal(typeof Core.derivationContent, "function");
  assert.equal(typeof Core.formulaCatalog, "function");

  const exercise = Core.generateExercise(
    {
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
    [],
    () => 0.42,
  );

  assert.equal(exercise.templateId, "trig-linear-sin");
  assert.equal(exercise.options.length, 4);
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
  testBrowserIifeBootstrapWithoutLegacyFacade();
  testBrowserBootstrapRejectsLateDocumentWrite();
  console.log("Bootstrap tests passed!");
}

run();
