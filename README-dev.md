# README para desarrollo

Este documento describe el funcionamiento interno del entrenador de integrales trigonométricas. Está pensado para personas que quieran mantener, auditar o extender la página.

Para el contrato matemático plug-and-play de V1.4, ver tambien `docs/MAPA_FUNCIONAL_MATEMATICO_V1_4.md`.

## Resumen técnico

La aplicación es una página estática sin backend. Todo se ejecuta en el navegador:

- `index.html` define la estructura de la interfaz.
- `src/styles/main.scss` es el punto de entrada de estilos SCSS.
- `src/styles/` contiene los parciales SCSS separados por abstracts, base, layout, components, features y utilities.
- `styles.css` es el CSS de salida que carga `index.html`.
- `js/core/taxonomia.js` define familias matemáticas, métodos y tipos de error de la arquitectura v1.3.
- `js/core/parametros.js` define la política central de coeficientes y el rango oficial `-20..20`.
- `js/core/identidad-opciones.js` centraliza la identidad y los IDs determinísticos de opciones.
- `js/core/firmas.js` prepara firmas extensibles por plantilla.
- `js/core/diagnostico-contratos.js` clasifica diagnósticos de contratos por severidad.
- `js/core/contratos.js` normaliza los contratos de plantilla, variante, dificultad, parámetros, restricciones, feedback y distractores.
- `js/core/math-renderer.js` registra renderizadores matemáticos, normaliza expresiones `plain`/`latex` y renderiza el contenido visual.
- `js/core/modelo-ejercicio.js` normaliza el contrato universal de ejercicio.
- `js/core/opciones.js` construye conjuntos de opción correcta y distractores.
- `js/core/validacion.js` centraliza la validación de opción múltiple.
- `js/core/retroalimentacion.js` orquesta la retroalimentación desde el resultado de validación.
- `js/core/generador.js` registra plantillas, selecciona variantes, genera ejercicios con semilla y valida instancias.
- `js/core/registro.js` registra módulos matemáticos disponibles.
- `js/core/modules/integrales-lineales/index.js` implementa el módulo matemático de integrales trigonométricas lineales, registra sus plantillas, variantes, restricciones, reglas y renderizador.
- `js/core/integraleslineales.js` es una fachada legacy de compatibilidad hacia el módulo anterior; no participa en el arranque normal de producción.
- `core.js` publica la API compatible `window.TrigCore` usando el módulo matemático activo.
- `js/app/state.js` maneja `localStorage`, normalización y validaciones de estado.
- `js/app/controls-panel.js` maneja el panel izquierdo de configuración.
- `js/app/exercise-view.js` renderiza ejercicio, opciones, feedback visual y derivación.
- `js/app/answer.js` procesa la opción elegida y coordina feedback/estadísticas.
- `js/app/stats-panel.js` actualiza estadísticas, errores y ejemplos recientes.
- `js/app/formula-panel.js` renderiza el formulario del panel derecho.
- `app.js` funciona como orquestador de arranque y flujo general.
- `tests/` contiene pruebas manuales/de núcleo para validar casos matemáticos.

No hay llamadas a servidor, cookies, autenticación ni almacenamiento remoto. El progreso del usuario se guarda localmente en el navegador mediante `localStorage`.

## Arquitectura v1.3

La versión 1.3 separa el núcleo del entrenador en capas para que las integrales trigonométricas actuales sean solo el primer conjunto de plantillas registradas.

El contrato universal de un ejercicio incluye:

- identificador, familia concreta y familia matemática;
- método, submétodo, plantilla, variante y dificultad;
- integral mostrada, respuesta correcta, opciones y distractores;
- tipo de error por distractor;
- metadatos de generación y datos para estadísticas.

La generación estándar queda así:

1. La app lee la configuración.
2. `js/core/generador.js` filtra plantillas por familia concreta, familia matemática, método y dificultad.
3. La plantilla trigonométrica registrada por `js/core/modules/integrales-lineales/index.js` crea una instancia matemática.
4. `js/core/opciones.js` arma opción correcta y distractores tipados.
5. `js/core/modelo-ejercicio.js` normaliza la instancia al modelo universal.
6. `js/core/validacion.js` valida la opción elegida.
7. La capa de render matemático expone integral, opciones, feedback y derivación en formato visual.
8. `stats-panel.js` registra familia, método, submétodo, dificultad, plantilla y tipo de error.

Para agregar una familia futura, la ruta esperada es registrar nuevas plantillas compatibles con `js/core/generador.js`, no modificar el flujo principal de `app.js`.

## Arquitectura v1.4

La versión 1.4 convierte los contratos de v1.3 en un motor real de plantillas paramétricas. El modelo universal de ejercicio usa `modelVersion: "1.4"` y la generación agrega metadatos de motor con `generation.engineVersion: "1.4"`.

