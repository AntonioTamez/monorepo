import { initFederation } from '@angular-architects/native-federation';
import { REMOTE_NAMES } from './app/remote-names';

initFederation({
  [REMOTE_NAMES.catalogo]: 'http://localhost:4201/remoteEntry.json',
  [REMOTE_NAMES.carrito]: 'http://localhost:4202/remoteEntry.json',
  [REMOTE_NAMES.perfil]: 'http://localhost:4203/remoteEntry.json',
})
  .catch(err => console.error(err))
  .then(_ => import('./bootstrap'))
  .catch(err => console.error(err));
