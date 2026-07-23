# Instrucciones — Llano (Monorepo Nx + Angular + Microfrontends)

Este documento es una bitácora de aprendizaje. Se actualiza **al terminar cada historia** (`bmad-dev-story`), en orden de ejecución, con:

1. Los comandos/pasos exactos que se usaron para levantar Shell, Remotes, libs, config de federación, etc. — en el orden real en que se corrieron.
2. Una explicación breve de para qué sirve cada paso (no solo el comando, sino qué logra).
3. El **por qué** detrás de las decisiones no obvias — qué se intentó, qué falló, qué se eligió y por qué — para que el conocimiento quede plasmado y no solo el resultado final.

La idea es que este archivo, leído de punta a punta, alcance para que puedas reconstruir el proyecto vos mismo sin depender de recordar la sesión donde se hizo.

---

## Cómo leer este documento

Cada sección corresponde a una historia (`Story N.M`) del sprint (ver `_bmad-output/planning-artifacts/epics.md` y `_bmad-output/implementation-artifacts/sprint-status.yaml` para el estado completo). Dentro de cada una:

- **Comandos ejecutados** — en orden, con el propósito de cada uno.
- **Por qué se hizo así** — decisiones de arquitectura o gotchas descubiertos durante la implementación.
- **Problemas y soluciones** — si algo no funcionó como se esperaba a la primera, qué pasó y cómo se resolvió.

---

## Story 1.1 — Scaffolding del workspace Nx con Shell y 3 Remotes federados

### Comandos ejecutados (en orden)

1. **`npx create-nx-workspace@23.1.0 . --template=angular --interactive=false --packageManager=npm --skipGit --nxCloud=skip`**
   Inicializa el workspace Nx en la raíz del repo: crea `nx.json`, `package.json`, `tsconfig.base.json` y el resto de la config compartida. El `.` le dice que use el directorio actual (no una carpeta nueva). `--template=angular` es la plantilla oficial de Nx para monorepos Angular — la elegimos porque es la única que trae un `tsconfig.base.json` compatible con el generador de apps Angular (ver "Problemas y soluciones" abajo).

2. **Borrar el contenido demo que trae la plantilla:** `apps/shop`, `apps/shop-e2e`, `apps/api` (un backend Express de ejemplo) y `packages/*` (libs de ejemplo). Nx te da un mini e-commerce de muestra, no un workspace en blanco. También se limpiaron sus path-aliases en `tsconfig.base.json`, y sus dependencias sueltas en `package.json`/`nx.json` (`express`, `supertest`, `@nx/docker`, etc.) — nada de esto aplica a nuestro proyecto (el PRD prohíbe explícitamente un backend real).

3. **`npm install -D @nx/angular@23.1.0 --save-exact`**
   Instala el plugin de Nx que sabe generar/manejar proyectos Angular (generadores `:application`, `:library`, etc.). Sin esto, `nx g @nx/angular:...` no existe.

4. **`npx nx g @nx/angular:application apps/shell --routing=true --style=css --e2eTestRunner=none`** (y lo mismo para `apps/catalogo`, `apps/carrito`, `apps/perfil`)
   Genera cada app Angular "pelada" (standalone components, sin NgModules — default de Angular 22). Un comando por app porque queríamos elegir a mano los 4 nombres/roles (host + 3 remotes) en vez de que un preset los invente.

5. **`npm install @angular-architects/native-federation@22.0.6 --save-exact`**
   Instala la librería de federación elegida en la arquitectura (Native Federation, no Module Federation clásico — ver el porqué abajo).

6. **`npx nx g @angular-architects/native-federation:init --project shell --type host --port 4200`**
   Convierte la app "shell" en el Host de la federación: le genera `federation.config.mjs` (declara qué comparte con los remotos) y ajusta su `main.ts` para cargar los remotos en runtime.

7. **`npx nx g @angular-architects/native-federation:init --project <catalogo|carrito|perfil> --type remote --port <4201|4202|4203>`**
   Lo mismo pero como Remote — cada uno queda listo para ser cargado por el Shell, y también servible solo (standalone).

8. **Corregir `apps/shell/src/main.ts` a mano.** El generador de `init --type host` no sabe todavía en qué puerto van a vivir los remotos (se generan después), así que puso los 3 apuntando al puerto 4200 (el del propio shell) como placeholder. Se corrigió a mano a 4201/4202/4203 una vez generados los remotos.

9. **`npx nx run-many -t lint,test,build --projects=shell,catalogo,carrito,perfil`**
   Corre lint, tests y build de producción de las 4 apps para confirmar que todo compila y no hay regresiones antes de cerrar la historia.

