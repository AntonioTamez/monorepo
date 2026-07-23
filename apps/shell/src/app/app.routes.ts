import { Route } from '@angular/router';
import { loadRemoteModule } from '@angular-architects/native-federation';
import { REMOTE_NAMES } from './remote-names';

// Ninguna ruta envuelve loadRemoteModule en un .catch(): si un Remote falla
// al cargar, el comportamiento de fallo queda intencionalmente sin manejar
// acá -- AD-5 (RemoteUnavailableComponent acotado al router-outlet) es
// Story 1.5, no esta historia.
export const appRoutes: Route[] = [
  {
    path: REMOTE_NAMES.catalogo,
    loadComponent: () =>
      loadRemoteModule(REMOTE_NAMES.catalogo, './Component').then(
        (m) => m.App,
      ),
  },
  {
    path: REMOTE_NAMES.carrito,
    loadComponent: () =>
      loadRemoteModule(REMOTE_NAMES.carrito, './Component').then(
        (m) => m.App,
      ),
  },
  {
    path: REMOTE_NAMES.perfil,
    loadComponent: () =>
      loadRemoteModule(REMOTE_NAMES.perfil, './Component').then((m) => m.App),
  },
  { path: '', redirectTo: REMOTE_NAMES.catalogo, pathMatch: 'full' },
  { path: '**', redirectTo: REMOTE_NAMES.catalogo },
];