El objetivo de v1.4 es que el núcleo pueda construir ejercicios distintos, válidos, controlados y reproducibles sin añadir lógica nueva en `app.js` cada vez que aparezca una familia matemática.

El motor v1.4 aporta:

- generación por plantillas registradas;
- selección de variantes por dificultad;
- generación reproducible mediante `seed`;
- RNG determinístico interno con `createSeededRng(seed)`;
- política central de cantidad de opciones por dificultad: niveles 1, 2 y 3 usan 4 opciones; niveles 4 y 5 usan 6 opciones;
- política central de coeficientes enteros inmediatos en `-20..20`, con contrato preparado para tipos no enteros futuros;
- límite de intentos por generación;
- validación central de instancias generadas;
- descarte de ejercicios inválidos;
- diagnóstico interno con `Core.testTemplates()`;
- parámetros y restricciones normalizados desde `TemplateModel`;
- distractores con `errorType`, `errorTag` y `sourceStrategy`;
- metadatos suficientes para depuración y reconstrucción básica.

La generación v1.4 mantiene esta separación:

1. `generador.js` filtra plantillas por familia, familia matemática, método, estado y dificultad.
2. `generador.js` elige una variante compatible con la dificultad solicitada.
3. La plantilla genera parámetros seguros usando el RNG recibido.
4. La plantilla construye integral, respuesta correcta y distractores.
5. `modelo-ejercicio.js` conserva el contrato universal y agrega `generation` y `answer`.
6. `generador.js` valida que la instancia tenga integral, respuesta correcta única, opciones no duplicadas, distractores tipados y dificultad compatible.
7. La app entrega expresiones y contenido estructurado al renderer central: `Core.renderIntegral()`, `Core.renderOption()`, `Core.feedbackContent()`, `Core.derivationContent()` y `Core.renderContentInto()`.

Las integrales trigonométricas directas ya están migradas a este motor. Cada familia actual (`sin`, `cos`, `tan`, `cot`, `sec`, `csc`, etc.) se registra como plantilla `trig-linear-<familia>` y declara variantes para los niveles de dificultad:

- `lineal`
- `directa-unitaria`
- `cadena-simple`
- `coeficiente-externo`
- `desplazada`
- `coeficiente-fraccionario`

Estas variantes no cambian todavía el render visual de la app; controlan el perfil de parámetros para que el motor pueda decidir con más intención qué tipo de ejercicio construir.

### Cierre técnico de v1.4

Antes de iniciar v1.5, el núcleo debe considerarse estable bajo estas condiciones:

- Toda plantilla registrada debe declarar familia, familia matemática, método, submétodo, dificultad, variantes, parámetros, restricciones, constructores de respuesta correcta y distractores, errores típicos y `feedbackRules`.
- `registerTemplate()` normaliza el contrato y adjunta `contractWarnings`. Si una plantilla activa queda incompleta, el generador la reporta como inválida durante validación/diagnóstico.
- Cada distractor debe tener `errorType` distinto de `unknown` y debe existir una regla de feedback enlazable para ese `errorType`.
- El feedback común se resuelve por `feedbackRules`; las plantillas o métodos pueden declarar sus propios mensajes sin modificar `generador.js` ni `retroalimentacion.js`.
- La variante `lineal` es fallback. Cuando existe una variante específica compatible con la dificultad, el motor la prefiere y `variantId` representa el tipo real generado.
- `validateAnswer()` devuelve opción elegida, distractor elegido, `errorType`, familia, familia matemática, método, submétodo, plantilla, variante y dificultad.
- Las estadísticas internas guardan conteos por método, submétodo, plantilla y variante, además de errores por esos mismos ejes. La UI no muestra todo todavía.
- El generador sigue filtrando por familia, familia matemática, método y dificultad, usa semilla reproducible y conserva límite de intentos.
- `math-renderer.js` permanece desacoplado: recibe expresiones `plain`/`latex` y contenido estructurado; es la unica capa que convierte matemáticas a HTML visible.
- El estado interno puede conservar familias matemáticas, métodos activos, plantillas deshabilitadas e inclusión de plantillas pendientes/experimentales, aunque la UI visual completa llegue en v1.5.

Con estos puntos cerrados, v1.5 debe enfocarse en contenido: nuevas familias, nuevas plantillas, distractores, mensajes específicos, configuración visual, estadísticas visibles por método y fórmulas auxiliares.

## Contratos del núcleo

### Representación matemática estándar

Las expresiones matemáticas deben poder viajar con esta forma:

```js
{
  plain: "int 2 sin(3x - 1) dx",
  latex: "\\int 2\\sin\\left(3x - 1\\right)\\,dx"
}
```

`plain` sirve para estadísticas, ejemplos y depuración. `latex` es la representación matemática normalizada y la fuente primaria para la presentación visual. El HTML no debe nacer en las familias/generadores: se deriva en `math-renderer.js`.

