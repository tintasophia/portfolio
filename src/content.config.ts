// Contrato de contenido. Cada archivo .md es una unidad editable (pensado para el editor local).
// Las imágenes se referencian con rutas relativas al .md (ej: ../../assets/img/alice-in-wonderland/hero.jpg).
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

// ── Proyectos: src/content/proyectos/<slug>.md ──────────────────────────────
// El slug sale del nombre del archivo. La página se arma con `blocks` en orden.
// Los textos de bloque son Markdown (se renderizan en build, sin JS en el cliente).
const proyectos = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/proyectos" }),
  schema: ({ image }) => {
    const img = z.object({ src: image(), alt: z.string().min(1) });
    const block = z.discriminatedUnion("type", [
      z.object({ type: z.literal("text"), title: z.string(), body: z.string() }),
      z.object({ type: z.literal("image"), image: img }),
      z.object({ type: z.literal("images"), images: z.array(img).min(2) }),
    ]);
    return z.object({
      title: z.string(),
      description: z.string(), // meta description (≤ 160 caracteres)
      category: z.string(), // badge: "Editorial", "Cuadro por encargo"…
      year: z.string(), // "2026" o un rango "2025 - 2026"
      services: z.array(z.string()).min(1),
      intro: z.string(),
      order: z.number().int(), // orden en la home (1 = primero)
      cover: img, // imagen de la card en la home y en "Proyectos recientes"
      hero: img, // portada del caso
      blocks: z.array(block),
    });
  },
});

// ── Home: src/content/home/{hero,sobre-mi,a-pedido}.md ─────────────────────
// Un archivo por sección. `section` discrimina el schema.
const home = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/home" }),
  schema: ({ image }) =>
    z.discriminatedUnion("section", [
      z.object({
        section: z.literal("hero"),
        title: z.object({ start: z.string(), accent: z.string(), end: z.string() }),
        tagline: z.string(),
        tabs: z.array(z.object({ id: z.string(), label: z.string() })).min(1), // id = ancla (#works…)
      }),
      z.object({
        section: z.literal("sobre-mi"),
        greeting: z.string(), // "Hola hola! Soy Sophi"
        lead: z.string(), // "Ilustradora y diseñadora gráfica de Córdoba, Argentina."
        photos: z
          .array(z.object({ src: image(), alt: z.string().min(1), caption: z.string().optional() }))
          .min(1),
        interval: z.number().default(4.2), // segundos por foto en el carrusel
        // cuerpo del .md = párrafos de la bio
      }),
      z.object({
        section: z.literal("a-pedido"),
        eyebrow: z.string(),
        title: z.string(),
        subtitle: z.string(),
        intro: z.string(),
        groups: z.array(
          z.object({
            title: z.string(),
            items: z.array(z.string()).optional(),
            text: z.string().optional(),
          }),
        ),
        note: z.string().optional(),
        image: z.object({ src: image(), alt: z.string().min(1) }).optional(),
        imageMobile: z.object({ src: image(), alt: z.string().min(1) }).optional(), // recorte para < 810px
      }),
    ]),
});

export const collections = { proyectos, home };