### Por qué se hizo así

- **Native Federation, no Module Federation clásico.** El PRD y la arquitectura ya habían elegido Native Federation (`@angular-architects/native-federation`) — es esbuild-nativo, más rápido, y es el enfoque recomendado para proyectos 100% Angular nuevos. Esto importa porque Nx tiene generadores para **las dos** cosas y se ven parecidos por fuera: `@nx/angular:host`/`:remote` (Module Federation clásico, usa `module-federation.config.ts`) vs `@angular-architects/native-federation:init` (lo que usamos, genera `federation.config.mjs`). Si corrés el primero por error, tu proyecto queda armado con el mecanismo de federación equivocado sin que sea obvio a simple vista.
- **`federation.config.mjs` ya viene con `singleton: true` + `strictVersion: true` para *todas* las dependencias compartidas** (no solo Angular/RxJS), vía una función `shareAll(...)` — esto es mejor que el mínimo que pedía la arquitectura, así que no hubo que tocar nada ahí. Además usa `requiredVersion: 'auto'`, que lee la versión real instalada en vez de un número escrito a mano — así nunca se puede desincronizar entre el Shell y los Remotes.
- **Puertos 4200 (shell) / 4201 (catalogo) / 4202 (carrito) / 4203 (perfil).** No hay un requisito que fije estos números — es solo una convención simple y sin colisiones. Se puede cambiar sin problema si hace falta.
- **Política de versionado: las versiones quedan congeladas, no se actualizan "porque salió una nueva".** Nx 23.1.0, Angular 22.0.6, `@angular-architects/native-federation` 22.0.6 y TypeScript 6.0.3 se fijan al arrancar el proyecto (Fase 0) y quedan así para **todo** el roadmap (las 5 fases) — la única excusa válida para tocarlas es un blocker real (ej. una vulnerabilidad de seguridad), nunca "porque hay una versión más nueva disponible". Si alguna vez hace falta actualizar Angular o RxJS, hay que actualizar `package.json` **y los 4 `federation.config.mjs`** (Shell + 3 Remotes) en el mismo commit — nunca de a uno, porque eso reintroduce exactamente el "version mismatch" entre Remotes que toda esta arquitectura de Native Federation existe para evitar.

### Problemas y soluciones

- **Problema:** el primer intento de crear el workspace (`--preset=apps`, pensado como "workspace vacío") dejó el `tsconfig.base.json` en modo "project references" (`composite: true`). Angular no soporta ese modo — el generador de apps tiró un error explícito rechazándolo.
  **Solución:** se rehizo el workspace con `--template=angular`, que trae un `tsconfig.base.json` normal (sin `composite`). Lección: los presets "genéricos" de Nx (pensados para paquetes TypeScript sueltos) no son compatibles con Angular out-of-the-box — para un monorepo Angular conviene arrancar siempre desde el template `angular`, no desde uno genérico, aunque haya que borrarle el contenido de ejemplo después.
- **Problema:** el mismo generador de create-nx-workspace, en esta versión (23.1.0), trae de regalo configuración para varias herramientas de IA (Cursor, Gemini, Codex, OpenCode, GitHub Actions, un `CLAUDE.md` genérico) que no pedimos. Se dejaron sin tocar por decisión explícita — no rompen nada, simplemente no son parte de lo que estamos construyendo.
- **Pendiente de verificar a ojo:** confirmamos por terminal (`curl`) que las 4 apps sirven bien (incluyendo los 3 `remoteEntry.json` con HTTP 200 cuando los 4 `nx serve` corren a la vez), que es la condición de red que hace falta para que el Shell cargue los remotos sin errores. Lo único que no pudimos chequear en este entorno es la consola del navegador en vivo (no hay navegador real disponible) — vale la pena que lo abras vos en Chrome/Edge alguna vez para confirmarlo del todo, aunque el precondition de red ya está verificado.

### Code review de Story 1.1 (2026-07-19)

Se corrió `bmad-code-review` sobre el diff de esta historia. Tres hallazgos llevaron a una decisión y quedaron resueltos:

- **Un archivo de CI (`​.github/workflows/ci.yml`) había llegado con el scaffolding del template** — corría en cada push a `main`/PR, dependía de Nx Cloud (sin token configurado) y de un target `e2e` que ninguna app tiene. Se decidió borrarlo hasta diseñar un CI real más adelante (candidato: cuando se llegue a la Fase 4, deploy).
- **Los 3 Remotes exponen su `AppComponent` raíz en la federación (`./Component`) en vez de una ruta lazy** — la arquitectura prohíbe esto como estado final, pero hoy es boilerplate transitorio (todavía no hay rutas de negocio, eso es Fase 1/2). Se dejó así a propósito, con un comentario `TODO(Story 1.3)` en cada `federation.config.mjs` para no olvidarlo.
- **El budget de tamaño del Shell no estaba calibrado contra el límite real de 300KB gzip** — Angular CLI mide en bytes crudos, no gzip, así que se derivó un techo aproximado (~1MB crudo) a partir del ratio de compresión medido en el build real (~30%).

