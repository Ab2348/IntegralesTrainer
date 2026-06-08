# README para desarrollo

Este documento describe el funcionamiento interno del entrenador de integrales trigonométricas. Está pensado para personas que quieran mantener, auditar o extender la página.

## Resumen técnico

La aplicación es una página estática sin backend. Todo se ejecuta en el navegador:

- `index.html` define la estructura de la interfaz.
- `styles.css` contiene el diseño visual.
- `js/core/registro.js` registra módulos matemáticos disponibles.
- `js/core/integraleslineales.js` contiene la lógica matemática, generación de ejercicios y HTML matemático para integrales con argumento lineal.
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

## Flujo general

Al cargar la página:

1. `index.html` carga `js/core/registro.js`.
2. `index.html` carga `js/core/integraleslineales.js`.
3. El módulo matemático se registra como `integrales-lineales`.
4. `index.html` carga `core.js`.
5. `core.js` publica la API activa en `window.TrigCore`.
6. `index.html` carga los módulos de `js/app/`.
7. `index.html` carga `app.js`.
8. `app.js` crea los módulos, lee el estado local y sincroniza los controles.
9. Se genera el primer ejercicio con `Core.generateExercise`.
10. La respuesta del usuario actualiza estadísticas y guarda el estado.

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
  errorExamplesByTag: {},
  settings: {
    mode: "basic",
    difficulty: "1",
    rangeMin: -10,
    rangeMax: 10,
    optionCount: 4,
    activeFamilyIds: ["sin", "cos"]
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
  isCorrect: false,
  errorTag: "wrong-family",
  coefficient: { n: 1, d: 2 },
  core: "sin",
  argument: { ... },
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

## Renderizado HTML

El núcleo genera HTML matemático mediante funciones como:

- `rationalHtml()`
- `coreHtml()`
- `expressionHtml()`
- `integralHtml()`
- `feedbackHtml()`
- `derivationHtml()`

La app usa `innerHTML` para insertar ese HTML generado internamente. No debe insertarse HTML proveniente de usuarios o de estado persistido sin validación.

Las estadísticas usan renderizado con DOM y solo aceptan labels previamente validados. Si no se puede confiar en el texto, debe usarse `textContent`.

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
- Si agregas una familia, actualiza también distractores, renderizado y pruebas.
- Si cambias la forma del estado, considera subir la versión de `STORAGE_KEY` o agregar migración.
