# Mapa funcional matematico V1.5

Este documento es la fuente vigente para la arquitectura plug-and-play de IntegralesTrainer V1.5.

## Objetivo

V1.5 separa el core de la logica matematica concreta. El core registra contratos, genera ejercicios, valida, renderiza y diagnostica. Los modulos matematicos contienen la matematica especifica.

Agregar un modulo nuevo debe requerir principalmente:

1. Crear `js/core/modules/<module-id>/`.
2. Declarar archivos internos del modulo.
3. Agregar un objeto al `MODULE_MANIFEST` en `js/core/modules/index.js`.
4. Registrar renderer, templates y API publica del modulo.
5. Agregar pruebas del modulo.

No debe requerir cambios en `app.js`, `core.js`, `js/core/generador.js`, `js/core/validacion.js`, `js/core/retroalimentacion.js`, `js/core/math-renderer.js` ni UI, salvo que se agregue una capacidad global real.

## Flujo de carga

```text
index.html
  -> infraestructura core
  -> js/core/registro.js
  -> js/core/modules/index.js
      -> MODULE_MANIFEST
      -> scripts internos de modulos
      -> TrigCoreRegistry.register(api)
  -> core.js
      -> TrigCoreRegistry.getActive()
      -> window.TrigCore
  -> js/app/*
  -> app.js
```

`core.js` no conoce modulos concretos. Solo publica el modulo activo.

## Manifiesto de modulos

`js/core/modules/index.js` contiene `MODULE_MANIFEST`:

```js
const MODULE_MANIFEST = [
  {
    moduleId: "integrales-lineales",
    basePath: "integrales-lineales/",
    scripts: ["familias.js", "errores.js", "variantes.js", "parametros.js", "formato.js", "formulas.js", "snapshots.js", "distractores.js", "feedback.js", "generacion.js", "derivacion.js", "renderer.js", "templates.js", "index.js"],
    nodeEntry: "./integrales-lineales/index.js",
  },
];
```

Para agregar otro modulo se agrega otro objeto al manifiesto. El bootstrap no debe reescribirse.

## Restriccion buildless/IIFE

El proyecto no usa bundler ni ES modules. El bootstrap de navegador usa `document.write()` durante el parseo inicial.

Reglas:

- No usar `defer` en `js/core/modules/index.js`.
- No cargarlo dinamicamente despues de `document.readyState !== "loading"`.
- No convertirlo a loader asincrono sin redisenar el orden de carga.

## Contrato de modulo

Un modulo debe exponer:

- `moduleId`
- `moduleName`
- `modelVersion`
- `generatorVersion`
- API de generacion, templates o registro de templates

El registro se hace con `TrigCoreRegistry.register(api)`. La ausencia de `moduleId` es bloqueante.

## Contrato de template

Una template activa debe declarar:

- `id`, `name`, `status`
- `familyId`, `mathFamilyId`, `methodId`, `submethodId`
- `validationMode`, `rendererId`
- `difficultyMin`, `difficultyMax`
- `variants`, `parameters`, `restrictions`
- `commonErrors`, `distractorStrategies`, `feedbackRules`
- `difficultyProfile`
- `generate(context)`

Campos utiles opcionales:

- `buildSignature(params, context)`
- `validateInstance(exercise, context)`

`validationMode` acepta `multiple-choice`, `symbolic`, `numeric` y `hybrid`. V1.5 solo implementa validacion real para `multiple-choice`. Los demas modos deben fallar de forma controlada con `unsupported-validation-mode` hasta que exista motor especifico.

## Contrato de ejercicio universal

Un ejercicio debe transportar:

- identificadores: `id`, `familyId`, `mathFamilyId`, `methodId`, `submethodId`, `templateId`, `variantId`
- configuracion: `difficulty`, `validationMode`, `rendererId`
- contenido: `integralShown`, `correctAnswer`, `options`, `distractors`
- diagnostico/reproducibilidad: `generation`, `statsInfo`, `signature`, `feedbackRules`

`modelo-ejercicio.js` usa defaults neutros. No inventa valores especificos como `directa` o `trigonometrica-directa`.

## Politicas centrales

`Core.optionCountForDifficulty(difficulty)` es la unica fuente de verdad para cantidad de opciones:

- niveles 1, 2 y 3: 4 opciones;
- niveles 4 y 5: 6 opciones.

No existe `optionCountSelect` ni `optionCount` persistido.

`TrigParameterPolicy` define rango `-20..20`, reglas genericas y tipos de coeficiente declarados por contrato: `integer`, `rational`, `irrational-simple`, `symbolic`, `pi-multiple`, `sqrt`. La generacion real actual usa enteros.

Las firmas deben ser estables con misma semilla/configuracion. Templates pueden declarar `template.buildSignature(params, context)`.

Los IDs de opciones normales deben ser deterministas. Los fallback IDs solo son defensa y deben aparecer como warnings si ocurren.

## Modulo de referencia

El modulo activo de referencia es:

```text
js/core/modules/integrales-lineales/
```

Estructura:

```text
index.js
familias.js
errores.js
variantes.js
parametros.js
formato.js
formulas.js
snapshots.js
distractores.js
feedback.js
generacion.js
derivacion.js
renderer.js
templates.js
```

No existen en la arquitectura vigente:

- `js/core/integraleslineales.js`
- `TrigCoreModules.integralesLineales`
- `js/core/modules/integrales-lineales/datos.js`
- `TrigLinearData`
- `optionCountSelect`

## Render, feedback y validacion

Los modulos no producen HTML manual. Entregan expresiones `{ plain, latex }` y contenido estructurado. `math-renderer.js` es la frontera visual.

`Core.validateAnswer()` enruta por `exercise.validationMode`. El feedback se enlaza por `errorType` y `errorTag` declarados en los distractores.

## Pruebas obligatorias

Comando principal:

```bash
npm test
```

La suite cubre core, estado, reproducibilidad, validacion, bootstrap, contratos y modulo lineal.

## Criterio PNP

El sistema es plug-and-play si:

1. `core.js` no conoce modulos concretos.
2. `index.html` no carga internals de modulos.
3. `js/core/modules/index.js` declara modulos por manifiesto.
4. Cada modulo se registra en `TrigCoreRegistry`.
5. Las templates declaran contrato completo.
6. Opciones, firmas y parametros son reproducibles con seed.
7. La validacion se enruta por `validationMode`.
8. El render central no depende de HTML generado por modulos.
9. Agregar un modulo nuevo no exige tocar la app ni el core central.
