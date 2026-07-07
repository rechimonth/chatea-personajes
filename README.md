# Chatea con tu personaje favorito

Single Page Application desarrollada para **ComicSansCon**, agencia digital especializada en experiencias interactivas para fans de videojuegos, películas y series de televisión.

## Personajes disponibles

| Personaje | Categoría | Descripción |
|-----------|-----------|-------------|
| **Sherlock Holmes** | Detective | El detective consultor más famoso de Londres. Mente fría, observación aguda y deducciones impecables. Vocabulario victoriano: Baker Street, Scotland Yard, Watson, pipa, violin. |
| **Drácula** | Terror | El conde Drácula, príncipe vampiro transilvano. Presencia imponente, mente aristocrática y seductor oscuro. Vocabulario gótico: Transilvania, Cárpatos, castillo, noche, sangre. |
| **Alicia** | Fantasía | La niña curiosa del País de las Maravillas. Imaginación desbordante y valiente. Vocabulario: Reina de Corazones, Sombrerero Loco, Conejo Blanco, Gato de Cheshire, Fiesta del Té. |
| **La Criatura** | Ciencia Ficción | El ser vivo creado por Victor Frankenstein. Busca comprensión en un mundo que lo teme por su apariencia. Vocabulario: Creador, soledad, venganza justa, De Lacey, William, Justine. |

## Tecnologías

- **Frontend**: Vanilla JavaScript (ES Modules), CSS Variables, Grid/Flexbox
- **Build**: Vite
- **Testing**: Vitest con jsdom
- **Deploy**: Vercel Serverless Functions

## Requisitos

