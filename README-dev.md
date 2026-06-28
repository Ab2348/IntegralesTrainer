# README para desarrollo

Este documento describe la arquitectura tecnica vigente del entrenador de integrales. La rama `Pre-V1.5_Refactor_Core` deja el core como sistema plug-and-play estricto: los modulos matematicos se registran por manifiesto, el core consume solo el modulo activo y la app no contiene logica matematica especifica.

Documentos principales:

- `docs/MAPA_FUNCIONAL_MATEMATICO_V1_5.md`: mapa funcional vigente de la arquitectura plug-and-play.
- `docs/GUIA_AGREGAR_MODULO_MATEMATICO.md`: guia operativa para agregar un modulo matematico nuevo.

## Resumen tecnico

La aplicacion es una pagina estatica sin backend. Todo se ejecuta en el navegador. No hay autenticacion, llamadas a servidor ni almacenamiento remoto. El progreso del usuario se guarda en `localStorage`.

Archivos principales:

- `index.html`: estructura HTML productiva. Carga infraestructura core, manifiesto de modulos, `core.js` y despues la capa de app.
- `core.js`: publica `window.TrigCore` usando exclusivamente `TrigCoreRegistry.getActive()`. No conoce modulos concretos.
- `js/core/modules/index.js`: manifiesto plug-and-play de modulos. Declara `MODULE_MANIFEST`, carga scripts internos en navegador buildless/IIFE y requiere `nodeEntry` en Node/CommonJS.
- `js/core/registro.js`: registra modulos matematicos y valida contrato minimo de modulo.
- `js/core/generador.js`: registra plantillas, filtra por configuracion, elige variante, inyecta seed/rng, genera ejercicios y valida instancias.
- `js/core/contratos.js`: normaliza contratos de template, variantes, parametros, restricciones, feedback, distractores, renderer y `validationMode`.
- `js/core/modelo-ejercicio.js`: normaliza el ejercicio universal. Usa defaults neutros; no inventa metodo ni familia matematica especifica.
- `js/core/parametros.js`: politica central de parametros, rango oficial `-20..20`, reglas genericas y tipos de coeficiente declarados por contrato.
- `js/core/firmas.js`: motor de firmas extensibles; usa `template.buildSignature(params, context)` cuando existe.
- `js/core/identidad-opciones.js`: identidad deterministica de opciones.
- `js/core/opciones.js`: ensamblado de opcion correcta y distractores.
- `js/core/validacion.js`: fachada central de validacion por `validationMode`. V1.5 implementa `multiple-choice`; `symbolic`, `numeric` y `hybrid` quedan como contrato futuro controlado.
- `js/core/retroalimentacion.js`: orquesta feedback desde resultados de validacion y reglas de template.
- `js/core/math-renderer.js`: frontera segura de render matematico. Recibe expresiones `plain`/`latex` y contenido estructurado; no debe recibir HTML generado por modulos.
- `js/core/math-content.js`: helpers de contenido estructurado para feedback, derivacion y mensajes matematicos.
- `js/core/taxonomia.js`: catalogo global de familias matematicas, metodos y tipos de error.
- `js/core/modules/integrales-lineales/`: modulo matematico activo de referencia.
- `js/app/`: capa de UI, estado, estadisticas, controles, render visual y manejo de respuesta.
- `tests/`: pruebas de core, estado, reproducibilidad, validacion, bootstrap, contratos y modulo lineal.

## Arquitectura V1.5 plug-and-play

La regla central es: agregar un modulo matematico nuevo no debe exigir cambios en `app.js`, `core.js`, `generador.js`, `validacion.js`, `retroalimentacion.js`, `math-renderer.js` ni UI, salvo que se agregue una capacidad global real.

El flujo productivo es:

1. `index.html` carga infraestructura core.
2. `index.html` carga `js/core/registro.js`.
3. `index.html` carga `js/core/modules/index.js`.
4. `js/core/modules/index.js` recorre `MODULE_MANIFEST` y carga los scripts de cada modulo no registrado.
5. Cada modulo registra renderer, templates y API publica en `TrigCoreRegistry`.
6. `core.js` toma `TrigCoreRegistry.getActive()` y publica `window.TrigCore`.
7. La app llama `Core.generateExercise()`, `Core.validateAnswer()`, `Core.feedbackContent()`, `Core.derivationContent()` y funciones de render sin conocer internals del modulo.

