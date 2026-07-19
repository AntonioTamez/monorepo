import { initFederation } from '@angular-architects/native-federation';

initFederation({
  'catalogo': 'http://localhost:4201/remoteEntry.json',
  'carrito': 'http://localhost:4202/remoteEntry.json',
  'perfil': 'http://localhost:4203/remoteEntry.json'
})
  .catch(err => console.error(err))
  .then(_ => import('./bootstrap'))
  .catch(err => console.error(err));