## Story 1.2 — Organización de libs con tags Nx y boundaries enforced

### Comandos ejecutados (en orden)

1. **Reemplazar el bloque `depConstraints` de `eslint.config.mjs`.** Ya existía un bloque `@nx/enforce-module-boundaries` desde el scaffolding de Story 1.1, pero con reglas del demo (`scope:shop`, `scope:api`, `type:data`) que nunca se limpiaron. Se reemplazó completo por las reglas reales: `scope:shell/catalogo/carrito/perfil` (cada uno solo puede depender de sí mismo + `scope:shared`), `scope:shared` (solo de sí mismo), y `type:feature → [ui, data-access, util]` / `type:ui`, `type:data-access → [util]` / `type:util → []`.

2. **Etiquetar los 4 apps con su `scope` en cada `project.json`** (`"tags": ["scope:shell"]`, etc.). Esto es lo que hace que las reglas del paso 1 tengan algo a qué aplicarse — sin tags, `depConstraints` no tiene efecto.

3. **Probar el boundary de scope agregando un import temporal** de `apps/catalogo` dentro de `apps/carrito`, correr `npx nx lint carrito`, confirmar que falla, y revertir el import. No hizo falta crear nada nuevo para esto — las 4 apps ya existían desde Story 1.1.

4. **Probar el boundary de tipo con dos libs desechables:**
   `npx nx g @nx/js:library libs/shared/scratch-ui --bundler=none --unitTestRunner=none --tags="scope:shared,type:ui"` (y lo mismo para `scratch-data-access` con `type:data-access`). Se agregó un import de `scratch-data-access` dentro de `scratch-ui`, se corrió `npx nx lint scratch-ui` para confirmar que fallaba, y después **se borraron ambas libs por completo** (`rm -rf libs/shared/scratch-*`, más los path-aliases que el generador había agregado a `tsconfig.base.json`). Esto se hizo con libs de mentira, a propósito — las libs reales con contenido (Product, Cart, etc.) todavía no existen y no correspondía crearlas antes de tiempo solo para probar una regla de lint.

5. **`npx nx run-many -t lint,test,build --projects=shell,catalogo,carrito,perfil`** — misma verificación de regresión que en Story 1.1, ahora con los boundaries activos.

### Por qué se hizo así

- **El boundary de scope no falló como se esperaba, pero falló igual.** La intención era ver un error de `depConstraints` citando el tag de scope. En la práctica, `@nx/enforce-module-boundaries` tiene una regla previa: ningún proyecto se puede importar por path relativo entre carpetas de proyecto, tiene que ser vía un alias de npm-scope. Como ninguna app tiene un alias así configurado (no están pensadas para ser importadas entre sí), cualquier intento cae en esa regla antes de llegar a evaluar el tag. El resultado (el lint falla) es el mismo que pedía el criterio de aceptación, así que no se cambió nada — pero vale saber que la prueba "fina" por tag recién se va a ver de verdad cuando existan libs reales de distintos scopes importándose entre sí (a partir de la Fase 1).
- **Por qué usar libs "de mentira" (`scratch-*`) en vez de esperar a las libs reales:** crear `libs/shared/util-types` o `libs/catalogo/feature-listado` antes de que una historia los necesite de verdad rompería el principio de "no crear estructura por adelantado" que ya se venía respetando desde Story 1.1. Las libs de scratch cumplen el único propósito de esta historia (probar que la regla de lint funciona) sin adelantar trabajo de historias futuras.
- **Nx no deja nombrar un proyecto empezando con `_`** (ej. `_scratch-ui` falló con un error de patrón de nombre) — por eso terminaron llamándose `scratch-ui`/`scratch-data-access`, sin guion bajo.

### Code review de Story 1.2 (2026-07-19)

**Comandos ejecutados (en orden):**

