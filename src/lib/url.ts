// Prefija rutas internas con el `base` de Astro (en producción "/portfolio/",
// en dev "/"). Usar siempre para links a páginas o a archivos de /public.
export const url = (path = "") => import.meta.env.BASE_URL + path.replace(/^\//, "");
