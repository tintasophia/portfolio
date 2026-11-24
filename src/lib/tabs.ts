// Las tres páginas de la home (antes pestañas en una sola página). La dirección es fija; el nombre
// visible sale de hero.yaml (Keystatic: Portada → Nombres de las pestañas).
import { getEntry } from "astro:content";

export const TABS = [
  { key: "trabajos", href: "/" },
  { key: "sobreMi", href: "/sobre-mi/" },
  { key: "aPedido", href: "/a-pedido/" },
] as const;

export type TabKey = (typeof TABS)[number]["key"];
export type Tab = (typeof TABS)[number] & { label: string };

/** Las pestañas con su nombre visible. */
export async function getTabs(): Promise<Tab[]> {
  const hero = await getEntry("hero", "hero");
  if (!hero) throw new Error("Falta src/content/home/hero.yaml");
  return TABS.map((t) => ({ ...t, label: hero.data.tabs[t.key] }));
}

/** Ancla justo sobre la barra de pestañas: los links a las pestañas llegan ahí, así la barra
 *  queda arriba y el contenido de la pestaña a la vista (sin JS, el scroll lo hace el ancla). */
export const CONTENT_ANCHOR = "contenido";
export const tabHref = (t: { href: string }) => `${t.href}#${CONTENT_ANCHOR}`;