1. **Revisión en paralelo** (Blind Hunter, Edge Case Hunter, Acceptance Auditor) sobre `git diff HEAD` — encontraron la contradicción de Architecture descrita abajo, más 5 findings menores (comentarios sin tildes, un comentario que confundía Shell con "Remote", el File List incompleto, y la prueba de AC3 sin valor real).
2. **Corrección de `ARCHITECTURE-SPINE.md`:** se editó la tabla del Design Paradigm y la regla de AD-2 para reflejar que `ui`/`data-access` también pueden depender de su propio tipo cuando el destino es `scope:shared` (antes solo `util`). Se logueó el cambio en el `.memlog.md` de la arquitectura.
3. **Corrección de `eslint.config.mjs`:** `type:ui` y `type:data-access` pasaron de `onlyDependOnLibsWithTags: ['type:util']` a `['type:util', 'type:ui']` / `['type:util', 'type:data-access']` respectivamente. También se corrigieron las tildes y el comentario de AD-1.
4. **Verificación del fix con 5 libs de scratch reales** (`nx g @nx/js:library ... --tags="scope:X,type:Y"`, con `--name` explícito para evitar colisión de nombres entre carpetas):
   - `scratch-catalogo-feature` (scope:catalogo) importando `scratch-carrito-feature` (scope:carrito) → **falló** con el mensaje real de `depConstraints` por scope — esto es lo que prueba AC3 de verdad (antes solo se había probado con apps, que fallan por una regla distinta).
   - `scratch-catalogo-ui` (scope:catalogo, type:ui) importando `scratch-shared-ui` (scope:shared, type:ui) → **pasó** — confirma que el fix del paso 3 funciona.
   - El mismo `scratch-catalogo-ui` importando además `scratch-carrito-ui` (scope:carrito, type:ui) → **falló** — confirma que el aislamiento entre dominios (el eje de scope) sigue intacto, el fix no abrió ningún agujero.
   - Las 5 libs se borraron por completo al terminar (`rm -rf`), y los path-aliases que dejaron en `tsconfig.base.json` también se limpiaron.
5. **`npx nx run-many -t lint,test,build --projects=shell,catalogo,carrito,perfil`** — regresión final, 12/12 verde.

Esta vez el hallazgo importante no fue un bug de la historia, sino **una contradicción real en la propia `ARCHITECTURE-SPINE.md`**: la tabla del Design Paradigm decía que `ui`/`data-access` dependen "únicamente de util", pero el diagrama mermaid de la misma sección (AD-2) dibuja `catalogo-ui → shared-ui` y `catalogo-data-access → shared-cart` — o sea, cada dominio consumiendo el Design System y los servicios compartidos, que es justo lo que el proyecto necesita (FR-8, FR-4, FR-7). La implementación inicial de esta historia siguió la tabla al pie de la letra, así que en cuanto existieran esas libs reales (Fase 1/2), el lint las habría bloqueado.

**La corrección, para que quede claro el razonamiento:** el aislamiento entre dominios (que ningún Remote toque el código de otro) lo garantiza el eje de **scope**, no el de **tipo**. Una vez que eso se entiende, dejar que `ui` dependa de `ui` (y `data-access` de `data-access`) *cuando el destino es `scope:shared`* no abre ningún agujero — `catalogo-ui` puede llegar a `shared-ui`, pero nunca a `carrito-ui`, porque el eje de scope sigue bloqueando ese segundo caso sin importar qué diga el eje de tipo. Se corrigió tanto la tabla/regla de Architecture como el `eslint.config.mjs`, y se verificó con libs de mentira que las dos cosas (el nuevo permiso Y el aislamiento que sigue intacto) funcionan como se espera.

También se detectó que la prueba de AC3 (boundary de scope) de la primera pasada no había probado nada de verdad — había fallado por una regla genérica de Nx, no por la regla de scope en sí. Se rehizo con libs de mentira con scopes distintos, y ahí sí se vio el mensaje real de la regla.

**Un finding que se investigó y se descartó, para que quede como ejemplo de "verificar antes de aplicar":** un revisor sugirió agregar una regla de "fallback" para proyectos sin tag. Antes de tocar nada, se confirmó contra la documentación oficial de Nx que el comportamiento real es al revés de lo que el revisor asumía — un proyecto sin tags ya está bloqueado por default, no libre. Agregar el fallback sugerido hubiera sido el error, no la solución.

## Story 1.3 — Navegación federada entre las 3 rutas del Shell

### Comandos ejecutados (en orden)

1. **Editar `apps/shell/src/app/app.routes.ts`** (antes era `[]`) para agregar las 3 rutas federadas:
   ```ts
   { path: 'catalogo', loadComponent: () => loadRemoteModule('catalogo', './Component').then(m => m.App) }
   ```
   (y lo mismo para `carrito`/`perfil`). `loadRemoteModule` viene del mismo paquete (`@angular-architects/native-federation`) que ya usa `main.ts` para inicializar la federación — no hace falta instalar nada nuevo.