El manifiesto tiene forma declarativa:

```js
const MODULE_MANIFEST = [
  {
    moduleId: "integrales-lineales",
    basePath: "integrales-lineales/",
    scripts: [
      "familias.js",
      "errores.js",
      "variantes.js",
      "parametros.js",
      "formato.js",
      "formulas.js",
      "snapshots.js",
      "distractores.js",
      "feedback.js",
      "generacion.js",
      "derivacion.js",
      "renderer.js",
      "templates.js",
      "index.js",
    ],
    nodeEntry: "./integrales-lineales/index.js",
  },
];
```

Para agregar otro modulo, se agrega otro objeto al manifiesto y se crean los archivos propios del modulo. No se reescribe el bootstrap ni la app.

## Restriccion de bootstrap

El proyecto sigue en modo buildless/IIFE. Por eso `js/core/modules/index.js` usa `document.write()` para cargar scripts internos de modulos de forma sincrona durante el parseo inicial del documento.

Reglas obligatorias:

- No cargar `js/core/modules/index.js` con `defer`.
- No cargarlo dinamicamente despues de que `document.readyState !== "loading"`.
- No convertir el bootstrap a loader asincrono sin redisenar el orden de carga.
- No usar `import`/ES modules ni bundler dentro de esta arquitectura.

El guard de `modules/index.js` falla de forma explicita si se intenta usar tarde.

## Contrato de modulo matematico

Un modulo matematico debe exponer como minimo:

- `moduleId`
- `moduleName`
- `modelVersion`
- `generatorVersion`
- API de generacion, templates o registro de templates

El registro ocurre en `TrigCoreRegistry.register(api)`. Si falta `moduleId`, el registro es bloqueante. Los demas faltantes se reportan como diagnosticos del contrato de modulo.

Un modulo puede exponer funciones auxiliares propias, pero la app debe depender solo de la API publica publicada por `core.js`.

## Contrato de template

Una template activa debe declarar de forma explicita:

- `id`
- `name`
- `status`
- `familyId`
- `mathFamilyId`
- `methodId`
- `submethodId`
- `validationMode`
- `rendererId`
- `difficultyMin`
- `difficultyMax`
- `variants`
- `parameters`
- `restrictions`
- `commonErrors`
- `distractorStrategies`
- `feedbackRules`
- `difficultyProfile`
- `generate(context)`

`validationMode` acepta por contrato:

- `multiple-choice`
- `symbolic`
- `numeric`
- `hybrid`

V1.5 solo implementa validacion real para `multiple-choice`. Los otros modos devuelven un resultado controlado `unsupported-validation-mode` hasta que exista motor especifico.

Si `validationMode`, `rendererId` o cualquier campo estructural obligatorio falta en una template activa, el diagnostico debe ser bloqueante. No existe modo heredado ni plantilla aceptada por compatibilidad.

## Contrato de ejercicio universal

El ejercicio generado debe incluir metadata suficiente para validacion, render, feedback, estadisticas, reproducibilidad y diagnostico:

- `id`
- `modelVersion`
- `familyId`
- `mathFamilyId`
- `methodId`
- `submethodId`
- `templateId`
- `variantId`
- `difficulty`
- `validationMode`
- `rendererId`
- `integralShown`
- `correctAnswer`
- `options`
- `distractors`
- `answer`
- `generation`
- `statsInfo`
- `signature`
- `feedbackRules`

`modelo-ejercicio.js` no debe introducir valores especificos de integrales lineales. Los modulos/templates deben declarar `mathFamilyId`, `methodId` y `submethodId`.

## Politicas centrales

### Cantidad de opciones

La unica fuente de verdad es:

```js
Core.optionCountForDifficulty(difficulty)
```

Politica actual:

- niveles 1, 2 y 3: 4 opciones;
- niveles 4 y 5: 6 opciones.

No existe `optionCountSelect` en UI ni `optionCount` persistido en estado. El valor se deriva en tiempo de generacion.

### Parametros

`TrigParameterPolicy` centraliza helpers y reglas genericas:

- rango oficial `-20..20`;
- tipos declarados por contrato: `integer`, `rational`, `irrational-simple`, `symbolic`, `pi-multiple`, `sqrt`;
- reglas genericas como `fixed`, `oneOf`, `nonzero`, `free` y `nonzeroFractionResult`.

La generacion real actual sigue usando enteros. Los tipos no enteros son contrato futuro, no funcionalidad activa.

### Firmas

La firma debe ser estable con misma semilla/configuracion. El generador usa el hook opcional:

```js
template.buildSignature(params, context)
```

Si el hook no existe, se usa la firma generica PNP. No debe usarse `Date.now()` ni `Math.random()` dentro de firmas.

### IDs de opciones

Los IDs de opciones normales deben ser deterministas. Los fallback IDs pueden existir solo como defensa de integridad y deben generar warning en `Core.testTemplates()` mediante `instanceWarnings`. Las templates activas normales no deben depender de fallback IDs.

## Modulo activo de referencia

El modulo vigente es:

```text
js/core/modules/integrales-lineales/
```

Estructura:

```text
integrales-lineales/
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

Responsabilidades:

- `familias.js`: familias concretas, mapas, modos, cores de respuesta.
- `errores.js`: tags, labels y estrategias de error.
- `variantes.js`: variantes y renderer id del modulo.
- `parametros.js`: perfil de dificultad y reglas del modulo lineal.
- `formato.js`: formato plain/LaTeX, integrales, argumentos, expresiones y render basico del modulo.
- `formulas.js`: catalogo de formulas y labels matematicos.
- `snapshots.js`: snapshots compactos y reconstruccion de ejemplos de error.
- `distractores.js`: opcion correcta, distractores, IDs deterministas y deduplicacion local.
- `feedback.js`: reglas y contenido estructurado de retroalimentacion.
- `generacion.js`: parametros por dificultad y construccion del ejercicio lineal.
- `derivacion.js`: contenido de derivacion/verificacion.
- `renderer.js`: registro del renderer del modulo.
- `templates.js`: declaracion y registro de templates.
- `index.js`: ensamblador publico del modulo y registro en `TrigCoreRegistry`.

No existe `datos.js`, `TrigLinearData`, `TrigCoreModules.integralesLineales` ni `js/core/integraleslineales.js` en el flujo vigente.

## Estado y UI

`js/app/state.js` normaliza `localStorage` y deriva metodos/familias matematicas desde `Core.METHODS` y `Core.MATH_FAMILIES`. No debe hardcodear `directa` ni `trigonometrica-directa` como defaults propios del estado.

La UI no elige cantidad de opciones. Solo controla:

- modo;
- dificultad;
- rango oculto `-20..20`;
- familias activas.

## Pruebas

`npm test` ejecuta:

```text
node tests/core.test.js
node tests/state.test.js
node tests/reproducibility.test.js
node tests/validation.test.js
node tests/bootstrap.test.js
node tests/contracts.test.js
node tests/modules/integrales-lineales.test.js
```

Cobertura principal:

- API publica PNP V1.5;
- estado sin `optionCount` persistido;
- reproducibilidad con seed explicita;
- validacion por `validationMode`;
- bootstrap browser/CommonJS;
- ausencia de fachadas/alias legacy;
- contratos de templates y modulos;
- modulo lineal completo;
- no uso normal de fallback IDs;
- manifest de modulos generico.

## Reglas para tocar archivos

Al agregar un modulo matematico nuevo, se espera tocar:

- `js/core/modules/<module-id>/...`
- `js/core/modules/index.js` para agregar un objeto al manifiesto;
- tests del modulo nuevo;
- documentacion correspondiente.

No se debe tocar, salvo capacidad global real:

- `app.js`
- `core.js`
- `js/core/generador.js`
- `js/core/validacion.js`
- `js/core/retroalimentacion.js`
- `js/core/math-renderer.js`
- `js/app/*`
- SCSS/CSS/HTML visual

## Versionado interno

La infraestructura descrita corresponde a V1.5 plug-and-play. Los modulos, el modelo universal y el motor de generacion deben reportar `1.5` en metadata nueva. No se deben introducir fachadas, rutas, defaults o alias orientados al sistema anterior.
