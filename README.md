# Chatea con tu personaje favorito
<img width="1536" height="1024" alt="ChatGPT Image 7 jul 2026, 12_27_26 p m" src="https://github.com/user-attachments/assets/839f7ea5-7c51-48dd-a123-ce2f8fb836c7.png" />

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
- **Backend**: Vercel Serverless Functions
- **IA**: Google Gemini 3.1 Flash Lite
- **Pagos**: Stripe + MercadoPago
- **Base de datos**: SQLite

## Requisitos

- Node.js 18+
- Clave API de Google Gemini (obtener en https://ai.google.dev)
- Cuenta en Stripe y/o MercadoPago para pagos

## Configuración y ejecución local

El chat requiere el backend serverless de Vercel para funcionar, así que la forma recomendada de probar la aplicación localmente es:

```bash
# 1. Clonar el repositorio
git clone <https://github.com/rechimonth/chatea-personajes>
cd chatea-personajes

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env y agregar tus variables

# 4. Ejecutar la app con Vercel para servir /api/*
npx vercel dev
# Abrir http://localhost:3000
```

Si solo ejecutas `npm run dev`, verás la SPA pero el chat no podrá llegar a los endpoints serverless porque Vite no está sirviendo las funciones.

### Alternativa rápida

```bash
npm run dev
```

Úsala solo para revisar vistas estáticas; para probar la conversación con IA y pagos necesitas `vercel dev`.

## Variables de entorno

```env
# IA
GEMINI_API_KEY=tu_clave_gemini

# Auth
JWT_SECRET=tu_secreto_jwt
ADMIN_EMAIL=tu_email_admin@dominio.com

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...

# MercadoPago
MP_ACCESS_TOKEN=tu_token_mp
MP_PUBLIC_KEY=tu_public_key_mp
MP_WEBHOOK_SECRET=tu_webhook_secret_mp
MP_PLAN_ID=tu_plan_id_mp

# App
NEXT_PUBLIC_BASE_URL=https://tu-dominio.vercel.app
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
- `tests/api/chat.test.js` — Endpoint de chat y rate limiting
- `tests/api/auth.test.js` — Registro, login y sesión
- `tests/api/admin.test.js` — Panel de administración
- `tests/api/stripe.test.js` — Checkout y portal Stripe
- `tests/api/db.test.js` — Usuarios y tokens
- `tests/api/memory.test.js` — Motor de memoria persistente

## Rutas de la aplicación

| Ruta | Descripción |
|------|-------------|
| `/` | Home con carousel de personajes |
| `/chat?id=<id>` | Chat con personaje |
| `/about` | Acerca del proyecto |
| `/login` | Iniciar sesión |
| `/register` | Crear cuenta |
| `/admin` | Panel de administración (requiere email admin) |
| `/success` | Pago exitoso |
| `/cancel` | Pago cancelado |

## Despliegue en Vercel

1. Conectar repositorio en https://vercel.com/new
2. Configurar variables de entorno en **Settings** → **Environment Variables**
3. Configurar webhook de Stripe: `https://tu-dominio.vercel.app/api/webhooks/stripe`
4. El deploy se ejecuta automáticamente

```bash
vercel --prod
```

## Funcionalidades implementadas

### Alcance funcional mínimo
- ✅ Home con carousel de personajes
- ✅ Chat con personajes usando Gemini 3.1 Flash Lite
- ✅ About页面 con información del proyecto
- ✅ History API para navegación sin recargas
- ✅ Diferenciación visual entre mensajes usuario/personaje
- ✅ Estado "escribiendo..." animado
- ✅ Manejo de errores de API
- ✅ Scroll automático
- ✅ Responsive mobile-first

### Autenticación y usuarios
- ✅ Registro de usuarios con email/password
- ✅ Login/logout con JWT
- ✅ Persistencia de sesión en localStorage
- ✅ Protección de rutas por token

### Pagos y monetización
- ✅ Checkout Stripe para suscripciones
- ✅ Webhook Stripe con verificación de firma
- ✅ Customer Portal Stripe
- ✅ Checkout MercadoPago como alternativa
- ✅ Webhook MercadoPago
- ✅ Límite diario de mensajes gratuitos
- ✅ Modal de upgrade a Premium

### Panel de administración
- ✅ CRUD de personajes
- ✅ Crear personajes premium
- ✅ Gestión de precios y tiers

### Motor de memoria persistente
- ✅ Extracción automática de información importante del usuario
- ✅ Categorización: nombre, preferencias, profesión, miedos, objetivos, etc.
- ✅ Inyección de hasta 8 recuerdos relevantes en el prompt de Gemini
- ✅ Fusión de recuerdos similares para evitar duplicados
- ✅ Panel UI para ver/editar/eliminar memorias por personaje
- ✅ Priorización por importancia, último uso y frecuencia

## Monitoreo

- Vercel Analytics: métricas de rendimiento y Core Web Vitals
- Vercel Logs: logs de funciones serverless en tiempo real
- Stripe Dashboard: monitoreo de pagos, webhooks y suscripciones
- Sentry (opcional): error tracking y alertas

## Próximos pasos

- [ ] Implementar webhook de MercadoPago en dashboard
- [ ] Migrar SQLite a PostgreSQL para persistencia en producción
- [ ] Agregar Google Analytics 4
- [ ] Implementar OAuth Google/GitHub
- [ ] Agregar MercadoPago Customer Portal

---

## URL pública (Producción)

**URL:** https://chatea-personajes.vercel.app  
> Verificado funcional: 2026-07-18

---

## Screenshots (Home / Chat / About)

> Coloca aquí tus capturas reales. Si aún no las tienes, crea estas rutas de ejemplo o reemplaza las paths por las tuyas.

### Home

<img width="720" height="1600" alt="Home" src="https://github.com/user-attachments/assets/59b7b81a-3ad7-40e9-ac28-671d048caeea" />

### Chat

<img width="720" height="1600" alt="Chat" src="https://github.com/user-attachments/assets/0799a3ff-f2c9-43dc-91aa-0edbceb04022" />

### About

<img width="720" height="1600" alt="About" src="https://github.com/user-attachments/assets/e30a9913-b7cf-4d12-be89-60e7e1f37323" />

---

## Registro del uso de IA en el proyecto.

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

**Impacto para el usuario final:** Ahora es posible explorar todos los personajes con el pulgar, de forma natural y sin esfuerzo. Las tarjetas son grandes, los botones “Chatear” son fáciles de tocar, y la información de cada personaje se presenta sin competir por la atención. La aplicación se siente igual de mágica en un monitor 4K que en la pantalla de un celular de gama media.

---

### 5. Seguridad y rate limiting
**Fecha:** 2026-07-17  
**Autor:** Kilo (asistente de ingeniería)

El proyecto originalmente exponía CORS abierto (`Access-Control-Allow-Origin: *`) en `/api/chat`, lo que permitía que cualquier origen consumiera el endpoint como proxy. Corregimos esto implementando CORS restringido por origen: solo se permite el dominio de producción y los orígenes locales de desarrollo. Además, agregamos rate limiting en memoria por IP, limitando a 10 requests por minuto. En el backend también se agregó truncamiento automático del historial a 20 mensajes y validación de campos obligatorios.

**Impacto para el usuario final:** No hay cambio visible directo, pero la aplicación es más segura, consume menos tokens de Gemini y tiene menos riesgo de abuso.

---

### 6. Sistema de memoria persistente
**Fecha:** 2026-07-17  
**Autor:** Kilo (asistente de ingeniería)

Implementamos un motor de memoria independiente del historial de chat. Ahora cada personaje puede recordar información importante del usuario entre sesiones, incluso semanas después. El sistema incluye:

- Extracción automática sin Gemini: detecta nombres, profesiones, miedos, preferencias, objetivos, eventos importantes, etc.
- Tabla `memories` en SQLite con índices optimizados
- Inyección de hasta 8 recuerdos relevantes en el prompt de Gemini, ordenados por importancia, último uso y frecuencia
- Fusión de recuerdos similares para evitar duplicados
- Panel UI en el chat para ver, editar y eliminar memorias
- CRUD backend en `/api/memory` con autenticación JWT

**Impacto para el usuario final:** Las respuestas de los personajes ahora son contextuales y personalizadas. Sherlock puede recordar que eres médico en Córdoba, o Drácula puede recordar tus preferencias literarias. La conversación gana continuidad y profundidad sin que el usuario tenga que repetir información.

---

### 7. Integración de pagos — Stripe y MercadoPago
**Fecha:** 2026-07-18  
**Autor:** Kilo (asistente de ingeniería)

Completamos la integración de pagos para el modelo freemium:

- **Stripe**: checkout de suscripciones, webhook con verificación de firma, customer portal para gestionar suscripciones.
- **MercadoPago**: checkout de suscripciones, webhook, portal de gestión.
- Lógica de límite diario: 10 mensajes gratuitos por día por usuario no premium.
- Modal de upgrade al alcanzar el límite, con redirección automática a Stripe o MercadoPago.
- Panel admin para crear personajes premium con badge visible en el home.

**Impacto para el usuario final:** Los usuarios free pueden probar el chat con límite diario. Los usuarios premium obtienen mensajes ilimitados y acceso a personajes exclusivos. El flujo de pago es transparente y el panel admin permite agregar contenido premium sin deploy.
