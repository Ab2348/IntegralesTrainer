# Entrenador de integrales trigonométricas

Una página interactiva para practicar integrales trigonométricas de forma rápida, clara y con retroalimentación inmediata.

Este entrenador está pensado como una herramienta de estudio: genera ejercicios, propone varias respuestas posibles y explica por qué una elección es correcta o incorrecta. La intención no es solo marcar aciertos, sino ayudar a reconocer patrones, signos, familias trigonométricas y el efecto de la regla de la cadena al integrar.

## ¿Cómo funciona?

Al abrir la página aparece un ejercicio de integración con opciones de respuesta. Elige la opción que consideres correcta y el sistema te mostrará el resultado al instante.

Si respondes correctamente, verás una confirmación breve. Si respondes incorrectamente, la página te explicará el tipo de error cometido y reconstruirá el ejercicio con los elementos importantes: el coeficiente, el argumento de la función, la derivada interna y la regla base que debía aplicarse.

También puedes usar el botón **Ver derivación** para revisar una comprobación por derivada y confirmar que la antiderivada propuesta regresa al integrando original.

## Qué puedes practicar

El entrenador incluye familias trigonométricas frecuentes, entre ellas:

- seno y coseno
- tangente y cotangente
- secante cuadrada y cosecante cuadrada
- productos como secante por tangente y cosecante por cotangente
- integrales con logaritmos trigonométricos
- familias inversas como arctangente, arcseno y arccoseno

Los ejercicios pueden variar en dificultad, rango numérico y cantidad de opciones. También puedes activar o desactivar familias específicas para concentrarte en los temas que quieres reforzar.

## Panel de configuración

En el panel izquierdo puedes ajustar la práctica:

- **Modo:** selecciona un conjunto de familias trigonométricas.
- **Dificultad:** controla el nivel de variación de los ejercicios.
- **Min y Max:** definen el rango de valores que puede usar el generador.
- **Opciones:** cambia cuántas respuestas aparecen en cada ejercicio.
- **Familias:** permite practicar solo ciertos tipos de integrales.

Después de cambiar la configuración, usa **Siguiente ejercicio** para generar una nueva integral con esos ajustes.

## Retroalimentación

La retroalimentación busca señalar el error matemático de manera específica. Por ejemplo, puede indicar si se eligió una familia incorrecta, si se perdió un signo, si faltó compensar la derivada del argumento o si se cambió indebidamente la expresión interna.

Cada explicación muestra la regla base y la forma general:

```text
∫ A f(kx + b) dx = (A / k) F(kx + b) + C
```

Esto permite estudiar el procedimiento, no solo memorizar respuestas.

## Estadísticas

El panel derecho registra tu progreso local:

- ejercicios respondidos
- respuestas correctas e incorrectas
- porcentaje de acierto
- errores más frecuentes
- familias donde has fallado más

Estos datos se guardan en el navegador mediante almacenamiento local. No se envían a ningún servidor y puedes reiniciarlos con el botón **Reiniciar progreso**.

## Recomendación de uso

Para aprovechar mejor la página, conviene trabajar por bloques cortos. Practica una familia a la vez, revisa los errores que se repiten y después aumenta la dificultad o mezcla varias familias.

Si una respuesta parece confusa, usa la derivación como comprobación: derivar la antiderivada es una forma directa de verificar si el resultado es correcto.


