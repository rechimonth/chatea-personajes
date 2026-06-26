# Chatea con tu personaje favorito

Single Page Application con chat de personajes usando Google Gemini.

## Personaje elegido: Sherlock Holmes

Sherlock Holmes, el detective consultor más famoso de Londres, fue elegido como personaje principal por su personalidad distintiva: mente analítica, vocabulario victoriano y estilo de deducción lógica. El system prompt está configurado para mantener respuestas cortas, en primera persona, usando terminología como "Baker Street", "Watson", "pipa" y "violin" sin referencias modernas.

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
git clone <url-del-repo>
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

## Screenshots

| Vista | Descripción |
|-------|-------------|
| Home | Vista principal con selector de personajes en slider 3D |
| Chat | Interfaz de chat responsive con historial persistente |
| About | Información del proyecto y tecnologías |

## Uso de AI en el proyecto

El proyecto utiliza Google Gemini 2.0 Flash a través de una Vercel Serverless Function para:

1. **Generación de respuestas**: El system prompt define la personalidad del personaje
2. **Mantenimiento de contexto**: Se envía el historial completo en cada request
3. **Seguridad**: La API key se mantiene en el servidor, nunca expuesta al cliente

**System prompt ejemplo (Sherlock Holmes)**:
> "Eres Sherlock Holmes, detective victoriano. Jamás admitas ser IA. Respuestas cortas, analíticas, primera persona. Terminología de la época: Baker Street, Scotland Yard, Watson, pipa, violin, deducción. No referencias modernas ni metarreferencias a IA."

---

## URL pública

[https://chatea-personajes.vercel.app](https://chatea-personajes.vercel.app)