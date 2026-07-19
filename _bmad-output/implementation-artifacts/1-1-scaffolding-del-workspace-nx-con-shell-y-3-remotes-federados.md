---
baseline_commit: dd4b848
---

# Story 1.1: Scaffolding del workspace Nx con Shell y 3 Remotes federados

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Antonio (dev),
I want generar el workspace Nx con Shell + 3 Remotes (Catálogo, Carrito, Perfil) vía Native Federation,
so that tengo la base federada mínima corriendo antes de construir cualquier feature.

## Acceptance Criteria

1. Existen 4 proyectos Angular en el workspace Nx: `apps/shell`, `apps/catalogo`, `apps/carrito`, `apps/perfil`.
2. Cada uno de los 4 proyectos tiene su propio archivo de configuración de Native Federation, generado por el schematic de `@angular-architects/native-federation` (no escrito a mano).
3. Angular y RxJS están declarados `shared`/`singleton: true` (+ `strictVersion`/`requiredVersion` fijado) en los 4 archivos de configuración de federación — [Source: architecture/ARCHITECTURE-SPINE.md#AD-6].
4. `nx serve shell` levanta el Shell sin errores de consola, con los 3 Remotes registrados en su configuración de federación (no hace falta que las rutas rendericen contenido de negocio todavía — eso es Story 1.3).

## Tasks / Subtasks

- [x] Task 0: Inicializar el workspace Nx en la raíz del repo (prerrequisito de AC 1 — el repo hoy no tiene `nx.json`/`package.json`)
  - [x] `npx create-nx-workspace@23.1.0 . --preset=apps ...` → **falló más adelante** (ver Completion Notes: el preset "apps" mapea a un template TS con `composite: true`, incompatible con `@nx/angular:application`). Se rehizo con `--template=angular` (`nrwl/angular-template`), que sí trae un `tsconfig.base.json` compatible con Angular, y se removió el contenido demo que ese template trae (apps `shop`/`shop-e2e`/`api`, libs `packages/*`) — no correspondían a este proyecto (el PRD prohíbe backend real).
  - [x] `@nx/angular` instalado como devDependency exacta (23.1.0)
  - [x] `npx nx --version` confirmado: Local v23.1.0
- [x] Task 1: Crear los 4 proyectos Angular base en el workspace Nx (AC: 1)
  - [x] `npx nx g @nx/angular:application apps/{shell,catalogo,carrito,perfil} --routing=true --style=css --e2eTestRunner=none` — generador real confirmado con `--help` antes de correr (bundler default esbuild, standalone default true — coincide con Architecture)
  - [x] `strict: true` confirmado en `apps/*/tsconfig.json` (heredado del template Angular, no del preset original que se descartó)
- [x] Task 2: Instalar e inicializar Native Federation en cada proyecto (AC: 2, 3)
  - [x] `@angular-architects/native-federation@22.0.6` instalado con `--save-exact`
  - [x] `nx g @angular-architects/native-federation:init --project shell --type host --port 4200`
  - [x] `nx g ... --project catalogo --type remote --port 4201`
  - [x] `nx g ... --project carrito --type remote --port 4202`, `nx g ... --project perfil --type remote --port 4203`
  - [x] Verificado en los 4 `federation.config.mjs`: `shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto', build: 'package' })` — el schematic ya lo trae por defecto para **todas** las deps compartidas (no solo Angular/RxJS), superando el mínimo de AD-6. `requiredVersion: 'auto'` lee la versión real instalada en vez de un string hardcodeado — cierra en la práctica la preocupación de Architecture sobre una única fuente de verdad de versión.
- [x] Task 3: Verificar federación end-to-end (AC: 4)
  - [x] `nx serve shell` en background → build completo en ~2.3s, sirvió HTTP 200 en `http://localhost:4200/` con HTML válido (ESM shims activos para federación).
  - [x] **[Code review]** Re-verificado con los 4 servers corriendo a la vez (`nx serve shell/catalogo/carrito/perfil`): las 4 raíces (`/`) y los 3 `remoteEntry.json` responden HTTP 200 — la condición real que valida AC4 (initFederation no cae en el `.catch` cuando los remotes existen). Sigue sin haber navegador real en este entorno para confirmar la consola visualmente, pero el precondition de red está confirmado.
  - [x] `main.ts` del Shell corregido a mano: el generador de `init --type host` dejó los 3 Remotes apuntando los 3 al puerto 4200 (placeholder, no sabía los puertos reales todavía) — se corrigió a 4201/4202/4203 tras generar los remotes.
- [x] Task 4: Fijar versiones del Stack en la raíz del workspace (AC: 3, soporte a NFR-3/NFR-8)
  - [x] `package.json`: de los paquetes que Architecture pinea explícitamente en su tabla Stack (Angular 22.0.6, Nx 23.1.0, `@angular-architects/native-federation` 22.0.6, TypeScript 6.0.3) todos son pins exactos, sin `^`/`~`. El resto de devDependencies (eslint, vitest, playwright, etc.) usa rangos normales de tooling — la política de pinning de Architecture/PRD §9 aplica solo a la tabla Stack, no a todo el árbol de dependencias.
  - [x] Política de versionado documentada en `instrucciones.md` (bitácora del proyecto) en vez de en el README genérico de Nx — ver Completion Notes

### Review Findings

- [x] [Review][Patch] Remotes exponen el `AppComponent` raíz (`./Component`) en vez de una ruta lazy — resuelto: se dejó como está (no hay rutas reales que exponer todavía) y se documentó como provisional con un comentario `TODO(Story 1.3)` en los 3 `federation.config.mjs`, citando la regla de Architecture que hay que cumplir al reemplazarlo. [apps/{catalogo,carrito,perfil}/federation.config.mjs]
- [x] [Review][Patch] NFR-7 (Shell <300KB gzip, "blocker" según Architecture) no tenía gate automatizado — resuelto: budget de `apps/shell/project.json` ajustado a `maximumWarning: 700kb` / `maximumError: 1mb` (bytes crudos), calibrado contra el ratio de compresión real medido en este build (~30% transfer/raw → 300KB gzip ≈ 1MB raw). [apps/shell/project.json]
- [x] [Review][Patch] AC3 dice "requiredVersion fijado" pero la implementación usa `requiredVersion: 'auto'` — resuelto: se acepta `'auto'` como la implementación correcta (más segura que un string fijo a mano, no puede desincronizarse); se aclara en Dev Notes que esto satisface la intención del AC (evitar version mismatch), no su letra literal. [apps/*/federation.config.mjs]
- [x] [Review][Patch] `.github/workflows/ci.yml` llegó con el scaffolding del template y corría automáticamente en cada push a `main`/PR sin Nx Cloud configurado — resuelto: se eliminó (`.github/workflows/`) hasta que el proyecto tenga CI real diseñado a propósito (Story 5.x). [.github/workflows/ci.yml — eliminado]
- [x] [Review][Patch] Completion Notes afirmaban "todos pins exactos, sin ^/~" de forma más amplia de lo que exige la Architecture — corregido: la afirmación ahora se acota a los paquetes de la tabla Stack (Nx/Angular/native-federation/TypeScript), que sí están exactos; el resto de devDependencies usa rangos normales de tooling, sin violar ninguna política. [package.json]
- [x] [Review][Patch] `instrucciones.md` no escribía la política real de congelamiento/bump-atómico de versiones — agregado un párrafo explícito en la sección "Por qué se hizo así". [instrucciones.md]
- [x] [Review][Patch] `nx.json` `targetDefaults` no tenía entrada para `@angular-architects/native-federation:build` — agregada (`cache`, `dependsOn: ["^build"]`, `outputs`), verificado con `nx reset` + 2 builds seguidos: segundo build cacheado (100%, 47ms vs 11.6s). [nx.json]
- [x] [Review][Patch] `zone.js` seguía como dependencia sin uso — verificado (sin referencias en código ni en `polyfills`, apps generadas zoneless por default de Angular 22) y removido de `package.json`; `npm install` confirma que no rompe nada (solo remueve ese paquete). [package.json]
- [x] [Review][Defer] URLs de remotos hardcodeadas a `localhost` en `main.ts`, sin mecanismo dev/prod — deferred, real para AD-7 (deploy) pero es trabajo de Story 5.x, no de esta historia. [apps/shell/src/main.ts]
- [x] [Review][Defer] Sin fuente única de verdad que ligue el puerto de cada remote (`project.json`) con las URLs hardcodeadas en `main.ts` de forma automática — deferred, bajo riesgo con 4 apps estáticas, revisitar si se vuelve doloroso. [apps/shell/src/main.ts]
- [x] [Review][Defer] `initFederation(...).catch(err => console.error(err))` traga cualquier fallo sin señal visible al usuario ni timeout — deferred, es exactamente lo que AD-5/RemoteUnavailableComponent va a resolver en Story 1.3/1.5. [apps/shell/src/main.ts]
- [x] [Review][Defer] `tsconfig.base.json` combina `target: es2015` con `lib: [es2020, dom]`, sin explicación — deferred, heredado del template `angular` de Nx, no bloquea nada hoy (esbuild controla el nivel de salida real). [tsconfig.base.json]
- [x] [Review][Defer] Tooling de testing (vitest, plugin playwright) quedó fijado por default de `nx.json` pese a que Architecture difiere explícitamente la profundidad de testing — deferred, default blando y fácil de cambiar, revisitar cuando esa pregunta se resuelva. [nx.json]

## Dev Notes

**🚨 Corrección crítica respecto a `addendum.md`:** el addendum del PRD (`prds/prd-monorepo-2026-07-17/addendum.md`, sección "Generadores Nx relevantes") muestra como ejemplo `nx g @nx/angular:host apps/shell --remotes=catalogo,carrito,perfil` seguido de `nx g @nx/angular:remote apps/catalogo --host=shell`. **Esos son los generadores de Module Federation clásico** (`@module-federation/enhanced`, integrado en `@nx/angular:host`/`:remote`), **no de Native Federation**. Este proyecto eligió explícitamente Native Federation (`@angular-architects/native-federation`) sobre Module Federation clásico — es la decisión de capacidad central del PRD (§4.1) y el Design Paradigm de la Architecture. Si el dev agent copia literalmente el comando del addendum, termina scaffoldeando el mecanismo de federación equivocado (genera `module-federation.config.ts` en vez de la config de Native Federation) y contradice la arquitectura. El flujo correcto, verificado en la documentación oficial de `@angular-architects/native-federation` (2026-07-18):

1. Crear cada app Angular "pelada" con el generador estándar de Nx (`@nx/angular:application`) — Native Federation no crea la app por vos, solo la instrumenta.
2. Instrumentar cada proyecto con `nx g @angular-architects/native-federation:init --project <nombre> --type host|remote --port <puerto>`.

El addendum sigue siendo válido como contexto de *por qué* se eligió Native Federation (pitfalls, comparación) — solo su ejemplo de comando de scaffolding no aplica a este proyecto.

**Nombre del archivo de config de federación:** la Architecture Spine (AD-6) asume `federation.config.mjs`. Si el generador instalado produce un nombre distinto (ej. `federation.config.ts`), **no renombrar a mano para forzar que calce** — documentarlo en Completion Notes de esta historia para que se actualice la referencia en el spine si hace falta. El contenido (qué se declara `singleton`) importa más que la extensión exacta del archivo.

**Alcance de esta historia — no adelantarse:**
- No crear `libs/` todavía (organización de libs por tipo/tags es Story 1.2).
- No configurar Tailwind todavía (Story 1.7).
- No implementar rutas con contenido de negocio (Story 1.3) — alcanza con que el Shell federe y sirva vacío.
- No hay código previo que leer o preservar — es la primera historia del proyecto (greenfield, sin commits, sin `apps/`/`libs/` existentes).

**Testing:** la profundidad de testing automatizado queda explícitamente Deferred (Architecture spine, PRD Open Question 4) — esta historia se verifica manualmente (`nx serve shell` sin errores), no requiere suite de tests todavía.

**Stack pineado (verificado vía web 2026-07-18, ver Architecture Spine §Stack):** Nx 23.1 (mínimo que soporta Angular 22 según la matriz oficial Nx↔Angular), Angular 22, `@angular-architects/native-federation` 22.0.6, Node.js 24 (Active LTS). Fijar exacto, no rangos — PRD §9 prohíbe bumps mid-project salvo blocker de seguridad.

### Code Review Resolutions (2026-07-19)

- **Budget de NFR-7 calibrado, no adivinado.** Angular CLI no tiene un tipo de budget nativo en gzip, solo en bytes crudos. Se midió el ratio real de este build (`nx build shell --configuration=production`: 103.89 kB raw / 31.02 kB transfer estimado ≈ 30%) y se derivó el ceiling en bytes crudos: 300KB gzip ÷ 0.30 ≈ 1MB raw. Budget actualizado a `maximumWarning: 700kb` / `maximumError: 1mb` en `apps/shell/project.json`. Si el ratio de compresión cambia mucho cuando entre contenido real (Story 2.x+), recalibrar.
- **`requiredVersion: 'auto'` aceptado como cumplimiento de intención, no de la letra literal de AC3.** Lee la versión real instalada en vez de un string fijo a mano — no puede desincronizarse entre Shell y Remotes, que es lo que AD-6/AC3 buscan evitar. Confirmado con Antonio en el code review de esta historia.
- **Exposed module `./Component` es intencionalmente provisional.** Los 3 Remotes exponen su `AppComponent` raíz porque todavía no existen rutas de negocio (esas llegan en Story 1.3). Se documentó con un comentario `TODO(Story 1.3)` en cada `federation.config.mjs` en vez de inventar una ruta placeholder ahora — Architecture prohíbe exponer el bootstrap completo como estado *final*, no como paso intermedio de un scaffold que se sabe incompleto.
- **`.github/workflows/ci.yml` eliminado.** Llegó con el scaffolding del template, corría en cada push/PR contra Nx Cloud sin token configurado y con un target `e2e` inexistente. Se decidió no tener CI hasta diseñarlo a propósito (candidato natural: Story 5.x, junto con el deploy).

### Project Structure Notes

Alineado con el Structural Seed de `ARCHITECTURE-SPINE.md`:

```text
{repo-root}/
  apps/
    shell/            # Host — federa los 3 Remotes (esta historia: routing/contenido real llega en 1.3)
    catalogo/
    carrito/
    perfil/
```

Sin `libs/` todavía — esa estructura (`libs/catalogo/{feature,ui,data-access}`, `libs/shared/*`) empieza en Story 1.2. No crear carpetas de libs por adelantado en esta historia (violaría el principio de "crear entidades/estructura solo cuando se necesitan").

Sin conflictos ni variaciones detectadas — repo vacío, sin convenciones previas que reconciliar.

### References

- [Source: planning-artifacts/epics.md#Epic-1-Story-1.1] — historia y AC origen
- [Source: planning-artifacts/architecture/architecture-monorepo-2026-07-18/ARCHITECTURE-SPINE.md#AD-6] — singleton de Angular/RxJS en federación, corrección de nombre de archivo
- [Source: planning-artifacts/architecture/architecture-monorepo-2026-07-18/ARCHITECTURE-SPINE.md#Stack] — versiones pineadas
- [Source: planning-artifacts/architecture/architecture-monorepo-2026-07-18/ARCHITECTURE-SPINE.md#Structural-Seed] — árbol de directorios objetivo
- [Source: planning-artifacts/prds/prd-monorepo-2026-07-17/prd.md#FR-1] — enrutamiento federado (realizado completo recién en Story 1.3)
- [Source: planning-artifacts/prds/prd-monorepo-2026-07-17/prd.md#FR-9] — independencia de build/serve (realizado completo en Story 1.6)
- [Source: planning-artifacts/prds/prd-monorepo-2026-07-17/prd.md#9] — política de pinning de versiones
- [Source: planning-artifacts/prds/prd-monorepo-2026-07-17/addendum.md] — contexto de la decisión Native Federation vs Module Federation; **su comando de ejemplo de scaffolding no aplica** (ver Dev Notes)
- Verificado vía web (2026-07-18): comandos reales de `@angular-architects/native-federation:init`, matriz de compatibilidad Nx 23.1 ↔ Angular 22

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5 (claude-sonnet-5)

### Debug Log References

- `npx create-nx-workspace@23.1.0 . --preset=apps` → falló en `nx g @nx/angular:application` con: `The "@nx/angular:application" generator doesn't support the existing TypeScript setup` (project references / `composite: true`). Ver Completion Notes para la resolución completa.
- `npx create-nx-workspace@23.1.0 . --preset=angular-monorepo --appName=shell` → generó un demo completo ("shop" + "shop-e2e" + "api" Express) en vez de un workspace en blanco; el flag `--appName=shell` fue ignorado por el template. Descartado.
- `npx create-nx-workspace@23.1.0 . --template=angular` → workspace correcto, tsconfig compatible con Angular, pero con contenido demo (`apps/shop`, `apps/shop-e2e`, `apps/api`, `packages/*`) que se removió a mano.

### Completion Notes List

- **Preset de `create-nx-workspace` no se comportó como lo documentaba la historia.** La versión 23.1.0 de `create-nx-workspace` remapea los presets "legacy" (`apps`, `angular-monorepo`, etc.) a templates completos de GitHub (`nrwl/empty-template`, `nrwl/angular-template`), no a los generadores minimalistas que documentaba `--help`. `apps` → TS-only con `composite: true` (rompe Angular). `angular-monorepo` → demo completo con apps `shop`/`api` no relacionadas al proyecto (incluye un backend Express, prohibido por el PRD). Se resolvió usando `--template=angular` (`nrwl/angular-template`, tsconfig Angular-compatible) y borrando a mano el contenido demo (`apps/shop`, `apps/shop-e2e`, `apps/api`, `packages/*`, y sus path-aliases en `tsconfig.base.json`). También se limpiaron de `package.json`/`nx.json` las dependencias y el plugin `@nx/docker` que solo existían para el `api` demo (`express`, `@types/express`, `supertest`, `@types/supertest`, `@nx/node`, `@nx/docker`).
- **El repo ya era un repositorio git real** con remoto `https://github.com/AntonioTamez/monorepo.git` y un commit previo ("first commit", `dd4b848`) conteniendo el scaffold inicial de BMad — no se creó git en esta historia, ya existía. `baseline_commit` de esta historia apunta a ese commit.
- **`create-nx-workspace` trajo scaffolding de múltiples herramientas de IA no solicitado** (`.agents/`, `.codex/`, `.cursor/`, `.gemini/`, `.opencode/`, `.github/`, `AGENTS.md`, `CLAUDE.md`, `opencode.json`, `.claude/settings.json`) — por decisión explícita del usuario, **se dejaron sin tocar** (no forman parte del alcance de esta historia, pero no se borraron).
- **Verificación de "sin errores de consola" (AC 4) fue parcial.** Se confirmó que `nx serve shell` buildea y sirve HTTP 200 con HTML válido (curl), pero este entorno no tiene un navegador real disponible para inspeccionar la consola del navegador en vivo. La carga real de los 3 `remoteEntry.json` en runtime (que ocurre client-side dentro del navegador) queda pendiente de una verificación visual manual — recomendado para Antonio antes de dar por cerrada la AC al 100%, o se confirma naturalmente en Story 1.3 cuando las rutas ya tengan contenido y Antonio navegue la app.
- Todas las validaciones automatizables pasaron: lint (0 errores, 4 proyectos), tests (4/4 passing, generados por el propio schematic), build de producción (4/4 exitosos, ~4-6s cada uno — bien dentro del budget NFR-1 de <10s), bundle inicial ~104KB raw / ~31KB transfer estimado por app (muy por debajo del budget de 300KB gzip de NFR-7 — aunque esto todavía es contenido placeholder de Nx, no las features reales).

### File List

**Workspace raíz (creados/modificados):**
- `package.json`, `package-lock.json` (creados por create-nx-workspace, luego editados a mano para remover deps del demo `api`)
- `nx.json` (creado, editado a mano para remover `release`/`@nx/docker` del demo `api`)
- `tsconfig.base.json` (creado, editado a mano para remover path-aliases del demo)
- `tsconfig.json`, `.editorconfig`, `.gitignore`, `.prettierrc`, `.prettierignore`, `.vscode/`, `README.md` (creados por create-nx-workspace, sin editar)

**Apps generadas (Angular + Native Federation), una carpeta por Remote:**
- `apps/shell/**` (incluye `federation.config.mjs`, `src/bootstrap.ts`; `src/main.ts` editado a mano para corregir los puertos de los 3 Remotes)
- `apps/catalogo/**`, `apps/carrito/**`, `apps/perfil/**` (incluye `federation.config.mjs`, `src/bootstrap.ts` cada uno)
- `vitest.workspace.ts` (raíz, generado)

**Sin tocar (ya existían o se dejaron por decisión del usuario, no son parte del alcance de esta historia):**
- `.agents/`, `.codex/`, `.cursor/`, `.gemini/`, `.opencode/`, `AGENTS.md`, `CLAUDE.md`, `opencode.json`, `.claude/settings.json`
- `_bmad/`, `_bmad-output/`, `docs/`, `design-artifacts/` (proyecto BMad existente)

**Modificados en el code review (2026-07-19):**
- `apps/{catalogo,carrito,perfil}/federation.config.mjs` — comentario `TODO(Story 1.3)` sobre el exposed module provisional
- `apps/shell/project.json` — budget de producción recalibrado (`maximumWarning: 700kb`, `maximumError: 1mb`)
- `nx.json` — agregado `targetDefaults` para `@angular-architects/native-federation:build` (cache/dependsOn/outputs)
- `package.json` — removida la dependencia sin uso `zone.js`
- `instrucciones.md` — agregada la política de congelamiento/bump-atómico de versiones
- `.github/workflows/ci.yml` — **eliminado** (llegó del scaffolding del template, sin Nx Cloud configurado)

## Change Log

- 2026-07-18/19: Implementación completa de Story 1.1. Workspace Nx 23.1.0 + Angular 22.0.6 inicializado; 4 apps (shell, catalogo, carrito, perfil) generadas; Native Federation 22.0.6 inicializado en las 4 con singleton compartido para todas las deps; verificado con lint/test/build. Status → review.
- 2026-07-19: Code review (Blind Hunter + Edge Case Hunter + Acceptance Auditor). 4 decision-needed resueltas (exposed module documentado como provisional, budget de NFR-7 calibrado, `requiredVersion: 'auto'` aceptado, `.github/workflows/ci.yml` eliminado) + 4 patches aplicados (Completion Notes corregidas, política de versionado agregada a `instrucciones.md`, `targetDefaults` de native-federation en `nx.json`, `zone.js` sin uso removido). Re-verificado AC4 con los 4 servers corriendo a la vez (antes solo se había probado el Shell aislado). Status → done.