Las opciones conservan compatibilidad con `displayExpression`, pero el contrato nuevo no almacena HTML visual:

```js
{
  id: "opt-...",
  value: "...",
  displayPlain: "...",
  displayLatex: "...",
  isCorrect: false,
  errorType: "wrong-family",
  errorTag: "wrong-family",
  sourceStrategy: "wrong-family",
  explanation: "",
  metadata: {}
}
```

`exercise.correctAnswer` debe apuntar a la misma entidad lógica que la opción correcta dentro de `exercise.options`.

### TemplateModel

Las plantillas se registran con `Core.registerTemplate()` o directamente desde el módulo matemático. `js/core/contratos.js` normaliza la forma:

```js
{
  id,
  name,
  status,
  familyId,
  mathFamilyId,
  methodId,
  submethodId,
  difficultyMin,
  difficultyMax,
  tags,
  parameters,
  restrictions,
  variants,
  commonErrors,
  distractorStrategies,
  difficultyProfile,
  buildIntegral,
  buildCorrectAnswer,
  buildDistractors,
  buildExplanation,
  validateInstance,
  generate
}
```

Estados válidos de plantilla:

- `active`
- `experimental`
- `disabled`
- `pending`

`parameters` puede usar strings simples por compatibilidad, pero v1.4 prefiere objetos estructurados:

```js
{
  id: "k",
  name: "Coeficiente interno",
  type: "integer",
  range: { min: -20, max: 20 },
  prohibited: [0],
  restrictions: ["k != 0"],
  required: true
}
```

`restrictions` también puede usar strings, aunque la forma preferida es:

```js
{
  id: "non-zero-inner-coefficient",
  description: "k no puede ser cero.",
  severity: "error"
}
```

El generador principal filtra, elige variante, inyecta `seed`/`rng`, valida y descarta instancias inválidas. Una plantilla nueva no debe requerir cambios en `app.js`.

Una plantilla completa debe incluir `feedbackRules`. Cada regla se enlaza por `errorType`:

```js
{
  id: "basic-missing-coefficient",
  errorType: "forgot-chain-factor",
  errorTag: "forgot-chain-factor",
  title: "Incorrecto: Factor de cadena olvidado",
  message: ["Revisa la derivada interna de ", { var: "uMath" }, "."],
  hint: "",
  details(context) {
    return [];
  }
}
```

Los mensajes pueden usar texto y referencias de contenido, por ejemplo `{ var: "uMath" }` o `{ var: "correctExpressionMath" }`. Las variables disponibles dependen de cada módulo o plantilla y el render visual final siempre pasa por `MathRenderer`.

### VariantModel

Cada plantilla puede declarar variantes. La variante mínima es:

```js
{
  id,
  name,
  description,
  appliesToTemplate,
  status,
  difficultyMin,
  difficultyMax,
  difficultyModifier,
  parameterOverrides,
  renderHints,
  tags
}
```

En v1.4 las variantes ya se usan para las trigonométricas lineales. Por ejemplo, `coeficiente-fraccionario` aplica en dificultad 5 y fuerza el perfil de parámetros que busca una respuesta con coeficiente fraccionario.

### DifficultyModel

La dificultad se describe con `difficultyProfile`, no con condicionales sueltos fuera de la familia responsable. Las trigonométricas actuales mantienen niveles `1` a `5`, pero el perfil queda declarado en la plantilla para que otras familias puedan definir sus propias reglas.

### FeedbackModel y DistractorModel

La retroalimentación y los distractores se tipan por `errorType`/`errorTag`. Un distractor debe indicar al menos:

```js
{
  id,
  value,
  display,
  errorType,
  errorTag,
  sourceStrategy,
  explanation,
  metadata
}
```

Las plantillas declaran sus `distractorStrategies`, aunque la lógica concreta de construcción siga dentro del módulo matemático correspondiente.

## Mapa de estilos SCSS

Los estilos fuente viven en `src/styles/`. El archivo `styles.css` es la salida compilada que carga `index.html`; para mantenimiento conviene ubicar el cambio en el parcial SCSS correspondiente y recompilar.

### `src/styles/main.scss`

Punto de entrada de SCSS. Solo importa los parciales en orden: abstracts, base, layout, components, features y utilities. Si se agrega una carpeta o parcial nuevo, normalmente se registra aquí.

### `src/styles/abstracts/`

Define valores y helpers compartidos. No genera componentes visuales por sí misma.

- `_tokens.scss`: variables CSS globales en `:root`, como colores, radios, sombras, fuente matemática y fuente base.
- `_breakpoints.scss`: breakpoints Sass reutilizables (`$desktop-narrow` y `$mobile`).
- `_mixins.scss`: mixin `media-max()` para media queries con `max-width`.

### `src/styles/base/`

Estilos globales de navegador, documento y texto base.

