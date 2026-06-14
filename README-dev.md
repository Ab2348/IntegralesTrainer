# README para desarrollo

Este documento describe el funcionamiento interno del entrenador de integrales trigonométricas. Está pensado para personas que quieran mantener, auditar o extender la página.

## Resumen técnico

La aplicación es una página estática sin backend. Todo se ejecuta en el navegador:

- `index.html` define la estructura de la interfaz.
- `src/styles/main.scss` es el punto de entrada de estilos SCSS.
- `src/styles/` contiene los parciales SCSS separados por abstracts, base, layout, components, features y utilities.
- `styles.css` es el CSS de salida que carga `index.html`.
- `js/core/taxonomia.js` define familias matemáticas, métodos y tipos de error de la arquitectura v1.3.
- `js/core/contratos.js` normaliza los contratos de plantilla, variante, dificultad, feedback y distractores.
- `js/core/math-renderer.js` registra renderizadores matemáticos y estandariza expresiones `plain`, `latex` y `html`.
- `js/core/modelo-ejercicio.js` normaliza el contrato universal de ejercicio.
- `js/core/opciones.js` construye conjuntos de opción correcta y distractores.
- `js/core/validacion.js` centraliza la validación de opción múltiple.
- `js/core/retroalimentacion.js` orquesta la retroalimentación desde el resultado de validación.
- `js/core/generador.js` registra plantillas y genera ejercicios desde plantillas compatibles.
- `js/core/registro.js` registra módulos matemáticos disponibles.
- `js/core/integraleslineales.js` registra las plantillas trigonométricas actuales, sus reglas matemáticas y su renderizador.
- `core.js` publica la fachada compatible `window.TrigCore` usando el módulo matemático activo.
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
3. La plantilla trigonométrica registrada en `integraleslineales.js` crea una instancia matemática.
4. `js/core/opciones.js` arma opción correcta y distractores tipados.
5. `js/core/modelo-ejercicio.js` normaliza la instancia al modelo universal.
6. `js/core/validacion.js` valida la opción elegida.
7. La capa de render matemático expone integral, opciones, feedback y derivación en formato visual.
8. `stats-panel.js` registra familia, método, submétodo, dificultad, plantilla y tipo de error.

Para agregar una familia futura, la ruta esperada es registrar nuevas plantillas compatibles con `js/core/generador.js`, no modificar el flujo principal de `app.js`.

## Contratos del núcleo

### Representación matemática estándar

Las expresiones matemáticas deben poder viajar con esta forma:

```js
{
  plain: "int 2 sin(3x - 1) dx",
  latex: "\\int 2\\sin\\left(3x - 1\\right)\\,dx",
  html: "..."
}
```

`plain` sirve para estadísticas, ejemplos y depuración. `latex` es la representación portable preferida para futuros renderizadores. `html` queda como salida visual compatible con la interfaz actual.

Las opciones conservan compatibilidad con `displayExpression` y `displayHtml`, pero el contrato nuevo es:

```js
{
  id: "opt-...",
  value: "...",
  displayPlain: "...",
  displayLatex: "...",
  displayHtml: "...",
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
  familyId,
  mathFamilyId,
  methodId,
  submethodId,
  difficultyMin,
  difficultyMax,
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
  generate
}
```

El generador principal solo debe filtrar y delegar. Una plantilla nueva no debe requerir cambios en `app.js`.

### VariantModel

Cada plantilla puede declarar variantes. La variante mínima es:

```js
{
  id,
  name,
  description,
  appliesToTemplate,
  difficultyModifier,
  parameterOverrides,
  renderHints
}
```

En v1.3.2 solo se usa la variante base `lineal`, pero el contrato ya existe para v1.4.

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

1. `index.html` carga los módulos base de v1.3: taxonomía, modelo, opciones, validación, retroalimentación y generador.
2. `index.html` carga `js/core/registro.js`.
3. `index.html` carga `js/core/integraleslineales.js`.
4. El módulo matemático registra sus plantillas y el módulo activo `integrales-lineales`.
5. `index.html` carga `core.js`.
6. `core.js` publica la API activa en `window.TrigCore`.
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
    rangeMin: -10,
    rangeMax: 10,
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

- valores no numéricos caen a `-10` y `10`;
- si `min > max`, se intercambian;
- el rango queda limitado a `Core.RANGE_LIMITS`;
- si el rango final es `0..0`, vuelve a `-10..10`.

Límite actual:

```js
{
  min: -50,
  max: 50
}
```

