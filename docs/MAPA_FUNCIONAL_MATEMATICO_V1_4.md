# Mapa funcional matematico V1.4

Este documento fija el contrato interno para agregar contenido matematico sin convertir `app.js` en codigo matematico.

## Taxonomia del core

- `mode`: agrupacion de practica usada por la UI para elegir familias activas.
- `familyId`: familia concreta de plantilla, por ejemplo `sin`, `cos` o `sec2`.
- `mathFamilyId`: familia matematica curricular, por ejemplo `trigonometrica-directa`.
- `methodId`: metodo general, por ejemplo `directa`.
- `submethodId`: subtipo del metodo, por ejemplo `argumento-lineal`.
- `templateId`: plantilla concreta registrada en el generador, por ejemplo `trig-linear-sin`.
- `variantId`: variante real elegida por dificultad, por ejemplo `desplazada`.

`mode` no debe usarse como categoria matematica. Las estadisticas y filtros matematicos deben apoyarse en `familyId`, `mathFamilyId`, `methodId`, `submethodId`, `templateId` y `variantId`.

## Politicas centrales

- `Core.optionCountForDifficulty(difficulty)` decide la cantidad de opciones: niveles 1, 2 y 3 usan 4; niveles 4 y 5 usan 6.
- `Core.RANGE_LIMITS` es `{ min: -20, max: 20 }` para los parametros enteros actuales `A`, `k` y `b`.
- `Core.COEFFICIENT_TYPES` declara los tipos aceptados por contrato: `integer`, `rational`, `irrational-simple`, `symbolic`, `pi-multiple` y `sqrt`.
- `Core.optionIdentity(option)` es la fuente unica para deduplicar opciones.

La generacion actual sigue usando enteros. El contrato queda listo para coeficientes no enteros futuros sin implementarlos en V1.4.

## Contrato de modulo matematico

Un modulo enchufable debe exponer:

- `moduleId`, `moduleName`, `modelVersion`, `generatorVersion`.
- familias concretas o referencias a familias existentes.
- plantillas normalizadas para `TrigExerciseGenerator.registerTemplate()`.
- registro de renderer si necesita serializacion o feedback especifico.
- catalogo de formulas si aplica.
- diagnosticos opcionales del modulo.

El modulo debe producir expresiones `plain` y `latex`, contenido estructurado para feedback y derivacion, y distractores con `id`, `errorType`, `errorTag`, `sourceStrategy`, `displayPlain`, `displayLatex`, `key` y `metadata`.

## Checklist para nuevas integrales

1. Declarar o reutilizar `mathFamilyId`, `methodId` y `submethodId`.
2. Crear un modulo bajo `js/core/modules/<module-id>/`.
3. Definir familias concretas y plantillas dentro del modulo.
4. Declarar parametros, restricciones, variantes y perfil de dificultad.
5. Generar integral, respuesta correcta y distractores desde la plantilla.
6. Usar IDs deterministas para opciones y `Core.optionIdentity()` para deduplicacion.
7. Registrar reglas de feedback por cada `errorType`.
8. Registrar renderer si la salida requiere hooks especificos.
9. Agregar pruebas de generacion, validacion, feedback, opciones y reproducibilidad.
10. No modificar `app.js` salvo que se agregue una capacidad global nueva.

## Modulo actual

`js/core/modules/integrales-lineales/index.js` es la implementacion activa de integrales trigonometria directa con argumento lineal. `js/core/integraleslineales.js` queda como fachada legacy para compatibilidad historica directa, pero no participa en el arranque normal de produccion. El flujo normal registra modulos desde `js/core/modules/index.js` y `core.js` publica `window.TrigCore` desde `TrigCoreRegistry.getActive()`.