- `_reset.scss`: normalización mínima de `box-sizing`, márgenes, fuentes heredadas en controles y cursor de botones.
- `_global.scss`: estilo general de `body`, fondo de la app y contorno de foco accesible con `:focus-visible`.
- `_typography.scss`: estilos de `h1`, `h2`, `h3`, `dt`, `dd`, `label`, `legend`, `.eyebrow`, `.section-label` y `.option-index`.

### `src/styles/layout/`

Estructura principal de la página: contenedor, encabezado, grid y paneles.

- `_app-shell.scss`: ancho máximo, centrado y padding del contenedor `.app-shell`; ajusta ancho en móvil.
- `_topbar.scss`: distribución del encabezado `.topbar`, separación inferior y cambio a columna en móvil.
- `_workspace.scss`: grid principal `.workspace`; define columnas para controles, práctica, estadísticas y formulario, con reacomodo responsive.
- `_panels.scss`: aspecto compartido de `.controls`, `.practice`, `.stats` y `.formula-sidebar`; sticky panels, padding, sombras, altura del formulario y `.panel-title`.

### `src/styles/components/`

Piezas reutilizables que aparecen en varias zonas o no pertenecen a una feature específica.

- `_buttons.scss`: estilos base de `.primary-button`, `.secondary-button`, `.quiet-button` y `.option-button`; hover y jerarquías visuales de botones.
- `_forms.scss`: apariencia compartida de `select` e `input`, incluidos hover y focus.
- `_lists.scss`: listas compactas `.compact-list`, elementos de estadísticas, estados vacíos y estructura de `.stat-error-item`.
- `_status-pill.scss`: etiqueta tipo píldora `.status-pill`, usada para mostrar el nivel de dificultad.
- `_tooltips.scss`: interacción y contenido del tooltip de errores en estadísticas: `.stat-error-trigger`, `.error-tooltip` y sus filas/valores.

### `src/styles/features/trainer/`

Estilos específicos del entrenador de integrales trigonométricas.

- `_controls.scss`: panel de configuración: `.control-block`, `.control-row`, fieldset/lista de familias y checkboxes con etiquetas matemáticas.
- `_exercise.scss`: encabezado del ejercicio, caja `.exercise-display` y tamaño de `.math-display` para la integral actual.
- `_options.scss`: grid de respuestas `.option-grid`, botones de opción y estados `.is-selected`, `.is-correct`, `.is-incorrect`.
- `_feedback.scss`: zona de retroalimentación `.feedback-zone`, variantes correcta/incorrecta, valores comparados, reglas, reconstrucción y fórmulas centradas.
- `_derivation.scss`: apariencia específica de `.derivation-zone`, donde se muestra la verificación por derivada.
- `_stats.scss`: tarjetas y listas del panel de estadísticas: `.stat-grid`, `.stat-list-block`, etiquetas y contadores.
- `_formula-sidebar.scss`: panel lateral de formulario: acordeón, items, summary, cuerpo, animación de apertura, scroll interno y notas.

### `src/styles/features/math/`

Renderizado visual de expresiones matemáticas generadas por JavaScript.

- `_math-renderer.scss`: clases `.math-expression`, `.math-inline`, `.math-integral`, `.math-frac`, `.math-sqrt`, `.math-func`, `.math-var`, operadores, signos, paréntesis, barras, exponentes y espaciado fino. Es el lugar a revisar si una fórmula se ve mal aunque el HTML matemático sea correcto.

### `src/styles/utilities/`

Utilidades pequeñas y globales.

- `_hidden.scss`: clase `.hidden` para ocultar elementos de forma forzada.
- `_animations.scss`: keyframe `formula-open`, usado por el acordeón del formulario.

## Flujo general

Al cargar la página:

1. `index.html` carga taxonomía, contratos, políticas centrales, modelo, opciones, validación, retroalimentación y generador.
2. `index.html` carga `js/core/registro.js`.
3. `index.html` carga `js/core/modules/index.js`.
4. El bootstrap de módulos carga y registra `integrales-lineales`.
5. `index.html` carga `core.js`.
6. `core.js` publica la API activa en `window.TrigCore` desde `TrigCoreRegistry.getActive()`.
7. `index.html` carga los módulos de `js/app/`.
8. `index.html` carga `app.js`.
9. `app.js` crea los módulos, lee el estado local y sincroniza los controles.
10. Se genera el primer ejercicio con `Core.generateExercise`.
11. La respuesta del usuario pasa por `Core.validateAnswer`, actualiza estadísticas y guarda el estado.

El flujo principal queda distribuido así:

- `state.js`: `loadState()`, `mergeState()`, `saveState()`.
- `controls-panel.js`: `syncControlsFromState()`, `updateSettingsFromControls()`.
- `app.js`: `generateNextExercise()` y eventos globales.
- `answer.js`: `answer(optionId)`.
- `stats-panel.js`: `recordAnswer()` y `render()`.