- Node.js 18+
- Clave API de Google Gemini (obtener en https://ai.google.dev)

## Configuración y ejecución local

```bash
# 1. Clonar el repositorio
git clone <https://github.com/rechimonth/chatea-personajes>
cd chatea-personajes

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env y agregar tu GEMINI_API_KEY

# 4. Ejecutar en desarrollo
npm run dev
# Abrir http://localhost:5173
```

## Ejecutar tests

```bash
npm test
```

Los tests cubren:
- `tests/store.test.js` — Estado global y persistencia
- `tests/router.test.js` — Navegación SPA
- `tests/service.test.js` — Cliente HTTP
- `tests/views.test.js` — Renderizado de vistas

## Despliegue en Vercel

1. Conectar repositorio en https://vercel.com/new
2. Configurar variable `GEMINI_API_KEY` en el dashboard
3. El deploy se ejecuta automáticamente

```bash
vercel --prod
```

## Funcionalidades implementadas

### Alcance funcional mínimo
- ✅ 3 vistas: Home (/), Chat (/chat), About (/about)
- ✅ History API para navegación sin recargas
- ✅ Diferenciación visual entre mensajes usuario/personaje
- ✅ Estado "escribiendo..." animado
- ✅ Manejo de errores de API
- ✅ Scroll automático
- ✅ Responsive mobile-first

### Extra credit
- ✅ Persistencia historial en localStorage
- ✅ 4 personajes con system prompts únicos
- ✅ Timestamps en mensajes
- ✅ Indicador "escribiendo..." animado
- ✅ Enter para enviar
- ✅ Copiar respuestas al portapapeles
- ✅ Modo oscuro/claro con toggle
- ✅ Botón borrar historial

---

## URL pública

[https://chatea-personajes.vercel.app](https://chatea-personajes.vercel.app)


## Registro del uso de AI en el proyecto.

### 1. Evolución del modelo de inteligencia artificial — De Gemini 2.5 Flash a Gemini 3.1 Flash Lite
**Fecha:** 2026-07-07  
**Autor:** Kilo (asistente de ingeniería)

La semana anterior decidimos dar un salto generacional en el cerebro conversacional de la aplicación. El modelo anterior, `gemini-2.5-flash`, ya era competente, pero sentíamos que podíamos ofrecer algo más ágil y económico sin sacrificar la personalidad de los personajes. Por eso migramos a **Gemini 3.1 Flash Lite**, el modelo más reciente de Google para tareas de alta frecuencia y baja latencia.

El cambio fue quirúrgico: solo modificamos una línea en `api/chat.js`, reemplazando el identificador del modelo. No hubo que tocar la API Key ni reescribir lógica del backend. Los tests unitarios confirmaron que todo seguía respirando con normalidad (29/29 pruebas en verde).

**Impacto para el usuario final:** Las respuestas ahora llegan más rápido, especialmente en móviles con conexiones variables. El costo operativo por token bajó considerablemente, lo que significa que el proyecto puede escalar a más usuarios sin que la factura de IA se dispare. Los personajes siguen respondiendo con la misma personalidad victoriana, gótica o fantástica de siempre; simplemente ahora lo hacen con un motor más moderno.

---

### 2. Del prototipo al SDK oficial — Una interfaz digna de mundos literarios
**Fecha:** 2026-07-07  
**Autor:** Kilo (asistente de ingeniería)

Al principio, la conexión con la IA funcionaba, pero sentíamos que la capa visual no hacía justicia a la riqueza literaria de Sherlock Holmes, Drácula, Alicia y la Criatura. Fue entonces cuando dimos el salto definitivo al **SDK oficial `@google/genai`** y, en paralelo, diseñamos una interfaz que llamamos cariñosamente *fantasy UI*.

El estilo visual se construyó sobre pilares de diseño muy deliberados: tipografía *Cinzel* para títulos que evocan códices antiguos, paleta dorada y grana que recuerda a sellos de cera y marcos ornamentados, y fondos místicos que cambian según el tema claro u oscuro. Cada personaje no solo tiene un avatar; tiene una firma cromática propia que se refleja en su avatar, su nombre y el gradiente del botón de chat.

**Impacto para el usuario final:** Abrir la aplicación ya no se siente como usar un chat genérico. Se siente como entrar a una biblioteca victoriana, a un castillo transilvano o a una madriguera surrealista. La coherencia visual refuerza la inmersión y hace que cada conversación tenga peso narrativo, no solo informativo.

---

### 3. La estructura cobra vida — SPA, chat, about e historial
**Fecha:** 2026-07-07  
**Autor:** Kilo (asistente de ingeniería)

Una de las decisiones más importantes del proyecto fue convertirlo en una **Single Page Application (SPA)**. En lugar de recargar la página cada vez que el usuario navega por los personajes, implementamos un enrutamiento basado en History API (`/`, `/chat?id=...`, `/about`). Esto le da a la aplicación una fluidez cercana a la de una app nativa.

Construimos tres vistas principales:
- **Home:** Un carrusel horizontal en escritorio y un scroll vertical en móvil, donde cada carta es un personaje esperando ser descubierto.
- **Chat:** El corazón del proyecto. Incluye mensajes diferenciados entre usuario y personaje, animación de “escribiendo...”, timestamps, botón de copiar respuesta al portapapeles y scroll automático hacia el último mensaje.
- **About:** Una sección que explica la magia técnica detrás de la experiencia, humanizando la tecnología.

Además, agregamos **persistencia en localStorage**. El historial de conversaciones no se pierde al cerrar el navegador. Cada personaje guarda su propio hilo conversacional, y el usuario puede borrarlo cuando quiera con un solo clic.

**Impacto para el usuario final:** La navegación es instantánea. Puedes chatear con Drácula, cerrar la pestaña, volver al día siguiente y retomar la conversación exactamente donde la dejaste. No hay tiempos de carga innecesarios, no hay saltos de página. La aplicación respeta el tiempo del usuario y su deseo de continuar explorando mundos sin interrupciones.

---

### 4. Móvil como prioridad — Menú y carrusel adaptativos
**Fecha:** 2026-07-07  
**Autor:** Kilo (asistente de ingeniería)

El diseño *fantasy UI* funcionaba bien en escritorio, pero en pantallas pequeñas el carrusel 3D horizontal se volvía contraproducente: las tarjetas laterales quedaban parcialmente ocultas, los botones laterales eran difíciles de alcanzar con el pulgar y el scroll táctil competía con la animación 3D. Decidimos entonces rediseñar completamente la experiencia móvil.

En pantallas menores a 768px, transformamos el carrusel en un **flujo vertical nativo**. Cada personaje se presenta como una portada de libro apilada, con scroll fluido (`scroll-behavior: smooth`), botones grandes y accesibles, y overlay de texto con efecto glassmorphism que garantiza legibilidad sin sacrificar la estética. Ocultamos las flechas de navegación y los puntos de paginación, porque en móvil el dedo del usuario es el mejor cursor.

Simultáneamente, optimizamos el **navbar**: en lugar de mantenerse rígido en una fila horizontal, se reorganiza verticalmente para evitar que la barra de búsqueda y el botón de tema se solapen o se escapen de la pantalla.

**Impacto para el usuario final:** Ahora es posible explorar todos los personajes con el pulgar, de forma natural y sin esfuerzo. Las tarjetas son grandes, los botones “Chatear” son fáciles de tocar, y la información de cada personaje se presenta sin competir por la atención. La aplicación se siente igual de mágica en un monitor 4K que en la pantalla de un celular de gama media.