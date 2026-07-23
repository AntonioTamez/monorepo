## Deferred from: code review of story-1.1 (2026-07-19)

- URLs de remotos hardcodeadas a `localhost` en `apps/shell/src/main.ts`, sin mecanismo dev/prod — real para AD-7 (Cloudflare Pages, sub-paths), pero es trabajo de Story 5.x (deploy), no de Story 1.1.
- Sin fuente única de verdad que ligue el puerto de cada remote (declarado en su `project.json`) con las URLs hardcodeadas en `main.ts` del Shell — bajo riesgo con 4 apps estáticas; revisitar si el esquema de puertos cambia seguido o si se vuelve doloroso de mantener a mano.
- `initFederation(...).catch(err => console.error(err))` en `apps/shell/src/main.ts` traga cualquier fallo de carga de un Remote sin señal visible al usuario ni timeout — es exactamente el gap que AD-5 (RemoteUnavailableComponent) va a cerrar en **Story 1.5** (confirmado en Story 1.3: las 3 rutas federadas tampoco envuelven `loadRemoteModule` en un `.catch()`, a propósito — mismo gap, mismo diferimiento); no duplicar el fix ahí.
- `tsconfig.base.json` combina `target: es2015` con `lib: [es2020, dom]` sin explicación — heredado del template `angular` de Nx sin editar; no bloquea nada hoy porque esbuild controla el nivel de salida real, pero vale una limpieza futura.
- Tooling de testing (`vitest` para unit, plugin de `playwright` disponible) quedó fijado como default en `nx.json` pese a que la Architecture Spine difiere explícitamente la profundidad de testing (PRD Open Question 4) — es un default blando y fácil de cambiar; revisitar cuando esa pregunta se resuelva formalmente.

## Deferred from: code review of story-1.2 (2026-07-19)

- `enforceBuildableLibDependency: true` (ya existente en `eslint.config.mjs`) va a chocar con libs no-buildable creadas con `--bundler=none` (como recomiendan las Dev Notes de Story 1.2) el día que una app o feature-lib buildable dependa de una — revisitar cuando existan libs reales (Story 2.1+).
- Sin política de line-endings (`.gitattributes`) — genera warnings de LF→CRLF en cada `git` operation sobre varios archivos del repo; preexistente, no introducido por Story 1.2.
- Sin ningún chequeo automatizado/commiteado que proteja los `depConstraints` de `eslint.config.mjs` de una futura regresión — Architecture ya difiere explícitamente la profundidad de testing/CI, consistente con no resolverlo ahora.
- `type:util → []` (un util no puede depender de otro util) nunca se probó en la práctica — se va a ejercitar solo cuando `libs/shared/util-types` exista de verdad (Story 2.1).
- Las apps no llevan tag `type:*` (solo `scope:*`) — nada impide hoy que una app importe directo una lib `data-access`/`ui` saltándose su `feature` lib. Evaluar un tag `type:app` cuando existan libs `feature` reales para probarlo (Story 2.1+).

## Deferred from: code review of story-1.3 (2026-07-22)

- Tipado de `m.App` en `.then((m) => m.App)` (`apps/shell/src/app/app.routes.ts`) — `loadRemoteModule<T = any>` no da chequeo de tipos en compilación; si un Remote dejara de exportar `App`, solo fallaría en runtime. Requeriría tipar el contrato completo del módulo expuesto por cada Remote — evaluar cuando eso empiece a doler (probablemente cuando los Remotes expongan algo más que su `AppComponent` raíz, Epic 2+).
- Sin test unitario que confirme que `appRoutes` contiene los paths esperados — Architecture ya difiere explícitamente la profundidad de testing (PRD Open Question 4).
