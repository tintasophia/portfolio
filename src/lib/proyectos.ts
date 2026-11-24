import { getCollection, getEntry } from "astro:content";

/** Proyectos en el orden de src/content/orden.yaml. Los que no figuran en la lista van al final, por título. */
export async function getProyectosOrdenados() {
  const [all, orden] = await Promise.all([getCollection("proyectos"), getEntry("orden", "orden")]);
  const list = orden?.data.proyectos ?? [];
  const pos = (id: string) => (list.includes(id) ? list.indexOf(id) : Infinity);
  return all.sort((a, b) => pos(a.id) - pos(b.id) || a.data.title.localeCompare(b.data.title, "es"));
}
