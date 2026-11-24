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

Todo el texto y las imágenes viven en archivos Markdown con frontmatter. El schema está en `src/content.config.ts`: si un archivo tiene un error (falta un campo, una imagen no existe, un tipo es incorrecto), `pnpm build` falla y dice cuál.

| Qué | Dónde |
|---|---|
| Nombre, email, redes, títulos y textos del footer | `src/data/site.json` |
| Título del hero, tagline y tabs | `src/content/home/hero.md` |
| "Sobre mí": textos y fotos del carrusel | `src/content/home/sobre-mi.md` (el cuerpo del archivo es la bio) |
| "A pedido" | `src/content/home/a-pedido.md` |
| Cada proyecto | `src/content/proyectos/<slug>.md` |

### Proyectos

- El nombre del archivo es la URL: `bondilectivo.md` se publica en `/proyectos/bondilectivo/`.
- `order` define el orden en la home.
- `cover` es la imagen de la card y `hero` es la imagen principal del proyecto.
- `blocks` arma la página en el orden en que aparecen. Hay tres tipos de bloque:
  - `text`: título más cuerpo en Markdown.
  - `image`: una imagen a ancho completo.
  - `images`: dos o más imágenes lado a lado.
- Toda imagen lleva `alt`, una descripción breve de lo que se ve.

Para agregar un proyecto, se copia uno existente, se cambian los datos y se ponen las imágenes en `src/assets/img/<slug>/`. Las imágenes se suben en tamaño original: el build genera AVIF y WebP en varios tamaños.

### Restricciones a tener en cuenta

- **Ids de las tabs.** Los ids (`works`, `sobre-mi`, `a-pedido`) están escritos en `src/styles/components/home.css`. El `label` se puede cambiar libremente, pero un `id` nuevo o renombrado requiere actualizar ese CSS.
- **Carrusel.** Admite de 2 a 8 fotos. `interval` va de 1 a 12 segundos con un decimal como máximo; fuera de ese rango el build falla.
- **Clic en un puntito.** Al hacer clic en un puntito del carrusel, el avance automático se detiene en esa foto. Sin JavaScript no hay forma de retomarlo.

## Estructura

```
src/
  content/            contenido en Markdown (home y proyectos)
  content.config.ts   schema del contenido
  data/site.json      configuración general
  assets/img/         imágenes originales
  components/         Header, Footer, ProjectCard
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
