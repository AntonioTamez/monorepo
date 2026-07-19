# Addendum — Monorepo de Microfrontends con Angular y Nx

*Complementa `prd.md`. Contenido técnico de implementación, decisiones de mecanismo/transporte y detalle de investigación que no pertenece al cuerpo del PRD, pero que informó sus decisiones de capacidad (§4.1, §9 del PRD) y sirve de insumo directo para `bmad-architecture` / `bmad-ux` cuando arranque esa fase.*

## Decisión técnica: Native Federation vs. Module Federation

**Elegido: Native Federation** (`@angular-architects/native-federation`), sobre Module Federation clásico (webpack-based, ahora también disponible vía `@module-federation/enhanced` integrado en `@nx/angular` desde Nx 19.5+).

**Por qué:**
- Se integra nativamente con el `ApplicationBuilder` de Angular basado en esbuild (disponible desde Angular 17.1+), sin depender de Webpack.
- Builds notablemente más rápidos: casos reportados de ~45s a menos de 10s en incremental.
- Usa ESM + import maps — estándares web — en vez del runtime propietario de Webpack.
- Es la recomendación dominante de la comunidad Angular/Nx (angular-architects, Manfred Steyer) para proyectos **nuevos y 100% Angular** en 2026.

**Cuándo Module Federation clásico seguiría siendo la opción correcta** (no aplica a este proyecto, pero vale registrarlo): federación **políglota** (mezclar Angular con React/Vue) o partir de un setup Webpack existente. Nx también ofrece Rspack (`--bundler=rspack`) como punto intermedio: compatible con el ecosistema Webpack pero con builds más rápidos.

## Arquitectura de referencia: shell + N remotos

- **Host/Shell**: contenedor que carga remotos en runtime.
- **Remote**: app independiente que expone módulos/rutas.
- **Static federation** (usado en el MVP de este proyecto): URLs de remotos fijas en la config del shell.
- **Dynamic federation** (evaluado como extensión v2): URLs resueltas en runtime, típicamente desde un manifest — patrón recomendado por Nx para producción real.

Generadores Nx relevantes:
```
nx g @nx/angular:host apps/shell --remotes=catalogo,carrito,perfil
nx g @nx/angular:remote apps/catalogo --host=shell
```

Nx coloca cada app en `apps/` y expone rutas lazy-loaded vía `loadRemoteModule` / `loadChildren` con `import(...)`.

Patrón de librerías compartidas en `libs/`: design system/UI kit, auth/session, y (si se necesitara) state management cross-remote (NgRx u otro store). Estas libs se comparten como `singleton: true` en la config de federation para evitar duplicar Angular/RxJS en cada remoto.

## Pitfalls comunes al aprender esto (para tener presente durante el desarrollo)

- **Version mismatch** entre shell y remotos (Angular, RxJS) — mitigarlo declarando `singleton: true` y fijando `requiredVersion` / `strictVersion`.
- Exponer el `AppModule` completo en vez de feature modules/componentes lazy — antipatrón documentado por angular-architects.
- Olvidar compartir dependencias transitivas de las librerías compartidas (no solo las directas).
- Confundir *independent deployability* (remotos deployados por separado, cada uno con su propio pipeline) con la realidad de que en desarrollo/aprendizaje casi siempre hay acoplamiento en build-time vía Nx — de ahí que FR-9 del PRD exija explícitamente serve/build aislado por remoto como el mínimo verificable de esa independencia.
- Routing cross-remoto mal configurado (rutas hijas que no calzan con el remote entry).
- `nx affected` volviéndose inútil si las libs compartidas generan un grafo de dependencias tipo "spaghetti" (todo importa todo) — de ahí el NFR de DX en §7 del PRD.

## Recursos de referencia

- Docs oficiales Nx: [Module Federation and Nx](https://nx.dev/docs/technologies/module-federation/concepts/module-federation-and-nx)
- Docs oficiales Nx: [Dynamic Module Federation with Angular](https://nx.dev/docs/technologies/angular/guides/dynamic-module-federation-with-angular)
- Blog angular-architects: [Pitfalls with Module Federation and Angular](https://www.angulararchitects.io/en/blog/pitfalls-with-module-federation-and-angular/)
- Blog angular-architects: [Getting Out of Version-Mismatch-Hell](https://www.angulararchitects.io/en/blog/getting-out-of-version-mismatch-hell-with-module-federation/)
- Angular Blog (Manfred Steyer): [Micro Frontends with Angular and Native Federation](https://blog.angular.dev/micro-frontends-with-angular-and-native-federation-7623cfc5f413)
- Repo de ejemplo: [subodhgodbole/mfe-angular-nx](https://github.com/subodhgodbole/mfe-angular-nx) (shell + mfe1/2/3)
- README técnico: [module-federation-plugin (native-federation)](https://github.com/angular-architects/module-federation-plugin/blob/main/libs/native-federation/README.md)

## Alcance mínimo viable vs. sobre-ingeniería (input directo para §6 del PRD)

**MVP razonable:** 1 shell + 3 remotos (Native Federation), 1 lib compartida de UI/design system, routing básico shell→remoto vía lazy loading, y un concepto simple de sesión compartida (signal/servicio de auth en `libs/shared/auth`). Suficiente para entender federation, boundaries de Nx y shared singletons.

**Sobre-ingeniería para este proyecto:** pipelines CI/CD independientes por remoto con deploys separados a distintos hosts, runtime plugins avanzados de Module Federation, soporte políglota, manifests dinámicos servidos desde un backend real, NgRx completo con efectos complejos, o multi-versión de Angular entre remotos.
