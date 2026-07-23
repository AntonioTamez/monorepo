// Fuente única de verdad para los nombres de Remote federados. Usado por
// main.ts (initFederation) y app.routes.ts (loadRemoteModule) para que un
// typo/rename se detecte en compilación, no recién en runtime.
export const REMOTE_NAMES = {
  catalogo: 'catalogo',
  carrito: 'carrito',
  perfil: 'perfil',
} as const;
