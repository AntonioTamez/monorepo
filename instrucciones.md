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

### Problemas y soluciones

- **Problema:** el primer intento de crear el workspace (`--preset=apps`, pensado como "workspace vacío") dejó el `tsconfig.base.json` en modo "project references" (`composite: true`). Angular no soporta ese modo — el generador de apps tiró un error explícito rechazándolo.
  **Solución:** se rehizo el workspace con `--template=angular`, que trae un `tsconfig.base.json` normal (sin `composite`). Lección: los presets "genéricos" de Nx (pensados para paquetes TypeScript sueltos) no son compatibles con Angular out-of-the-box — para un monorepo Angular conviene arrancar siempre desde el template `angular`, no desde uno genérico, aunque haya que borrarle el contenido de ejemplo después.
- **Problema:** el mismo generador de create-nx-workspace, en esta versión (23.1.0), trae de regalo configuración para varias herramientas de IA (Cursor, Gemini, Codex, OpenCode, GitHub Actions, un `CLAUDE.md` genérico) que no pedimos. Se dejaron sin tocar por decisión explícita — no rompen nada, simplemente no son parte de lo que estamos construyendo.
- **Pendiente de verificar a ojo:** confirmamos por terminal (`curl`) que `nx serve shell` levanta y sirve bien, pero no hay navegador real en este entorno para chequear la consola del navegador cuando el Shell intenta cargar los 3 `remoteEntry.json` en runtime. Vale la pena que lo abras vos en Chrome/Edge una vez corras `nx serve shell` (y opcionalmente `nx serve catalogo` etc. en paralelo) para confirmar que no hay errores ahí — o simplemente confiar en que Story 1.3 (cuando las rutas ya tengan contenido) lo va a exponer si algo estuviera mal.