Este límite existe para evitar rangos enormes que puedan congelar la página o producir ejercicios demasiado incómodos.

### `optionCount`

Cantidad de opciones visibles por ejercicio.

Valores permitidos:

- `4`
- `5`
- `6`

Internamente también se limita en `Core.generateExercise()`.

### `activeFamilyIds`

Lista de familias activas. Si llega vacía, inválida o corrupta, se usa un fallback seguro.

En modo cargado desde estado guardado, el fallback preferido es el conjunto de familias del `mode` actual.

## Familias matemáticas

Las familias actuales están definidas en `FAMILY_DEFINITIONS` dentro de `js/core/integraleslineales.js`.

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
- `coreHtml()`
- `corePlain()`
- `derivativeBaseHtml()`
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

1. Normaliza `optionCount`.
2. Normaliza familias activas.
3. Sanea el rango.
4. Construye parámetros según dificultad.
5. Evita firmas recientes durante los primeros intentos.
6. Construye el ejercicio.
7. Genera distractores únicos.
8. Mezcla opciones.

La firma de un ejercicio se construye con:

```js
A | familyId | k | b;
```

Esto permite reducir repeticiones recientes sin guardar el ejercicio completo.

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

`feedbackHtml()` usa esos datos para mostrar una explicación gradual. La capa de app solo inserta el HTML generado por el núcleo; no reconstruye fórmulas matemáticas propias.

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
    latex: "...",
    html: "..."
  },
  displayExpression: "...",
  displayHtml: "...",
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

`buildOptions()` garantiza que haya una sola respuesta correcta y que las opciones no dupliquen la misma expresión matemática.

## Renderizado matemático

El renderizado matemático se concentra en `js/core/math-renderer.js`. El renderer activo convierte datos matemáticos internos a:

- texto plano;
- LaTeX;
- HTML confiable para la interfaz actual.

El módulo trigonométrico actual registra `trig-linear-renderer`. Sus funciones internas como `rationalHtml()`, `coreHtml()`, `expressionHtml()`, `integralHtml()`, `feedbackHtml()` y `derivationHtml()` siguen existiendo por compatibilidad, pero la app debe preferir `Core.renderIntegral()` y `Core.renderOption()` cuando estén disponibles.

La app usa `innerHTML` solo para HTML generado internamente por el renderer. No debe insertarse HTML proveniente de usuarios o de estado persistido sin validación.

Las estadísticas usan renderizado con DOM y solo aceptan labels previamente validados. Si no se puede confiar en el texto, debe usarse `textContent`.

## Cómo agregar una nueva familia matemática

1. Registrar la familia matemática general en `js/core/taxonomia.js` si todavía no existe.
2. Registrar el método principal en `js/core/taxonomia.js` o reutilizar uno existente.
3. Crear o extender un módulo matemático registrable en `js/core/`.
4. Registrar el módulo con `TrigCoreRegistry.registerMathModule()`.
5. Crear una plantilla compatible con `TemplateModel`.
6. Definir `familyId`, `mathFamilyId`, `methodId`, `submethodId`, dificultad y variante base.
7. Definir la representación matemática estándar de la integral: `plain`, `latex` y `html`.
8. Definir la respuesta correcta como opción normalizada.
9. Definir distractores tipados con `errorType`, `errorTag` y `sourceStrategy`.
10. Definir reglas o hooks de feedback para los errores esperados.
11. Registrar la plantilla en `GeneratorRegistry` mediante `registerTemplate()`.
12. Validar que el ejercicio generado cumpla `ExerciseModel`.
13. Probar generación, validación, renderizado, distractores únicos y estadísticas.

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
- coeficientes con `k` negativo son correctos;
- familias logarítmicas mantienen signo correcto;
- familias inversas conservan su forma esperada;
- rangos extremos se sanean;
- estado corrupto en `localStorage` no rompe la app.

## Reglas prácticas para cambios futuros

- Mantener `core.js` como fachada publica sin logica matematica especifica.
- Mantener los tipos de integrales dentro de módulos registrables en `js/core/`.
- Mantener `app.js` como orquestador de interacción, no como dueño de estado o render pesado.
- No guardar ejercicios completos si solo se necesita evitar repetición.
- Validar cualquier valor que venga de `localStorage`.
- Usar `textContent` salvo que el HTML venga de funciones internas confiables.
- Si agregas una familia, declara plantillas, distractores, renderer y pruebas dentro de su módulo.
- Si cambias la forma del estado, considera subir la versión de `STORAGE_KEY` o agregar migración.