## Estado local

La llave de almacenamiento es:

```js
trig-integral-trainer:v1
```

El estado base tiene esta forma:

```js
{
  totalAnswered: 0,
  totalCorrect: 0,
  totalIncorrect: 0,
  errorCountsByTag: {},
  familyCounts: {},
  familyErrorCounts: {},
  mathFamilyCounts: {},
  mathFamilyErrorCounts: {},
  methodCounts: {},
  methodErrorCounts: {},
  submethodCounts: {},
  submethodErrorCounts: {},
  difficultyCounts: {},
  difficultyErrorCounts: {},
  templateCounts: {},
  templateErrorCounts: {},
  errorExamplesByTag: {},
  recentErrorHistory: [],
  settings: {
    mode: "basic",
    practiceMode: "practice",
    difficulty: "1",
    rangeMin: -20,
    rangeMax: 20,
    optionCount: 4,
    activeFamilyIds: ["sin", "cos"],
    activeMethodIds: ["directa"],
    includePendingMethods: false
  },
  recentExercises: []
}
```

Los datos se normalizan al cargar. Esto evita que un estado viejo, corrupto o editado manualmente rompa la página. En particular se validan:

- contadores numéricos;
- tags de error conocidos;
- familias existentes;
- ejemplos recientes por tag de error;
- modos válidos;
- dificultades válidas;
- cantidad válida de opciones;
- rango numérico permitido;
- ejercicios recientes como strings.

`saveState()` usa `try/catch`, así que la app puede seguir funcionando aunque el navegador bloquee o falle al escribir en `localStorage`.

### `errorExamplesByTag`

Desde V1.1, cada respuesta incorrecta guarda un ejemplo reciente por `errorTag`:

```js
{
  id: "err-...",
  timestamp: 1710000000000,
  errorTag: "forgot-chain-factor",
  familyId: "cos",
  exercisePlain: "int -3 cos(2x + 5) dx",
  chosenPlain: "-3 sin(2x + 5) + C",
  correctPlain: "-3/2 sin(2x + 5) + C"
}
```

La app conserva solo el último ejemplo por etiqueta y lo usa para el detalle contextual de la sección Errores. Estos datos se guardan como texto plano y, al renderizarse, se insertan con `textContent`; no se debe leer HTML desde `localStorage` e insertarlo con `innerHTML`.

## Parámetros principales

### `mode`

Define qué familias de integrales se activan. Los modos están en `Core.MODE_FAMILIES`.

Valores actuales:

- `basic`: seno y coseno.
- `intermediate`: seno, coseno, secante cuadrada y cosecante cuadrada.
- `products`: productos `sec tan` y `csc cot`.
- `logarithmic`: tangente, cotangente, secante y cosecante.
- `inverse`: familias inversas.
- `mixed`: todas las familias.
- `custom`: selección manual desde checkboxes.

### `difficulty`

Controla cómo se eligen los parámetros del ejercicio.

- Nivel `1`: `A` vale `-1` o `1`, `k = 1`, `b = 0`.
- Nivel `2`: `A` vale `-1` o `1`, `k` es aleatorio no cero, `b = 0`.
- Nivel `3`: `A` y `k` son aleatorios no cero, `b = 0`.
- Nivel `4`: `A`, `k` y `b` son aleatorios; `k` y `A` no pueden ser cero.
- Nivel `5`: intenta producir ejercicios con desplazamiento no cero y coeficiente fraccionario.

El nivel 5 hace hasta 100 intentos para encontrar un coeficiente fraccionario. Si no lo logra, regresa un ejercicio válido con `b` no cero.

### `rangeMin` y `rangeMax`

Definen el rango de valores enteros para `A`, `k` y `b`.

El rango se sanea con `Core.sanitizeRange()`:

- valores no numéricos caen al rango oficial `-20` y `20`;
- si `min > max`, se intercambian;
- el rango queda limitado a `Core.RANGE_LIMITS`;
- si el rango final es `0..0`, vuelve a `-20..20`.

Límite actual:

```js
{
  min: -20,
  max: 20
}
```

Este límite es la política oficial inmediata para `A`, `k` y `b`. El contrato de parámetros queda preparado para coeficientes futuros de tipo `integer`, `rational`, `irrational-simple`, `symbolic`, `pi-multiple` y `sqrt`, pero la generación actual sigue usando enteros.

### `optionCount`

La cantidad de opciones visibles por ejercicio es política del core, no de la UI:

- Dificultad 1: 4 opciones.
- Dificultad 2: 4 opciones.
- Dificultad 3: 4 opciones.
- Dificultad 4: 6 opciones.
- Dificultad 5: 6 opciones.

La función compartida es `Core.optionCountForDifficulty(difficulty)`. El selector oculto de `index.html` se conserva solo por compatibilidad de controles, pero no decide la cantidad real.

