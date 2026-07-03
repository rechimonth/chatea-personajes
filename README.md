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

---

## URL pública

[https://chatea-personajes.vercel.app](https://chatea-personajes.vercel.app)