# sophi-web

Portfolio de Sophia Oller Schmid, ilustradora y diseñadora gráfica de Córdoba, Argentina.

Es un sitio 100 % estático hecho con [Astro](https://astro.build) y Tailwind CSS 4. En el navegador **no corre JavaScript**: las tabs, el carrusel y los hovers están resueltos con HTML y CSS.

## Uso

```sh
pnpm install
pnpm dev       # servidor local con recarga
pnpm build     # genera el sitio en dist/
pnpm preview   # sirve dist/ para revisarlo
pnpm check     # valida tipos y contenido
```

Para publicar, se sube `dist/` a cualquier hosting estático.

## Editar el contenido

### Con el editor (recomendado)

```sh
pnpm editor
```

Abre el editor (Keystatic) en http://127.0.0.1:4321/keystatic/. Al guardar, escribe directamente en `src/content/`, `src/data/site.json` y `src/assets/img/`. Mientras corre, el sitio se puede ver en http://127.0.0.1:4321/ y se actualiza solo. El botón **Ver página** abre la página que se está editando.

| Sección del editor | Qué edita | Archivo |
|---|---|---|
| Proyectos | Cada proyecto: textos, categoría, imágenes y bloques de contenido | `src/content/proyectos/<slug>.yaml` |
| Orden en la home | Orden de las cards (se arrastra). Un proyecto nuevo que no esté en la lista aparece al final | `src/content/orden.yaml` |
| Portada | Título, bajada y nombres de las pestañas | `src/content/home/hero.yaml` |
| Sobre mí | Saludo, fotos del carrusel y biografía | `src/content/home/sobre-mi.md` |
| A pedido | Textos e ilustración de la sección | `src/content/home/a-pedido.yaml` |
| Datos generales | Nombre, email, redes, SEO, textos del pie y de la página de proyecto | `src/data/site.json` |

El editor existe únicamente en desarrollo local. El sitio publicado (`pnpm build`) no lo incluye y sigue sin JavaScript.

### A mano

Los mismos archivos se pueden editar con cualquier editor de texto. El schema está en `src/content.config.ts`: si un archivo tiene un error (falta un campo, una imagen no existe, un tipo es incorrecto), `pnpm build` falla y dice cuál.

Si se agrega o cambia un campo, hay que tocar **los dos schemas**: `keystatic.config.ts` (formularios del editor) y `src/content.config.ts` (validación del build).

### Proyectos

- El nombre del archivo es la URL: `bondilectivo.yaml` se publica en `/proyectos/bondilectivo/`.
- `category` es la etiqueta de la card. En el editor se elige una existente o se escribe una nueva.
- `cover` es la imagen de la card en la home.
- `blocks` arma la página en el orden en que aparecen. Hay cuatro tipos:
  - **Imagen principal** (`hero`): apaisada, 16:9. Es opcional.
  - **Texto** (`text`): título más cuerpo en Markdown.
  - **Imagen grande** (`image`): una imagen a ancho completo.
  - **Imágenes lado a lado** (`images`): dos o más.
- Toda imagen lleva `alt`, una descripción breve de lo que se ve.

Las imágenes se suben en tamaño original y van en `src/assets/img/<slug>/`. El editor les pone un nombre legible a partir del archivo subido (`Foto Ñandú.JPG` pasa a `foto-nandu-x7k2.jpg`, donde el sufijo evita pisar otra imagen). El build genera AVIF y WebP en varios tamaños, más un placeholder difuminado de unos 300 bytes que se ve mientras carga la imagen real.

### Restricciones a tener en cuenta

- **Pestañas.** La home siempre tiene tres. Se puede cambiar el nombre visible de cada una, pero no su contenido ni su orden: los ids (`#1`, `#2`, `#3`) están fijos en `src/components/home/Home.astro` y `src/styles/components/home.css`.
- **Carrusel.** Admite de 2 a 8 fotos. `interval` va de 1 a 12 segundos con un decimal como máximo; fuera de ese rango el build falla.
- **Clic en un puntito.** Al hacer clic en un puntito del carrusel, el avance automático se detiene en esa foto. Sin JavaScript no hay forma de retomarlo.
- **Transparencia.** Si se sube una imagen con transparencia, el placeholder difuminado se vería a través. Para esos casos, el componente `Img` acepta `placeholder={false}`.

### Parche de Keystatic

`patches/@keystatic__core@0.6.10.patch` (aplicado automáticamente por pnpm) hace cuatro cosas:
- Traduce al español los textos de la interfaz que Keystatic no localiza.
- Permite miniaturas en las listas (fotos, bloques, orden).
- Agrega el botón **Ver página**.
- Conserva el nombre original de las imágenes en vez de usar nombres automáticos.

Si se actualiza Keystatic, el parche deja de aplicar y hay que rehacerlo para la versión nueva.

## Editor visual (prueba de concepto, rama `editor-visual`)

Una prueba interna del editor visual de Landing Factory sobre este sitio: la página real en mobile y desktop lado a lado, un inspector de estilos que escribe clases de Tailwind y, al costado, Claude Code de dos formas: un **chat** (por ACP: muestra los pasos, pide permiso con el diff antes de tocar archivos) y una **terminal**.

```sh
pnpm editor:visual   # http://127.0.0.1:5171/__editor/
```

- Requiere el editor en `~/orca/workspaces/landing-factory/editor-sophi-poc/experiments/editor-proto` (rama `0xFrann/editor-sophi-poc` de landing-factory, `pnpm install --ignore-workspace` ahí) o la ruta en `LF_EDITOR_DIR`, y `claude` con sesión iniciada.
- Todo se edita en una **copia de trabajo**; este repo no cambia hasta que se toca **Guardar en sophi-web**, que copia los archivos cambiados (sin los `data-lf-id` del editor). Después se revisa con `git diff` y se commitea como siempre.
- Todas las páginas: se eligen arriba (la home y cada proyecto).
- **Tema:** sin nada seleccionado, el panel derecho edita los tokens del `@theme` de `src/styles/global.css` (colores, tipografía, radios, sombras). Se ve al instante en todo el sitio y se deshace como cualquier edición. Abajo lista los valores escritos a mano fuera del tema.
- **Keystatic adentro (modo Contenido):** el mismo Keystatic de `pnpm editor`, pero servido por el editor y sobre su copia de trabajo, al lado de la página en vivo. Lo que se guarda en Keystatic se ve en el canvas y queda en el historial ("Keystatic"); lo que se cambia en el canvas aparece en Keystatic. En la página de un proyecto abre ese proyecto; en el inspector, un texto que sale del contenido tiene **Editar en Keystatic**.
- **El asistente (chat):** por defecto en modo **Simple**, pensado para Sophi: habla en términos de diseño, sin archivos ni código, aplica los cambios sin pedir permiso (todo se deshace con ⌘Z) y usa Sonnet para no gastar el límite de uso. El botón ⚡ (**Pedido difícil**) usa un modelo más potente solo para el próximo pedido; si algo no quedó bien, **Probar de nuevo con más potencia** hace lo mismo. **Simple/Detallado** (arriba del chat) muestra los pasos técnicos y la terminal.
- **El repo manda:** al arrancar y mientras corre, lo que cambió en el repo (Keystatic abierto por separado, un `git pull`, el IDE) entra a la copia de trabajo, salvo los archivos con cambios sin guardar en el editor, que avisa. Mejor usar el Keystatic del editor mientras está abierto.

## Estructura

```
keystatic.config.ts   editor: formularios y campos propios
patches/              parche de Keystatic
src/
  content/            contenido (YAML y Markdown): home, proyectos y orden
  content.config.ts   schema del contenido (validación del build)
  lib/proyectos.ts    proyectos ordenados según orden.yaml
  data/site.json      configuración general
  assets/img/         imágenes originales
  components/         Header, Footer, ProjectCard, Img (imagen con placeholder)
  components/home/    Hero, Tabs, paneles y Carousel
  layouts/Base.astro  <head>, SEO y estructura de página
  pages/              index y proyectos/[slug]
  styles/
    global.css        tokens de diseño (@theme): colores, tipografía, radios, breakpoints
    components/       CSS que Tailwind no expresa bien: tabs, carrusel, glow
```

Breakpoints: base (< 810 px), `md` (≥ 810 px) y `lg` (≥ 1200 px).

## Pendiente

- Definir el dominio en `astro.config.mjs` (`site`). Hoy tiene uno provisorio, y de él dependen el canonical y las imágenes que aparecen al compartir el link.
- Agregar `robots.txt` y un sitemap cuando el dominio esté definido.
