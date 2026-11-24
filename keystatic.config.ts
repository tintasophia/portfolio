// Editor de contenido local (Keystatic). Se abre con `pnpm editor` → http://127.0.0.1:4321/keystatic
// Escribe directamente en src/content/**, src/data/site.json y src/assets/img/**.
// Es un segundo schema del mismo contenido: si cambiás un campo acá, actualizá también
// src/content.config.ts (que valida en el build).
import { createElement as h } from "react";
import { config, collection, singleton, fields } from "@keystatic/core";
import type { BasicFormField } from "@keystatic/core";
import { Combobox, Item } from "@keystar/ui/combobox";

const IMG = "src/assets/img";
const PUB = "../../assets/img"; // ruta relativa desde src/content/<carpeta>/ hasta src/assets/img

// ── Datos del proyecto que el editor necesita leer (Vite los incluye y los actualiza al guardar) ──
const projectFiles = import.meta.glob<string>("./src/content/proyectos/*.yaml", { query: "?raw", import: "default", eager: true });
const imageUrls = import.meta.glob<string>("./src/assets/img/**/*.{png,jpg,jpeg,webp,avif}", { query: "?url", import: "default", eager: true });

const field = (yaml: string, key: string) => {
  const m = yaml.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
  return m ? m[1].trim().replace(/^(['"])(.*)\1$/, "$2") : undefined;
};
const projects = Object.entries(projectFiles).map(([path, yaml]) => {
  const slug = path.split("/").pop()!.replace(/\.yaml$/, "");
  const cover = yaml.match(/^cover:\s*\n\s+src:\s*(.+)$/m)?.[1].trim();
  return {
    slug,
    title: field(yaml, "title") ?? slug,
    category: field(yaml, "category"),
    coverUrl: cover ? imageUrls[cover.replace(/^\.\.\/\.\.\//, "./src/")] : undefined,
  };
});
const categories = [...new Set(projects.map((p) => p.category).filter(Boolean))].sort((a, b) => a!.localeCompare(b!, "es")) as string[];

// ── Etiquetas con miniatura para las listas (arrays y bloques) ──────────────
type AssetValue = { data: Uint8Array; extension: string } | null;
const blobUrls = new WeakMap<Uint8Array, string>();
const assetUrl = (v: AssetValue) => {
  if (!v) return undefined;
  let url = blobUrls.get(v.data);
  if (!url) {
    url = URL.createObjectURL(new Blob([v.data as BlobPart], { type: `image/${v.extension === "jpg" ? "jpeg" : v.extension}` }));
    blobUrls.set(v.data, url);
  }
  return url;
};
/** Devuelve un elemento (miniatura + texto). Keystatic está parcheado para aceptar elementos en itemLabel. */
const thumbLabel = (text: string, url: string | undefined): string => {
  const thumb = url
    ? h("img", { src: url, alt: "", style: { width: 40, height: 40, objectFit: "cover", borderRadius: 6, flexShrink: 0 } })
    : h("span", { style: { width: 40, height: 40, borderRadius: 6, background: "#eeedea", flexShrink: 0 } });
  return h(
    "span",
    { "data-text": text, style: { display: "flex", alignItems: "center", gap: 12, minWidth: 0 } },
    thumb,
    h("span", { style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, text),
  ) as unknown as string;
};

// ── Campos propios ──────────────────────────────────────────────────────────

/** Imagen + texto alternativo. Conserva el nombre del archivo subido (sin los nombres
 *  automáticos de Keystatic tipo `blocks/1/value/images/0/src.png`).
 *  En proyectos se guarda en src/assets/img/<slug>/; en la home, en la subcarpeta `folder`. */
const picture = (label: string, folder?: string) => {
  const base = fields.image({
    label: "Imagen",
    directory: folder ? `${IMG}/${folder}` : IMG,
    publicPath: folder ? `${PUB}/${folder}` : PUB,
    validation: { isRequired: true },
    // nombre-legible-x7k2.jpg: sin espacios ni acentos, con un sufijo para no pisar otra imagen
    transformFilename: (name) => {
      const dot = name.lastIndexOf(".");
      const ext = dot > 0 ? name.slice(dot + 1).toLowerCase() : "jpg";
      const base = (dot > 0 ? name.slice(0, dot) : name)
        .normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
        .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "imagen";
      return `${base}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
    },
  });
  const src: typeof base = {
    ...base,
    serialize: (value, args) => base.serialize(value, { ...args, suggestedFilenamePrefix: undefined }),
  };
  return fields.object(
    {
      src,
      alt: fields.text({
        label: "Descripción de la imagen",
        description: "Qué se ve en la imagen, en una frase. La usan los lectores de pantalla y Google.",
        validation: { length: { min: 1 } },
      }),
    },
    { label },
  );
};
type PictureItem = { fields: { src: { value: AssetValue }; alt: { value: string } } };
const pictureLabel = (p: PictureItem, fallback = "Imagen", kind?: string) => {
  const text = p.fields.alt.value || fallback;
  return thumbLabel(kind ? `${kind} · ${text}` : text, assetUrl(p.fields.src.value));
};

/** Texto con sugerencias: elegir una categoría existente o escribir una nueva. */
function categoria(): BasicFormField<string> {
  return {
    kind: "form",
    label: "Categoría",
    Input({ value, onChange, autoFocus, forceValidation }) {
      return h(
        Combobox<{ name: string }>,
        {
          label: "Categoría",
          description: "Elegí una existente o escribí una nueva. Aparece como etiqueta sobre la imagen.",
          allowsCustomValue: true,
          width: "100%",
          menuTrigger: "focus",
          autoFocus,
          inputValue: value,
          onInputChange: onChange,
          onSelectionChange: (key) => key != null && onChange(String(key)),
          defaultItems: categories.map((name) => ({ name })),
          errorMessage: forceValidation && !value.trim() ? "Escribí o elegí una categoría" : undefined,
          children: (item: { name: string }) => h(Item<{ name: string }>, { key: item.name, children: item.name }),
        },
      );
    },
    defaultValue: () => "",
    parse: (v) => (typeof v === "string" ? v : ""),
    serialize: (v) => ({ value: v.trim() || undefined }),
    validate(v) {
      if (!v.trim()) throw new Error("Escribí o elegí una categoría");
      return v.trim();
    },
    reader: { parse: (v) => (typeof v === "string" ? v : "") },
  };
}

export default config({
  storage: { kind: "local" },
  locale: "es-ES",
  ui: {
    brand: { name: "Sophi · Contenido" },
    navigation: {
      Proyectos: ["proyectos", "orden"],
      Home: ["hero", "sobreMi", "aPedido"],
      General: ["site"],
    },
  },

  collections: {
    proyectos: collection({
      label: "Proyectos",
      path: "src/content/proyectos/*",
      format: { data: "yaml" },
      slugField: "title",
      columns: ["category", "year"],
      previewUrl: "/proyectos/{slug}/",
      schema: {
        title: fields.slug({
          name: { label: "Título" },
          slug: { label: "Dirección (URL)", description: "Se usa en /proyectos/<dirección>/. Evitá cambiarla una vez publicado." },
        }),
        category: categoria(),
        year: fields.text({ label: "Año", description: "Un año (2026) o un rango (2025 - 2026)" }),
        intro: fields.text({ label: "Introducción", multiline: true }),
        description: fields.text({
          label: "Descripción para Google",
          description: "Una o dos frases (máximo ~160 caracteres). Se muestra en buscadores y al compartir el link.",
          multiline: true,
          validation: { length: { min: 1, max: 200 } },
        }),
        services: fields.array(fields.text({ label: "Servicio" }), {
          label: "Servicios",
          itemLabel: (p) => p.value || "Servicio",
          validation: { length: { min: 1 } },
        }),
        cover: picture("Imagen de la tarjeta (home)"),
        blocks: fields.blocks(
          {
            hero: {
              label: "Imagen principal",
              itemLabel: (p) => pictureLabel(p.fields.image as unknown as PictureItem, "Sin descripción", "Imagen principal"),
              schema: fields.object({ image: picture("Imagen principal (apaisada, 16:9)") }),
            },
            text: {
              label: "Texto",
              itemLabel: (p) => `Texto · ${p.fields.title.value || "sin título"}`,
              schema: fields.object({
                title: fields.text({ label: "Título" }),
                body: fields.text({
                  label: "Texto",
                  multiline: true,
                  description: "Dejá una línea en blanco entre párrafos.",
                }),
              }),
            },
            image: {
              label: "Imagen grande",
              itemLabel: (p) => pictureLabel(p.fields.image as unknown as PictureItem, "Sin descripción", "Imagen grande"),
              schema: fields.object({ image: picture("Imagen grande") }),
            },
            images: {
              label: "Imágenes lado a lado",
              itemLabel: (p) => {
                const items = p.fields.images.elements as unknown as PictureItem[];
                return thumbLabel(`Imágenes lado a lado · ${items.length}`, assetUrl(items[0]?.fields.src.value ?? null));
              },
              schema: fields.object({
                images: fields.array(picture("Imagen"), {
                  label: "Imágenes",
                  itemLabel: (p) => pictureLabel(p as unknown as PictureItem),
                  validation: { length: { min: 2 } },
                }),
              }),
            },
          },
          { label: "Contenido de la página", description: "Se muestra en este orden. Arrastrá para reordenar." },
        ),
      },
    }),
  },

  singletons: {
    orden: singleton({
      label: "Orden en la home",
      path: "src/content/orden",
      format: { data: "yaml" },
      previewUrl: "/",
      schema: {
        proyectos: fields.array(fields.relationship({ label: "Proyecto", collection: "proyectos" }), {
          label: "Proyectos",
          description: "Arrastrá para cambiar el orden. Un proyecto nuevo que no esté en la lista aparece al final.",
          itemLabel: (p) => {
            const project = projects.find((x) => x.slug === p.value);
            return thumbLabel(project?.title ?? p.value ?? "Elegí un proyecto", project?.coverUrl);
          },
        }),
      },
    }),

    hero: singleton({
      label: "Portada",
      path: "src/content/home/hero",
      format: { data: "yaml" },
      previewUrl: "/",
      schema: {
        title: fields.object(
          {
            start: fields.text({ label: "Antes del símbolo" }),
            accent: fields.text({ label: "Símbolo destacado (violeta, cursiva)" }),
            end: fields.text({ label: "Después del símbolo" }),
          },
          { label: "Título" },
        ),
        tagline: fields.text({ label: "Bajada" }),
        tabs: fields.object(
          {
            trabajos: fields.text({ label: "Pestaña 1 (proyectos)" }),
            sobreMi: fields.text({ label: "Pestaña 2 (sobre mí)" }),
            aPedido: fields.text({ label: "Pestaña 3 (a pedido)" }),
          },
          { label: "Nombres de las pestañas" },
        ),
      },
    }),

    sobreMi: singleton({
      label: "Sobre mí",
      path: "src/content/home/sobre-mi",
      format: { contentField: "content" },
      previewUrl: "/sobre-mi/",
      schema: {
        greeting: fields.text({ label: "Saludo" }),
        lead: fields.text({ label: "Frase de presentación" }),
        photos: fields.array(picture("Foto", "sobre-mi"), {
          label: "Fotos del carrusel",
          description: "Entre 2 y 8 fotos.",
          itemLabel: (p) => pictureLabel(p as unknown as PictureItem, "Foto"),
          validation: { length: { min: 2, max: 8 } },
        }),
        interval: fields.number({
          label: "Segundos por foto",
          defaultValue: 4.2,
          step: 0.1,
          validation: { min: 1, max: 12 },
        }),
        content: fields.markdoc({
          label: "Biografía",
          extension: "md",
          // Solo lo que el sitio sabe mostrar: párrafos, negrita, cursiva, links y listas.
          options: {
            heading: false,
            blockquote: false,
            code: false,
            codeBlock: false,
            divider: false,
            image: false,
            table: false,
            strikethrough: false,
          },
        }),
      },
    }),

    aPedido: singleton({
      label: "A pedido",
      path: "src/content/home/a-pedido",
      format: { data: "yaml" },
      previewUrl: "/a-pedido/",
      schema: {
        eyebrow: fields.text({ label: "Título de la sección" }),
        title: fields.text({ label: "Pregunta destacada" }),
        subtitle: fields.text({ label: "Respuesta destacada" }),
        intro: fields.text({ label: "Texto principal", multiline: true }),
        groups: fields.array(
          fields.object({
            title: fields.text({ label: "Título" }),
            items: fields.array(fields.text({ label: "Ítem" }), { label: "Lista", itemLabel: (p) => p.value || "Ítem" }),
            text: fields.text({ label: "Texto", multiline: true }),
          }),
          { label: "Bloques", itemLabel: (p) => p.fields.title.value || "Bloque" },
        ),
        note: fields.text({ label: "Nota final", multiline: true }),
        image: picture("Ilustración", "a-pedido"),
        imageMobile: picture("Ilustración (versión celular)", "a-pedido"),
      },
    }),

    site: singleton({
      label: "Datos generales",
      path: "src/data/site",
      format: { data: "json" },
      previewUrl: "/",
      schema: {
        name: fields.text({ label: "Nombre", description: "Aparece arriba a la izquierda y en el pie." }),
        role: fields.text({ label: "Profesión" }),
        location: fields.text({ label: "Ubicación" }),
        title: fields.text({ label: "Título de la página (pestaña del navegador y Google)" }),
        description: fields.text({
          label: "Descripción para Google",
          multiline: true,
          validation: { length: { min: 1, max: 200 } },
        }),
        email: fields.text({ label: "Email de contacto", description: "El botón de contacto abre un mail a esta dirección." }),
        cta: fields.object({ label: fields.text({ label: "Texto del botón de contacto" }) }, { label: "Botón de contacto" }),
        social: fields.array(
          fields.object({
            label: fields.text({ label: "Nombre (Instagram, Behance…)" }),
            url: fields.url({ label: "Link" }),
          }),
          { label: "Redes", itemLabel: (p) => p.fields.label.value || "Red" },
        ),
        footer: fields.object(
          {
            blurb: fields.text({ label: "Texto del pie", multiline: true }),
            navTitle: fields.text({ label: "Título de la navegación" }),
            contactTitle: fields.text({ label: "Título de contacto" }),
          },
          { label: "Pie de página" },
        ),
        projectPage: fields.object(
          {
            yearLabel: fields.text({ label: "Etiqueta «Año»" }),
            servicesLabel: fields.text({ label: "Etiqueta «Servicios»" }),
            moreTitle: fields.text({ label: "Título de proyectos relacionados" }),
            moreButton: fields.text({ label: "Botón «ver todos»" }),
          },
          { label: "Página de proyecto" },
        ),
        lang: fields.text({ label: "Idioma (código)", description: "No cambiar salvo que el sitio cambie de idioma.", defaultValue: "es" }),
      },
    }),
  },
});
