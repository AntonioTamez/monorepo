import { withNativeFederation, shareAll } from '@angular-architects/native-federation/config';

export default withNativeFederation({
  name: 'perfil',

  // TODO(Story 1.3): reemplazar por un export de rutas lazy (ej. './Routes')
  // apuntando a la feature lib del dominio -- exponer el AppComponent raiz es
  // provisional (Story 1.1 aun no crea rutas de negocio). Ver ARCHITECTURE-SPINE.md
  // Consistency Conventions: nunca el bootstrap completo del Remote.
  exposes: {
    './Component': './apps/perfil/src/app/app.ts',
  },

  shared: {
    ...shareAll(
      { singleton: true, strictVersion: true, requiredVersion: 'auto', build: 'package' },
      {
        overrides: {
          // includeSecondaries is an opt-out of ignoreUnusedDeps, so all of
          // @angular/core is shared to prevent mismatches.
          '@angular/core': { singleton: true, strictVersion: true, requiredVersion: 'auto', build: 'package', includeSecondaries: { keepAll: true } },
        },
      },
    ),
  },

  skip: [
    'rxjs/ajax',
    'rxjs/fetch',
    'rxjs/testing',
    'rxjs/webSocket',
    // Add further packages you don't need at runtime
  ],

  // Please read our FAQ about sharing libs:
  // https://shorturl.at/jmzH0

  features: {
    // ignoreUnusedDeps is enabled by default now
    // ignoreUnusedDeps: true,

    // Opt-in: groups chunks in remoteEntry.json for smaller metadata file
    denseChunking: true
  }
});
