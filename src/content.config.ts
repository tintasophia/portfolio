// Contrato de contenido: valida en build lo que se edita a mano o desde Keystatic (keystatic.config.ts).
// Si cambiás un campo acá, actualizá también keystatic.config.ts (son dos schemas del mismo contenido).
// Las imágenes se guardan como rutas relativas al archivo (ej: ../../assets/img/alice-in-wonderland/hero.jpg).
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

// ── Proyectos: src/content/proyectos/<slug>.yaml ────────────────────────────
// El slug sale del nombre del archivo. La página se arma con `blocks` en orden.
// Keystatic guarda cada bloque como { discriminant, value }; acá se normaliza a { type, ...campos }.
const proyectos = defineCollection({
  loader: glob({ pattern: "*.yaml", base: "./src/content/proyectos" }),
  schema: ({ image }) => {
    const img = z.object({ src: image(), alt: z.string().min(1) });
    const block = z
      .discriminatedUnion("discriminant", [
        z.object({ discriminant: z.literal("hero"), value: z.object({ image: img }) }),
        z.object({ discriminant: z.literal("text"), value: z.object({ title: z.string(), body: z.string() }) }),
        z.object({ discriminant: z.literal("image"), value: z.object({ image: img }) }),
        z.object({ discriminant: z.literal("images"), value: z.object({ images: z.array(img).min(2) }) }),
      ])
      .transform((b) => {
        switch (b.discriminant) {
          case "hero": return { type: "hero" as const, ...b.value };
          case "text": return { type: "text" as const, ...b.value };
          case "image": return { type: "image" as const, ...b.value };
          case "images": return { type: "images" as const, ...b.value };
        }
      });
    return z.object({
      title: z.string(),
      description: z.string(), // meta description (≤ 160 caracteres)
      category: z.string(), // badge: "Editorial", "Cuadro por encargo"…
      year: z.string(), // "2026" o un rango "2025 - 2026"
      services: z.array(z.string()).min(1),
      intro: z.string(),
      cover: img, // imagen de la card en la home y en "Proyectos recientes"
      blocks: z.array(block),
    });
  },
});

// ── Home: un archivo por sección en src/content/home/ ───────────────────────
const hero = defineCollection({
  loader: glob({ pattern: "hero.yaml", base: "./src/content/home" }),
  schema: z.object({
    title: z.object({ start: z.string(), accent: z.string(), end: z.string() }),
    tagline: z.string(),
    // Nombres visibles de las 3 pestañas. Los ids del DOM (#1, #2, #3) son fijos en el código y en home.css.
    tabs: z.object({ trabajos: z.string(), sobreMi: z.string(), aPedido: z.string() }),
  }),
});

const sobreMi = defineCollection({
  loader: glob({ pattern: "sobre-mi.md", base: "./src/content/home" }),
  schema: ({ image }) =>
    z.object({
      greeting: z.string(), // "Hola hola! Soy Sophi"
      lead: z.string(), // "Ilustradora y diseñadora gráfica de Córdoba, Argentina."
      photos: z
        .array(z.object({ src: image(), alt: z.string().min(1), caption: z.string().optional() }))
        .min(1),
      interval: z.number().default(4.2), // segundos por foto en el carrusel
      // cuerpo del .md = párrafos de la bio
    }),
});

const aPedido = defineCollection({
  loader: glob({ pattern: "a-pedido.yaml", base: "./src/content/home" }),
  schema: ({ image }) =>
    z.object({
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
      contactTitle: z.string().optional(), // frase de la tarjeta de contacto ("¿Arrancamos?")
      image: z.object({ src: image(), alt: z.string().min(1) }).optional(),
      imageMobile: z.object({ src: image(), alt: z.string().min(1) }).optional(), // recorte para < 810px
    }),
});

// ── Orden de los proyectos en la home: src/content/orden.yaml ───────────────
// Lista de slugs. Los proyectos que no estén en la lista van al final, por título.
const orden = defineCollection({
  loader: glob({ pattern: "orden.yaml", base: "./src/content" }),
  schema: z.object({ proyectos: z.array(z.string()).default([]) }),
});

export const collections = { proyectos, hero, sobreMi, aPedido, orden };
