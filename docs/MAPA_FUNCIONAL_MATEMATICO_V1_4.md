# Mapa funcional matematico V1.4

> Documento historico. La fuente vigente para la arquitectura actual es `docs/MAPA_FUNCIONAL_MATEMATICO_V1_5.md`.

Este archivo se conserva solo como referencia del contrato anterior. No debe usarse como guia principal para agregar modulos nuevos ni para modificar la arquitectura plug-and-play vigente.

## Estado historico

V1.4 establecio las primeras bases del motor de plantillas:

- taxonomia con `familyId`, `mathFamilyId`, `methodId`, `submethodId`, `templateId` y `variantId`;
- generacion por templates registradas;
- seleccion de variantes por dificultad;
- metadatos de ejercicio universal;
- feedback enlazado por `errorType`;
- cantidad de opciones derivada de dificultad;
- parametros enteros en rango `-20..20`;
- diagnostico basico de templates;
- reproduccion con seed;
- separacion inicial entre app y core.

## Diferencia principal con V1.5

V1.5 reemplaza el enfoque de plantilla interna por una arquitectura plug-and-play completa:

- `core.js` ya no conoce modulos concretos;
- `index.html` ya no carga internals de modulos;
- `js/core/modules/index.js` carga modulos desde `MODULE_MANIFEST`;
- los modulos se registran en `TrigCoreRegistry`;
- `js/core/integraleslineales.js` fue eliminado;
- `TrigCoreModules.integralesLineales` fue eliminado;
- `js/core/modules/integrales-lineales/datos.js` fue eliminado;
- `TrigLinearData` fue eliminado;
- `optionCountSelect` y `optionCount` persistido fueron eliminados;
- `modelo-ejercicio.js` usa defaults neutros;
- el modulo lineal queda como referencia de modulo plug-and-play.

## Uso permitido de este documento

Usar este archivo solo para entender el estado previo del refactor.

Para trabajo nuevo usar:

- `docs/MAPA_FUNCIONAL_MATEMATICO_V1_5.md`
- `docs/GUIA_AGREGAR_MODULO_MATEMATICO.md`
- `README-dev.md`
