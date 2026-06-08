# Entrenador de integrales trigonometricas

Aplicacion web estatica local para practicar integrales trigonometricas directas con opcion multiple, distractores etiquetados y retroalimentacion deterministica.

## Ejecucion

Abre `index.html` directamente en el navegador.

Tambien puedes servir la carpeta con un servidor estatico simple:

```bash
python3 -m http.server 8000
```

## Archivos

- `index.html`: estructura de la aplicacion.
- `styles.css`: estilos responsive y estados visuales.
- `core.js`: nucleo matematico, familias, generacion, distractores y plantillas.
- `app.js`: interfaz, eventos, localStorage y estadisticas.
- `tests/core.test.js`: pruebas basicas del nucleo.
- `tests/browser-test.html`: harness de pruebas para navegador.

## Cobertura funcional

La version inicial genera ejercicios desde familias matematicas y parametros aleatorios. No usa backend, base de datos, API externa ni `eval()`.

Familias incluidas:

- `sin`
- `cos`
- `tan`
- `cot`
- `sec^2`
- `csc^2`
- `sec tan`
- `csc cot`
- `sec`
- `csc`
- `arctan`
- `arcsin`
- `arccos`

Distractores incluidos:

- `wrong-family`
- `wrong-base-sign`
- `forgot-chain-factor`
- `ignored-negative-k`
- `lost-external-sign`
- `copied-integrand`
- `lost-argument-shift`
- `generic-coefficient-error`

## Pruebas

```bash
node tests/core.test.js
```

Si no hay runtime de JavaScript instalado, abre `tests/browser-test.html` en el navegador.