### `activeFamilyIds`

Lista de familias activas. Si llega vacía, inválida o corrupta, se usa un fallback seguro.

En modo cargado desde estado guardado, el fallback preferido es el conjunto de familias del `mode` actual.

## Familias matemáticas

Las familias actuales están definidas en `FAMILY_DEFINITIONS` dentro de `js/core/modules/integrales-lineales/index.js`.

Cada familia incluye:

```js
{
  id: "sin",
  name: "sin",
  group: "basica",
  fDisplay: "sin(u)",
  FDisplay: "-cos(u)",
  baseSign: -1,
  baseCore: "cos",
  integrandCore: "sin",
  derivativeCore: "-sin(u)"
}
```

Campos importantes:

- `id`: identificador estable usado en estado, filtros y estadísticas.
- `name`: nombre legible.
- `group`: clasificación conceptual.
- `fDisplay`: forma base del integrando.
- `FDisplay`: forma base de la antiderivada.
- `baseSign`: signo de la antiderivada base.
- `baseCore`: núcleo usado para construir la respuesta correcta.
- `integrandCore`: núcleo usado para mostrar el integrando.
- `derivativeCore`: forma de la derivada base.

Si se agrega una familia nueva, normalmente también hay que revisar:

- `MODE_FAMILIES`
- `ANSWER_CORES`
- `WRONG_CORE_MAP`
- `corePlain()`
- `coreLatex()`
- `derivativeBaseLatex()`
- pruebas en `tests/core.test.js`

## Generación de ejercicios

La entrada principal es:

```js
Core.generateExercise(settings, recentSignatures, rng);
```

Parámetros:

- `settings`: configuración actual de la interfaz.
- `recentSignatures`: lista de firmas recientes para reducir repetición.
- `rng`: función aleatoria, por defecto `Math.random`.

El generador:

1. Resuelve `optionCount` desde `Core.optionCountForDifficulty()`.
2. Normaliza familias activas.
3. Normaliza familias matemáticas y métodos activos.
4. Sanea el rango.
5. Crea o recibe una semilla.
6. Crea un RNG determinístico para esa semilla.
7. Filtra plantillas compatibles.
8. Elige plantilla y variante.
9. Construye parámetros según dificultad y variante.
10. Construye el ejercicio.
11. Genera distractores únicos.
12. Mezcla opciones con el RNG de la semilla.
13. Valida la instancia generada.
14. Evita firmas recientes durante los primeros intentos.

La firma de un ejercicio se construye con:

```js
A | familyId | k | b;
```

Esto permite reducir repeticiones recientes sin guardar el ejercicio completo.

### Semillas y reproducibilidad

`Core.generateExercise()` acepta `settings.seed`. Si se entrega la misma semilla junto con la misma configuración, el motor debe producir la misma firma y el mismo orden de opciones.

Ejemplo:

```js
const exercise = Core.generateExercise(
  {
    difficulty: "4",
    rangeMin: -5,
    rangeMax: 5,
    optionCount: 4,
    activeFamilyIds: ["sin"],
    activeMathFamilyIds: ["trigonometrica-directa"],
    activeMethodIds: ["directa"],
    seed: "debug-001"
  },
  [],
  Math.random
);
```

Cada ejercicio generado conserva:

```js
exercise.generation = {
  engineVersion: "1.4",
  generatorId: "integrales-lineales",
  templateId: "trig-linear-sin",
  variantId: "desplazada",
  seed: "debug-001",
  attempt: 0,
  params: {
    A,
    k,
    b,
    familyId,
    difficulty,
    variantId
  }
}
```

El `id` del ejercicio puede usar la semilla cuando existe, pero la deduplicación real sigue usando `signature`.

### Validación interna de plantillas

El motor expone `Core.validateGeneratedExercise(exercise, context)` y `Core.testTemplates(config)`.

`validateGeneratedExercise()` revisa:

- integral existente;
- respuesta correcta existente;
- opciones existentes;
- exactamente una opción correcta;
- opciones sin duplicados;
- distractores con error asociado;
- distractores con regla de feedback enlazable;
- dificultad dentro del rango de la plantilla;
- contrato mínimo de plantilla sin advertencias;
- hook opcional `template.validateInstance()`.

`testTemplates()` genera múltiples instancias por plantilla con semillas determinísticas. Es la prueba rápida recomendada al agregar familias nuevas.

```js
const diagnostics = Core.testTemplates({
  iterations: 20,
  optionCount: 4
});
```

La respuesta tiene esta forma:

```js
{
  engineVersion: "1.4",
  passed: true,
  templateCount: 13,
  iterations: 20,
  results: [...]
}
```

## Modelo matemático

Los ejercicios siguen la forma general:

```text
∫ A f(kx + b) dx = (A / k) F(kx + b) + C
```

