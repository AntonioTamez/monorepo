## Deferred from: code review of story-1.1 (2026-07-19)

- URLs de remotos hardcodeadas a `localhost` en `apps/shell/src/main.ts`, sin mecanismo dev/prod — real para AD-7 (Cloudflare Pages, sub-paths), pero es trabajo de Story 5.x (deploy), no de Story 1.1.
- Sin fuente única de verdad que ligue el puerto de cada remote (declarado en su `project.json`) con las URLs hardcodeadas en `main.ts` del Shell — bajo riesgo con 4 apps estáticas; revisitar si el esquema de puertos cambia seguido o si se vuelve doloroso de mantener a mano.
- `initFederation(...).catch(err => console.error(err))` en `apps/shell/src/main.ts` traga cualquier fallo de carga de un Remote sin señal visible al usuario ni timeout — es exactamente el gap que AD-5 (RemoteUnavailableComponent) va a cerrar en Story 1.3/1.5; no duplicar el fix ahí.
- `tsconfig.base.json` combina `target: es2015` con `lib: [es2020, dom]` sin explicación — heredado del template `angular` de Nx sin editar; no bloquea nada hoy porque esbuild controla el nivel de salida real, pero vale una limpieza futura.
- Tooling de testing (`vitest` para unit, plugin de `playwright` disponible) quedó fijado como default en `nx.json` pese a que la Architecture Spine difiere explícitamente la profundidad de testing (PRD Open Question 4) — es un default blando y fácil de cambiar; revisitar cuando esa pregunta se resuelva formalmente.