2. **`npx nx lint shell`** — confirma que la sintaxis nueva compila y pasa lint.

3. **Levantar los 4 dev servers** (`nx serve shell/catalogo/carrito/perfil`) y probar las 3 rutas con `curl` (`http://localhost:4200/catalogo`, etc.) — todas responden 200, y los logs de los 4 servidores no muestran errores.

4. **`npx nx run-many -t lint,test,build --projects=shell,catalogo,carrito,perfil`** — regresión final, 12/12 verde.

### Por qué se hizo así

- **`loadComponent` + `'./Component'`, no `loadChildren` + `'./Routes'`.** Los 3 Remotes ya exponen `'./Component'` desde Story 1.1 (apuntando a su `AppComponent` raíz), con un comentario `TODO(Story 1.3)` sugiriendo cambiarlo a un export de rutas. Se investigó esa sugerencia y **no aplicaba todavía**: ningún Remote tiene rutas de negocio propias hasta que existan sus libs `feature` (Epic 2). `loadChildren` recién tiene sentido cuando el Remote expone su propio array de `Routes`, no un componente único. El comentario TODO se dejó tal cual — sigue siendo correcto, solo que "todavía no es el momento".
- **El nombre de la clase exportada es `App`, no `AppComponent`.** Los ejemplos genéricos de la documentación de Native Federation usan `.then(m => m.AppComponent)`, pero los 3 `app.ts` de este proyecto (generados por Nx) exportan `export class App`. Se verificó leyendo el código real antes de escribir la historia — si se copiaba el ejemplo de la doc tal cual, el build hubiera fallado con un error de tipo poco obvio de diagnosticar.

### Problemas y soluciones

- **Sin navegador real disponible, otra vez.** Igual que en Story 1.1, este entorno no tiene un navegador para confirmar visualmente que la navegación no recarga la página completa (AC1) ni que cada Remote aparece como entrada de red separada en el Network tab (AC2). Se intentó activar la skill `claude-in-chrome`, pero la extensión no estaba instalada en esta sesión. Quedó verificado por `curl` (las 3 rutas responden, sin errores en los logs de servidor) pero **falta la confirmación visual** — vale la pena que Antonio abra `nx serve shell` (con los 3 remotos también corriendo) en Chrome/Edge y mire el Network tab al navegar entre `/catalogo`, `/carrito`, `/perfil`.

### Code review de Story 1.3 (2026-07-22)

**El hallazgo más importante:** el `curl` de la sección anterior en realidad **no probaba nada nuevo**. El fallback SPA de Angular ya devolvía HTTP 200 + el mismo `index.html` en esas rutas *antes* de esta historia, cuando `appRoutes` todavía era `[]` — `curl` no ejecuta JavaScript, así que no puede ver si el router realmente cargó el Remote o no. Es una lección útil: cuando la evidencia de una verificación no depende del cambio que se está probando, no es evidencia real. Se corrigió la redacción de la historia para no sobre-vender esto, y también se corrigieron los checkboxes de las tareas de verificación, que decían "hecho" aunque el propio texto ya admitía que no se había podido confirmar.

**Comandos ejecutados en esta ronda:**

1. Se creó `apps/shell/src/app/remote-names.ts` con una constante `REMOTE_NAMES` (`{ catalogo: 'catalogo', carrito: 'carrito', perfil: 'perfil' }`), y se usó tanto en `main.ts` (`initFederation`) como en `app.routes.ts` (`loadRemoteModule`) — antes los 3 nombres de remote estaban sueltos como strings en dos archivos distintos, sin nada que garantice que coincidan si alguno cambia.
2. Se agregaron 2 rutas nuevas al final de `appRoutes`: `{ path: '', redirectTo: 'catalogo', pathMatch: 'full' }` y `{ path: '**', redirectTo: 'catalogo' }` — antes, entrar a `/` mostraba el boilerplate de Nx sin sentido, y cualquier URL desconocida no hacía nada.
3. Se agregó un comentario en `app.routes.ts` explicando por qué no hay `.catch()` en `loadRemoteModule(...)` (es a propósito, AD-5/Story 1.5) — mismo estilo que ya usan los `federation.config.mjs` para señalar gaps diferidos.
4. Se corrigió `deferred-work.md`: un ítem de Story 1.1 decía ambiguamente "Story 1.3/1.5" para el `.catch()` que traga errores — como esta historia confirmó que el gap sigue sin resolver, se acotó a "Story 1.5" únicamente.
5. Regresión completa re-corrida tras los cambios (12/12 verde).