Los valores `A`, `k` y `b` se almacenan como racionales normalizados cuando entran al núcleo matemático.

La función `correctCoefficient(A, family, k)` calcula:

```js
(A * family.baseSign) / k;
```

## Retroalimentación

`Core.feedbackVariables()` expone los datos necesarios para explicar cada ejercicio:

- `A`, `k`, `b` y `u = kx + b`;
- `f(u)` y `F(u)`;
- regla base de la familia;
- regla general;
- sustitución concreta;
- resultado correcto simplificado.

`feedbackContent()` usa esos datos para alimentar `feedbackRules` y devuelve contenido estructurado. La capa de app lo monta con `Core.renderContentInto()`, de modo que cualquier matemática dentro de la retroalimentación vuelve a pasar por `MathRenderer`.

El flujo recomendado es:

1. La plantilla declara reglas por `errorType`.
2. El distractor declara `errorType`, `errorTag` y `sourceStrategy`.
3. `validateAnswer()` identifica la opción y el distractor elegido.
4. `TrigFeedbackEngine.buildFeedbackContent()` busca la regla correspondiente.
5. El módulo aporta variables matemáticas como LaTeX/contenido, y `MathRenderer` produce la representación visual final.

Esto evita que el núcleo tenga que conocer casos especiales de cada familia. Para agregar mensajes de una familia nueva, se agregan reglas a su plantilla o método, no ramas nuevas en `retroalimentacion.js`.

## Formulario

El panel Formulario se renderiza desde `Core.formulaCatalog()`. Ese catálogo deriva sus entradas de `FAMILY_DEFINITIONS`, por lo que incluye las familias actuales en el mismo orden del núcleo.

Cada entrada contiene:

- etiqueta de familia;
- integral base respecto de `u`;
- versión con argumento lineal `kx + b`, con `k` distinto de cero.

## Opciones y distractores

Cada opción tiene esta forma aproximada:

```js
{
  id: "opt-...",
  value: "-3/2 sin(2x + 5) + C",
  isCorrect: false,
  errorTag: "wrong-family",
  errorType: "wrong-family",
  sourceStrategy: "wrong-family",
  coefficient: { n: 1, d: 2 },
  core: "sin",
  argument: { ... },
  displayPlain: "...",
  displayLatex: "...",
  display: {
    plain: "...",
    latex: "..."
  },
  displayExpression: "...",
  key: "..."
}
```

Los distractores se generan con errores didácticos:

- `wrong-family`
- `wrong-base-sign`
- `forgot-chain-factor`
- `ignored-negative-k`
- `lost-external-sign`
- `copied-integrand`
- `lost-argument-shift`
- `generic-coefficient-error`

`buildOptions()` garantiza que haya una sola respuesta correcta y que las opciones no dupliquen la misma expresión matemática. En v1.4 la identidad de una opción se compara con `key`, `equivalenceKey`, `value`, `displayPlain`, `displayExpression` o `displayLatex`, en ese orden, para soportar mejor plantillas futuras.

## Renderizado matemático

El renderizado matemático se concentra en `js/core/math-renderer.js`. LaTeX es el formato estándar; `MathRenderer` es el responsable arquitectónico de convertirlo en contenido visible.

Flujo oficial:

```text
Template -> ExerciseModel -> LaTeX/datos estructurados -> MathRenderer -> UI
```

Reglas:

- plantillas y generadores producen datos, `plain` y `latex`;
- el modelo universal expone `promptLatex`, `optionsLatex`, `correctAnswerLatex`, `feedbackLatex`, `formulaRefs` y `distractorErrorTypes`;
- feedback y derivación devuelven contenido estructurado, no HTML;
- `FormulaSidebar`, `ExerciseView`, `OptionsView`, `FeedbackView` y `StatsPanel` solo llaman `renderInto()` o `renderContentInto()`;
- `innerHTML` queda encapsulado en `math-renderer.js` como punto de montaje del HTML generado por el renderer central.

El módulo trigonométrico actual registra `trig-linear-renderer`, pero sus hooks de módulo son de serialización (`serializeIntegral`, `serializeOption`) o contenido (`renderFeedbackContent`, `renderDerivationContent`). No debe exponer funciones `*Html` propias.

## Cómo agregar una nueva familia matemática

1. Registrar la familia matemática general en `js/core/taxonomia.js` si todavía no existe.
2. Registrar el método principal en `js/core/taxonomia.js` o reutilizar uno existente.
3. Crear o extender un módulo matemático registrable en `js/core/`.
4. Registrar el módulo con `TrigCoreRegistry.registerMathModule()`.
5. Crear una plantilla compatible con `TemplateModel`.
6. Definir `status`, `familyId`, `mathFamilyId`, `methodId`, `submethodId`, dificultad y tags.
7. Declarar `parameters` y `restrictions`.
8. Declarar variantes con rango de dificultad y `parameterOverrides` si aplica.
9. Definir la representación matemática estándar de la integral: `plain` y `latex`.
10. Definir la respuesta correcta como opción normalizada.
11. Definir distractores tipados con `errorType`, `errorTag` y `sourceStrategy`.
12. Definir reglas o hooks de feedback para los errores esperados.
13. Registrar la plantilla en `GeneratorRegistry` mediante `registerTemplate()`.
14. Implementar `validateInstance()` si la familia necesita restricciones específicas.
15. Validar que el ejercicio generado cumpla `ExerciseModel`.
16. Probar generación, semillas, validación, renderizado, distractores únicos y estadísticas.

