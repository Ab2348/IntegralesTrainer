# Guia para agregar un modulo matematico

Esta guia describe como agregar un modulo matematico nuevo en la arquitectura V1.5 plug-and-play.

## Regla principal

Un modulo nuevo debe agregarse sin modificar el flujo central de la aplicacion.

No tocar salvo capacidad global real:

- `app.js`
- `core.js`
- `js/core/generador.js`
- `js/core/validacion.js`
- `js/core/retroalimentacion.js`
- `js/core/math-renderer.js`
- `js/app/*`
- HTML visual
- SCSS/CSS

Si para agregar un modulo necesitas tocar esos archivos, primero revisa si en realidad falta una capacidad global del core.

## Paso 1: crear carpeta del modulo

Crear:

```text
js/core/modules/<module-id>/
```

Estructura recomendada:

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

No todos los archivos son obligatorios, pero la separacion recomendada evita crear otro monolito.

## Paso 2: declarar familias y errores

`familias.js` debe contener familias concretas del modulo y mapas auxiliares.

Ejemplos de responsabilidades:

- `FAMILY_DEFINITIONS`
- `FAMILY_MAP`
- grupos o modos si aplican
- metadatos propios de familia

`errores.js` debe contener:

- `ERROR_TAGS`
- `ERROR_LABELS`
- estrategias de distractor
- mapas de error especificos del modulo

Cada distractor generado debe tener:

- `errorType`
- `errorTag`
- `sourceStrategy`

## Paso 3: declarar variantes y parametros

`variantes.js` debe contener las variantes que el generador puede seleccionar por dificultad.

`parametros.js` debe declarar perfil de dificultad del modulo y reglas de parametros apoyadas en `TrigParameterPolicy`.

La politica central actual permite reglas como:

- `fixed`
- `oneOf`
- `nonzero`
- `free`
- `nonzeroFractionResult`

No implementes tipos no enteros como funcionalidad real solo por estar declarados en contrato. Los tipos `rational`, `irrational-simple`, `symbolic`, `pi-multiple` y `sqrt` son capacidad futura salvo que una fase los implemente formalmente.

## Paso 4: crear formato, formulas y snapshots

`formato.js` debe encargarse de representaciones `plain` y `latex`, no de HTML manual.

`formulas.js` debe contener catalogos o reglas matematicas de apoyo.

`snapshots.js` debe contener representaciones compactas de ejercicio/opcion cuando el modulo necesite reconstruir ejemplos de error o estadisticas.

## Paso 5: crear distractores y feedback

`distractores.js` debe construir:

- opcion correcta;
- distractores;
- IDs deterministas;
- metadata de error;
- deduplicacion local si aplica.

Los IDs normales no deben depender de `Math.random()` ni `Date.now()`.

`feedback.js` debe construir contenido estructurado, no HTML. Las reglas se enlazan por `errorType`.

## Paso 6: crear generacion

`generacion.js` debe transformar parametros + contexto en un ejercicio universal.

Debe recibir y respetar:

- `seed`
- `rng`
- `attempt`
- `template`
- `variant`
- `difficulty`
- `validationMode`
- `rendererId`

El resultado debe poder pasar por `TrigExerciseModel.createUniversalExercise()` y por `TrigExerciseGenerator.validateGeneratedExercise()`.

## Paso 7: crear renderer si aplica

`renderer.js` registra hooks del modulo en `TrigMathRenderer` si el modulo necesita render especifico.

No debe producir HTML desde generacion matematica. La salida visible debe pasar por el renderer central.

## Paso 8: declarar templates

`templates.js` debe registrar templates completas.

Cada template activa debe declarar:

```js
{
  id: "...",
  name: "...",
  status: "active",
  familyId: "...",
  mathFamilyId: "...",
  methodId: "...",
  submethodId: "...",
  validationMode: "multiple-choice",
  rendererId: "...",
  difficultyMin: 1,
  difficultyMax: 5,
  variants: [],
  parameters: [],
  restrictions: [],
  commonErrors: [],
  distractorStrategies: [],
  feedbackRules: [],
  difficultyProfile: {},
  buildSignature(params, context) {},
  generate(context) {},
}
```

`validationMode` puede ser `multiple-choice`, `symbolic`, `numeric` o `hybrid`. V1.5 solo valida realmente `multiple-choice`.

## Paso 9: ensamblar index.js del modulo

`index.js` del modulo debe:

1. Requerir dependencias en Node/CommonJS.
2. Leer namespaces internos del modulo.
3. Registrar renderer.
4. Registrar templates.
5. Construir la API publica del modulo.
6. Registrar con `TrigCoreRegistry.register(api)`.
7. Exportar `module.exports = api` en Node.

Debe exponer como minimo:

- `moduleId`
- `moduleName`
- `modelVersion`
- `generatorVersion`
- `generateExercise`
- `validateAnswer`
- `renderIntegral`
- `renderOption`
- `feedbackContent`
- `derivationContent`
- `formulaCatalog`
- `listTemplates`
- `findTemplates`
- `testTemplates`
- `optionCountForDifficulty`
- `optionIdentity`
- `sanitizeRange`
- `createSeededRng`

Puede exponer mas funciones si son parte de la superficie publica del modulo.

## Paso 10: agregar el modulo al manifiesto

Editar solo `js/core/modules/index.js` y agregar otro objeto a `MODULE_MANIFEST`:

```js
{
  moduleId: "nuevo-modulo",
  basePath: "nuevo-modulo/",
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
  nodeEntry: "./nuevo-modulo/index.js",
}
```

El orden debe respetar dependencias internas del modulo.

## Paso 11: agregar pruebas

Crear pruebas propias, por ejemplo:

```text
tests/modules/<module-id>.test.js
```

Validar como minimo:

- contrato del modulo;
- templates activas completas;
- generacion smoke;
- opciones sin duplicados;
- una unica respuesta correcta;
- distractores con `errorType`, `errorTag` y `sourceStrategy`;
- feedback enlazable;
- firma estable;
- reproducibilidad con seed;
- ausencia de fallback IDs en flujo normal.

Actualizar `package.json` para incluir la prueba nueva en `npm test`.

## Checklist final

Antes de considerar listo un modulo nuevo:

- `npm test` pasa.
- `Core.testTemplates()` pasa.
- `index.html` no carga internals del modulo.
- `core.js` no conoce el modulo.
- `app.js` no cambia.
- El modulo esta en `MODULE_MANIFEST`.
- El modulo se registra en `TrigCoreRegistry`.
- Las templates declaran `validationMode` y `rendererId`.
- Los ejercicios generados tienen `signature` estable.
- Las opciones tienen IDs deterministas.
- El feedback no produce HTML manual.
- El renderer central sigue siendo la frontera visual.

## Errores comunes que deben evitarse

- Crear otro archivo monolitico dentro del modulo.
- Meter logica del modulo en `generador.js`.
- Resolver validacion especifica dentro de `app.js`.
- Agregar un selector UI para una politica que debe derivarse del core.
- Usar `Math.random()` para IDs o firmas reproducibles.
- Crear distractores sin `errorType` o sin feedback enlazable.
- Hacer que `index.html` cargue archivos internos del modulo.
- Reintroducir fachadas legacy o aliases globales fuera del registro.