Una familia nueva no debería requerir cambios en `app.js`. Si necesita controles visibles nuevos, primero debe existir una configuración interna compatible en `state.js`.

## Manejo de errores

`generateNextExercise()` captura errores del generador. Si algo falla, se limpia el ejercicio actual y se muestra un mensaje dentro de la zona de feedback.

Este comportamiento protege la experiencia del usuario en casos como:

- configuración inválida;
- estado local corrupto;
- fallo inesperado del generador;
- imposibilidad de producir distractores suficientes.

## Consideraciones de privacidad

La app no envía datos a servidores. El progreso se queda en el navegador del usuario.

El estado local no contiene información sensible, pero sí refleja progreso de estudio. Si se cambia el esquema de estado, conviene mantener compatibilidad o migrar con cuidado desde `mergeState()`.

## Estilos SCSS

Los estilos fuente viven en `src/styles/main.scss` y sus parciales. El archivo `styles.css` se conserva como salida CSS para el navegador.

El entorno de Node/NPM es solo para desarrollo y está fijado en:

- Node.js `22.22.3`
- npm `10.9.8`
- Sass `1.93.2`

Se eligió Node 22 porque sigue soportado como LTS y evita usar líneas EOL como Node 20 o líneas más nuevas como Node 24/26. Las dependencias de npm están fijadas en `package-lock.json`.

Instalación local recomendada:

```bash
./scripts/install-node-dev.sh
. .dev/node-env.sh
npm ci
```

El instalador descarga el binario oficial de Node.js y verifica su SHA256 antes de usarlo. Todo queda dentro de `.dev/`, que no se versiona.

Si ya usas `nvm`, también puedes hacer:

```bash
nvm install
nvm use
npm ci
```

En sesiones automatizadas o shells que no carguen `nvm` por defecto, usa:

```bash
source "$HOME/.nvm/nvm.sh"
node --version
```

Recompila el CSS con:

```bash
npm run sass
```

Para desarrollo continuo puedes usar `npm run sass:watch`.

Si se añade una vista nueva, conviene colocar sus reglas en `features/` cuando pertenezcan a una experiencia concreta, o en `components/` si son reutilizables.

## Pruebas

Hay dos formas de prueba incluidas:

- `tests/core.test.js`: pruebas del núcleo usando Node.js.
- `tests/browser-test.html`: pruebas manuales en navegador.

Casos mínimos recomendados al modificar el núcleo:

- cada familia genera una respuesta correcta única;
- no hay opciones duplicadas;
- `Core.testTemplates()` pasa para las plantillas tocadas;
- `contractWarnings` queda vacio para plantillas activas;
- todos los distractores tienen `errorType` y regla de feedback enlazada;
- `validateAnswer()` devuelve `selectedDistractor` cuando la respuesta es incorrecta;
- una misma semilla reproduce firma y orden de opciones;
- `generation.engineVersion` queda en `"1.4"` para ejercicios generados por el motor nuevo;
- cada plantilla declara parámetros, restricciones, variantes y estrategias de distractores;
- coeficientes con `k` negativo son correctos;
- familias logarítmicas mantienen signo correcto;
- familias inversas conservan su forma esperada;
- rangos extremos se sanean;
- estado corrupto en `localStorage` no rompe la app.

Comando recomendado:

```bash
source "$HOME/.nvm/nvm.sh"
node tests/core.test.js
```

## Reglas prácticas para cambios futuros

- Mantener `core.js` como fachada publica sin logica matematica especifica.
- Mantener los tipos de integrales dentro de módulos registrables en `js/core/`.
- Mantener `app.js` como orquestador de interacción, no como dueño de estado o render pesado.
- Mantener LaTeX como fuente de verdad visual: generadores producen datos/LaTeX y `math-renderer.js` es la unica capa que produce HTML matemático.
- No guardar ejercicios completos si solo se necesita evitar repetición.
- Validar cualquier valor que venga de `localStorage`.
- Usar `textContent` para texto plano y `MathRenderer.renderInto()`/`renderContentInto()` para matemáticas.
- Si agregas una familia, declara plantillas, distractores, renderer y pruebas dentro de su módulo.
- Si cambias la forma del estado, considera subir la versión de `STORAGE_KEY` o agregar migración.
