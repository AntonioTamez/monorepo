---
title: Monorepo de Microfrontends con Angular y Nx
status: final
created: 2026-07-17
updated: 2026-07-17
---

# PRD: Monorepo de Microfrontends con Angular y Nx

## 0. Document Purpose

Este PRD es para Antonio, quien es simultáneamente el PM, el desarrollador y la audiencia principal del proyecto. Su propósito es fijar el alcance de un monorepo de aprendizaje construido con Nx y Angular, con al menos 3 microfrontends (MFE) federados, de forma lo bastante concreta como para guiar el desarrollo por fases sin ambigüedad sobre qué se construye y por qué. El documento usa vocabulario ancla del Glosario (§3), agrupa requisitos funcionales (FR) bajo features numerados globalmente (§4), y marca inline con `[ASSUMPTION]` cualquier punto inferido sin confirmación explícita, indexado en §13.

Este PRD se apoya en una investigación de landscape técnico (Module Federation vs. Native Federation en Nx+Angular, patrones de arquitectura, pitfalls comunes) realizada como parte de este mismo ejercicio de planeación. El detalle técnico de esa investigación —comparación de enfoques, paquetes específicos, recursos de referencia— vive en `addendum.md` junto a este documento; aquí solo se registra la decisión de capacidad resultante.

## 1. Vision

Un monorepo Nx que aloja una aplicación Shell (host) y al menos tres microfrontends Angular independientes —Catálogo, Carrito/Checkout y Perfil de Usuario— federados en tiempo de ejecución vía Native Federation. El Shell compone la experiencia de una tienda demo; cada microfrontend se desarrolla, testea y builda de forma aislada, y todos comparten un Design System y una noción de sesión a través de librerías comunes del workspace.

El proyecto existe para que Antonio aprenda, de primera mano y no solo en teoría, cómo se coordinan builds, dependencias compartidas, versionado y despliegue entre múltiples aplicaciones Angular independientes dentro de un mismo repositorio. El resultado final —código, README y una demo pública desplegada— debe poder mostrarse como pieza de portafolio ante reclutadores o en entrevistas técnicas, evidenciando dominio práctico de Nx y de arquitecturas de microfrontend, no solo la capacidad de seguir un tutorial.

El énfasis no está en construir una tienda real: los datos son simulados y no hay backend ni pagos reales. El valor está en la arquitectura —independencia real de cada Remote, ausencia de acoplamientos de versión, un grafo de dependencias limpio en Nx— y en poder explicar con propiedad cada decisión detrás de ella. *(En MVP1, esa independencia se demuestra concretamente como build/serve aislado por remoto —FR-9— no como despliegue a hosts separados; el despliegue verdaderamente independiente por Remote es la extensión que evalúa Open Question 5, §12.)*

## 2. Target User

### 2.1 Jobs To Be Done

- **Como aprendiz de arquitecturas frontend**, Antonio quiere construir un monorepo real con microfrontends para entender de primera mano cómo se coordinan builds, dependencias compartidas y despliegues entre múltiples aplicaciones Angular independientes — no solo leerlo en un artículo.
- **Como desarrollador construyendo su portafolio**, Antonio quiere un proyecto demostrable y desplegado públicamente que evidencie dominio práctico de Nx, Angular y arquitecturas de microfrontend ante potenciales empleadores o entrevistadores.
- **Como builder solitario**, Antonio quiere que cada microfrontend se pueda desarrollar, testear y buildear de forma aislada, para experimentar en carne propia el valor (y los costos) reales de la independencia que promete esta arquitectura, en vez de asumirlo de memoria.

### 2.2 Non-Users (v1)

No hay usuarios finales reales de la "tienda": no hay clientes comprando, no hay operación de negocio, no hay datos personales reales. Los únicos dos roles que importan son Antonio (constructor/aprendiz) y un visitante externo del portafolio (recruiter, colega, entrevistador) que solo consume la demo, sin crear cuenta real ni transaccionar.

### 2.3 Key User Journeys

*Alcance ligero: proyecto solo-operador, sin stakeholders múltiples ni flujos de negocio reales — una frase por journey es suficiente.*

- **UJ-1.** Antonio, aprendiendo microfrontends, levanta el Shell y los 3 Remotes en local, navega Catálogo → Carrito → Perfil sin recargar la página completa, y confirma en DevTools que cada Remote se cargó como bundle independiente vía Native Federation.
- **UJ-2.** Un visitante del portafolio abre la URL pública de la demo, navega el catálogo, agrega un producto al carrito y revisa el perfil —todo fluido— y luego visita el README del repo para entender la arquitectura detrás.

## 3. Glossary

- **Monorepo** — Un único repositorio Git que aloja múltiples proyectos (apps y librerías) gestionados como workspace de Nx.
- **Workspace** — El repositorio Nx completo: configuración raíz, `apps/`, `libs/`, y el grafo de dependencias entre ellos.
- **Nx** — Herramienta de build y gestión de monorepos usada para generar, servir, buildear y testear cada proyecto del workspace, con caching de builds y análisis de grafo de dependencias (`nx affected`).
- **Shell (Host)** — La aplicación Angular contenedora que carga los Remotes en tiempo de ejecución y provee la navegación de nivel superior.
- **Remote** — Un Microfrontend Angular independiente, expuesto para ser cargado dinámicamente por el Shell. En este PRD hay tres: Catálogo, Carrito/Checkout y Perfil.
- **Microfrontend (MFE)** — Sinónimo funcional de Remote en este documento: una aplicación Angular autocontenida, con su propio ciclo de build/serve/test.
- **Native Federation** — Mecanismo de federación de microfrontends basado en ESM e import maps, integrado con el `ApplicationBuilder` (esbuild) de Angular. Enfoque de federación elegido para este proyecto (ver §4.1 y `addendum.md`).
- **Singleton (dependencia compartida)** — Una librería (ej. Angular, RxJS) que se carga una sola vez y se comparte entre Shell y todos los Remotes, en vez de duplicarse en cada bundle.
- **Design System / UI Kit** — La librería compartida (`libs/shared/ui`) con los componentes visuales base (botón, card, layout, header) reutilizados por Shell y los tres Remotes.
- **Sesión Compartida** — El estado de autenticación simulado (usuario autenticado sí/no, nombre) expuesto por `libs/shared/auth` y consistente entre Shell y los tres Remotes.
- **Carrito Compartido** — El estado del carrito (items, cantidades) expuesto por `libs/shared/cart` y consumido por los microfrontends Catálogo y Carrito/Checkout, análogo a cómo `libs/shared/auth` expone la Sesión Compartida.
- **Affected graph** — El subconjunto de proyectos del workspace que Nx identifica como impactados por un cambio dado (`nx affected`), usado para decidir qué rebuildear/testear.
- **Federación estática** — Modo de federación donde las URLs de los Remotes están fijas en la configuración del Shell. Usado en MVP1 (alcance de este documento).
- **Federación dinámica** — Modo de federación donde las URLs de los Remotes se resuelven en runtime a partir de un Manifest, en vez de estar fijas en el Shell. Confirmado como el objetivo de MVP2 (ver §6.3), fuera del alcance funcional de este documento.
- **Manifest** — Fuente de datos (archivo o endpoint) que lista las URLs vigentes de los Remotes, consultada por el Shell en runtime bajo federación dinámica.

## 4. Features

### 4.1 Shell (Host) de la Aplicación

**Descripción:** El Shell es la aplicación Angular que el usuario visita primero. Carga los tres Remotes vía Native Federation con lazy loading por ruta, y provee una navegación persistente (header) construida con el Design System compartido. Realiza UJ-1, UJ-2. Este documento cubre **MVP1**: la federación es estática (URLs de los tres Remotes fijas en la config del Shell). La migración a federación dinámica vía Manifest es la definición confirmada de **MVP2** (ver §6.3) y queda fuera del alcance funcional de este documento.

**Functional Requirements:**

#### FR-1: Enrutamiento federado a los tres microfrontends

El Shell carga y enruta a los tres Remotes (Catálogo, Carrito/Checkout, Perfil) vía Native Federation, con lazy loading por ruta. Realiza UJ-1.

**Consequences (testable):**
- Navegar a `/catalogo`, `/carrito` y `/perfil` desde el Shell carga el bundle del Remote correspondiente sin recargar la página completa.
- Cada Remote aparece como una entrada de red/bundle separada en las DevTools al navegar a su ruta por primera vez.
- Angular y RxJS se cargan una sola vez (como Singleton) independientemente de cuántos Remotes se visiten.

#### FR-2: Navegación persistente común

El Shell muestra un header de navegación persistente entre las rutas de los tres Remotes, construido a partir de componentes del Design System compartido (§4.6).

**Consequences (testable):**
- El header no se recarga (mismo nodo DOM persiste, sin parpadeo/layout-shift visible) al navegar entre Catálogo, Carrito y Perfil.
- El header usa componentes de `libs/shared/ui`, no una implementación propia duplicada en el Shell.
- El header muestra un contador de items del Carrito Compartido (§3, `libs/shared/cart`) que se actualiza sin recarga de página al agregar un producto desde Catálogo (realiza parte de FR-4).

### 4.2 Microfrontend: Catálogo de Productos

**Descripción:** Remote que lista productos simulados (mock) con nombre, precio, imagen y categoría, con filtro básico por categoría, y permite agregarlos al Carrito Compartido (§3) expuesto por `libs/shared/cart`. `[ASSUMPTION: los datos de productos son un dataset mock estático embebido en el propio remote —JSON local—, sin backend real, dado que no hay requisito de persistencia de catálogo entre sesiones]`.

**Functional Requirements:**

#### FR-3: Listado y filtro de productos

El usuario puede ver una lista de productos mock (nombre, precio, imagen, categoría) y filtrarla por categoría dentro del microfrontend Catálogo.

**Consequences (testable):**
- La lista muestra al menos 8-12 productos mock distribuidos en al menos 3 categorías.
- Seleccionar una categoría reduce la lista visible a solo esa categoría, sin recargar la página.

#### FR-4: Agregar producto al carrito (estado cross-remote)

El usuario puede agregar un producto desde el microfrontend Catálogo al Carrito Compartido (§3), expuesto por la librería compartida `libs/shared/cart`, y el estado se refleja en el microfrontend Carrito/Checkout sin recargar la página completa. Realiza también la consecuencia del contador de header definida en FR-2. `[NOTE: la consistencia de este estado cross-remote solo está garantizada cuando los Remotes se acceden federados a través del Shell — ver la aclaración de alcance en FR-9]`.

**Consequences (testable):**
- Agregar un producto en Catálogo y luego navegar a `/carrito` (dentro del Shell) muestra ese producto en la lista del Carrito.
- Catálogo y Carrito/Checkout leen y escriben el mismo estado a través de `libs/shared/cart`; ninguno mantiene su propia copia del carrito.

**Out of Scope:**
- Persistencia del carrito entre sesiones de navegador distintas (ver §6.2).

### 4.3 Microfrontend: Carrito / Checkout

**Descripción:** Remote que muestra los productos agregados al carrito, permite modificar cantidades y eliminarlos, calcula el total, y simula un flujo de checkout sin pago real.

**Functional Requirements:**

#### FR-5: Gestión de carrito y checkout simulado

El usuario puede ver los items del carrito, modificar su cantidad, eliminarlos, ver el total calculado, y completar un checkout simulado (sin procesamiento de pago real) que vacía el carrito y muestra una confirmación.

**Consequences (testable):**
- Cambiar la cantidad de un item recalcula el total mostrado inmediatamente.
- Eliminar el único item del carrito muestra un estado de "carrito vacío".
- Completar el checkout simulado limpia el carrito y muestra una pantalla/mensaje de confirmación, sin llamar a ningún servicio de pago real.

**Out of Scope:**
- Procesamiento de pago real o integración con pasarelas de pago (ver §5 Non-Goals).

### 4.4 Microfrontend: Perfil de Usuario

**Descripción:** Remote que muestra datos de un usuario mock (nombre, email, historial simulado de pedidos) y permite editar campos básicos, persistiendo localmente.

**Functional Requirements:**

#### FR-6: Ver y editar perfil mock

El usuario puede ver los datos de su perfil mock (nombre, email, historial simulado de pedidos) y editar nombre/email, persistiendo el cambio en `localStorage`.

**Consequences (testable):**
- Editar el nombre y recargar la página (F5) conserva el nuevo valor.
- El historial de pedidos mostrado es una lista mock estática o generada, no requiere backend.

### 4.5 Sesión Compartida (Auth Mock)

**Descripción:** Un servicio de sesión simulado, vivido en la librería compartida `libs/shared/auth`, que expone si hay un usuario "autenticado" y su nombre, consistente entre Shell y los tres Remotes sin necesidad de un backend real. `[ASSUMPTION: el estado de sesión se mantiene en memoria/localStorage vía un servicio Angular en la lib compartida, no vía cookies ni JWT real, dado que no hay backend]`.

**Functional Requirements:**

#### FR-7: Estado de sesión consistente entre Remotes

El usuario puede "iniciar sesión" (mock) desde el Shell o el Perfil, y el estado de sesión (autenticado sí/no, nombre) es visible y consistente en los tres Remotes vía la librería compartida `libs/shared/auth`.

**Consequences (testable):**
- Iniciar sesión desde el Shell y navegar a Catálogo, Carrito y Perfil muestra el mismo nombre de usuario/estado autenticado en los tres, sin necesidad de volver a "iniciar sesión" en cada uno.
- Cerrar sesión limpia el estado en los tres Remotes simultáneamente (verificable navegando entre ellos tras el logout).

### 4.6 Design System Compartido

**Descripción:** Librería `libs/shared/ui` con componentes base (botón, card, layout, header) consumidos por el Shell y los tres Remotes, evitando que cada uno reimplemente su propia UI desde cero.

**Functional Requirements:**

#### FR-8: Componentes base reutilizados sin duplicación

El Shell y los tres Remotes consumen componentes base (botón, card, layout, header) desde `libs/shared/ui`; ninguno implementa su propia versión de estos componentes.

**Consequences (testable):**
- Una búsqueda de definiciones de componente "botón"/"card" en el workspace solo encuentra una implementación, dentro de `libs/shared/ui`.
- Un cambio visual en el botón compartido (ej. color) se refleja en Shell y los tres Remotes sin tocar código dentro de `apps/`.

### 4.7 Independencia de Build y Serve por Remote

**Descripción:** Cada Remote es un proyecto Nx independiente, ejecutable y buildable de forma aislada, sin requerir que el Shell u otros Remotes estén corriendo — el requisito central que hace de este proyecto un ejercicio real de microfrontends y no solo una SPA dividida en carpetas. Esta independencia es de build/serve; no implica despliegue independiente a hosts separados (ver §1, §6.2, §6.3) ni sincronización de estado compartido fuera del contexto federado (ver FR-9).

**Functional Requirements:**

#### FR-9: Serve y build aislado por Remote

Cada uno de los tres Remotes puede levantarse (`nx serve <remote>`) y buildearse (`nx build <remote>`) de forma aislada, sin que el Shell ni los otros Remotes necesiten estar corriendo o buildeados primero. Esta independencia es de **build y serve**, no una garantía de que el estado compartido (Carrito, Sesión) se mantenga sincronizado en ese modo: en standalone cada Remote corre en su propio origin/puerto, y `libs/shared/cart`/`libs/shared/auth` (en memoria/`localStorage`) están scoped a ese origin. La consistencia de estado cross-remote que prometen FR-4 y FR-7 aplica cuando los Remotes se acceden **federados a través del Shell** (mismo origin de despliegue); en modo standalone de desarrollo, cada Remote usa su propio estado local no sincronizado, y eso es esperado, no un bug.

**Consequences (testable):**
- Ejecutar `nx serve catalogo` (sin el Shell corriendo) levanta el microfrontend Catálogo de forma standalone, navegable directamente en su propio puerto.
- Ejecutar `nx serve shell` (sin los Remotes corriendo en modo standalone aparte) también levanta el Shell de forma aislada, federando los Remotes normalmente vía su configuración estática.
- `nx build <remote>` para cada uno de los tres Remotes se completa sin errores de dependencias faltantes de otro Remote específico (solo de las libs compartidas del workspace).
- `nx affected` identifica correctamente qué Remotes se ven impactados al modificar `libs/shared/ui`, `libs/shared/auth` o `libs/shared/cart`, y no marca como afectados Remotes que no consumen esa lib.
- Un Remote corriendo en modo standalone (fuera del Shell) muestra un estado de Carrito/Sesión vacío o local, sin intentar sincronizar contra otro origin.

### 4.8 Documentación y Demo Pública

**Descripción:** Dado el propósito dual de aprendizaje y portafolio (§1), el repositorio necesita documentación clara y una demo accesible públicamente — sin esto, el valor de portafolio del proyecto no se materializa aunque el código funcione. `[ASSUMPTION: se prioriza tener el README y el deploy funcionando sobre pulir features adicionales, dado que "portafolio visible" fue señalado explícitamente como propósito]`.

**Functional Requirements:**

#### FR-10: README con instrucciones y arquitectura

El repositorio expone un README con instrucciones de instalación, los comandos para correr Shell + los tres Remotes en local, un diagrama simple de la arquitectura (Shell/Remotes/libs compartidas), y un link a la demo desplegada.

**Consequences (testable):**
- Una persona que no conoce el proyecto puede, siguiendo solo el README, clonar el repo y levantar Shell + los tres Remotes en local.
- El README incluye al menos un diagrama (aunque sea ASCII o una imagen simple) mostrando Shell, los tres Remotes y las dos libs compartidas.

#### FR-11: Demo pública desplegada

La aplicación completa (Shell + tres Remotes federados) está desplegada y accesible públicamente vía una única URL, sin requerir que el visitante instale nada localmente. Realiza UJ-2.

**Consequences (testable):**
- Abrir la URL pública en un navegador sin configuración previa muestra el Shell funcionando, con los tres Remotes navegables (Catálogo, Carrito, Perfil).
- La demo pública no requiere backend propio corriendo (los mocks funcionan client-side).

## 5. Non-Goals (Explicit)

- Este proyecto **no** procesa pagos reales ni se integra con pasarelas de pago (Stripe, PayPal, etc.).
- Este proyecto **no** implementa un backend real (API REST/GraphQL); todos los datos son mock, embebidos o en `localStorage`.
- Este proyecto **no** explora federación políglota (mezclar Angular con React/Vue); los cuatro proyectos (Shell + 3 Remotes) son 100% Angular.
- Este proyecto **no** implementa autenticación real y segura (OAuth, JWT contra un servidor); la sesión es enteramente simulada.
- Este proyecto **no** cubre soporte multi-idioma (i18n) ni una versión móvil nativa.
- Este proyecto **no** se convierte en una plantilla/starter genérico reutilizable para terceros — es un ejercicio de aprendizaje propio, no una librería a mantener para otros.

## 6. MVP Scope

### 6.1 In Scope

- Shell + 3 Remotes (Catálogo, Carrito/Checkout, Perfil) federados vía Native Federation.
- Design system compartido (`libs/shared/ui`), sesión mock compartida (`libs/shared/auth`) y carrito compartido (`libs/shared/cart`).
- Datos mock client-side, sin backend.
- Cada Remote desarrollable, testeable y buildeable de forma aislada.
- Demo desplegada públicamente + README con instrucciones y diagrama de arquitectura.

### 6.2 Out of Scope for MVP

- Pipelines de CI/CD con despliegue independiente por Remote (cada uno a su propio host/pipeline). `[NOTE FOR PM: esto es precisamente lo que demuestra "independent deployability" de verdad — vale la pena revisar como extensión futura si el tiempo lo permite, ver §12]`.
- Federación dinámica vía Manifest — confirmado como el objetivo central de **MVP2** (ver §6.3); MVP1 (este documento) usa federación estática.
- Tests end-to-end cruzando los tres Remotes — se evalúa como extensión posterior (ver §12 Open Questions sobre alcance de testing).
- Persistencia de carrito entre sesiones de navegador distintas.
- Cualquier forma de pago real, backend real, o i18n (ver §5 Non-Goals).

### 6.3 MVP2 (Confirmado, Fuera de Alcance de Este PRD)

Antonio confirmó que este documento cubre exclusivamente **MVP1**. MVP2 ya tiene fija una decisión de arquitectura: migrar de federación estática a **federación dinámica vía Manifest** (URLs de los Remotes resueltas en runtime en vez de fijas en la config del Shell — ver Glosario §3 y `addendum.md`).

El resto del alcance de MVP2 —sus FRs, criterios de éxito, y si absorbe también otros ítems ya señalados como diferidos en §6.2 (ej. CI/CD independiente por Remote)— no se define en este documento. Cuando arranque esa fase, este PRD se actualiza (o se crea un PRD2 derivado) para especificar MVP2 con el mismo nivel de detalle que MVP1.

## 7. Cross-Cutting NFRs

- **Performance (build):** el build incremental de cada Remote en modo desarrollo debe completarse en menos de 10 segundos, aprovechando el `ApplicationBuilder` basado en esbuild y el computation caching de Nx.
- **DX (developer experience):** `nx affected` debe identificar correctamente qué Remotes rebuildear/retestear al modificar una lib compartida (`libs/shared/ui`, `libs/shared/auth`), sin falsos negativos ni un grafo de dependencias "spaghetti" donde todo importa todo.
- **Reliability (versionado):** Angular y RxJS se comparten como Singleton entre Shell y los tres Remotes; no debe haber errores de "version mismatch" en runtime entre ellos.
- **Maintainability:** cada Remote debe poder desarrollarse y debuggearse de forma aislada por un solo desarrollador, sin necesidad de levantar todo el workspace para trabajar en uno solo.

## 8. Constraints and Guardrails

- **Cost:** el proyecto debe operar con costo $0 — hosting en un tier gratuito para el deploy público. `[ASSUMPTION: proveedor de hosting específico sin decidir aún, ver Open Question 3]`.
- **Privacy:** no se manejan datos reales de usuarios; todos los datos (productos, perfil, historial de pedidos) son simulados.
- **Safety:** no aplica un riesgo formal de seguridad/datos sensibles dado que no hay backend ni datos reales — el checkout y el login son simulaciones sin efectos reales.

## 9. Developer Product: Runtime y Dependencias

- **Language / Runtime Targets:** Angular y Nx en la última versión estable disponible al iniciar **Fase 0**, y fijada (pinned) para el resto de las 5 fases del roadmap (§10) — sin actualizaciones mid-project que reintroduzcan el riesgo de "version mismatch" que `addendum.md` señala como pitfall principal. Se actualiza solo ante un blocker real (ej. vulnerabilidad de seguridad), no por disponibilidad de una versión más nueva. Node.js LTS, TypeScript en modo `strict`.
- **Dependency Policy:** federación vía Native Federation (ver `addendum.md` para el paquete específico y la comparación con Module Federation); Angular y RxJS declarados como Singleton compartido entre Shell y Remotes.
- **Versionado de libs compartidas:** `libs/shared/ui` y `libs/shared/auth` viven dentro del mismo workspace (no se publican a npm); se versionan implícitamente por el commit del monorepo, sin semver formal en el MVP.
- **Performance Budget:** bundle inicial del Shell objetivo `<300KB` gzip. `[ASSUMPTION: valor de referencia razonable para una demo de este tamaño, no medido aún contra una build real]`.

## 10. Roadmap por Fases

*Ritmo estimado a dedicación part-time, ~1 fase por semana. `[ASSUMPTION: el pacing exacto es orientativo y se ajusta a la disponibilidad real de Antonio, ver §13 Assumptions Index]`.*

- **Fase 0 — Scaffolding:** crear el Nx workspace, generar Shell + 3 Remotes vacíos con Native Federation configurada, routing básico funcionando entre ellos. Realiza FR-1, FR-9.
- **Fase 1 — Catálogo + Design System:** implementar el microfrontend Catálogo con datos mock y filtro por categoría; extraer los primeros componentes compartidos a `libs/shared/ui`. Realiza FR-3, FR-8.
- **Fase 2 — Carrito + Sesión Compartida:** implementar Carrito/Checkout con estado cross-remote desde Catálogo vía `libs/shared/cart`, y sesión mock compartida vía `libs/shared/auth`. Realiza FR-2 (contador), FR-4, FR-5, FR-7.
- **Fase 3 — Perfil + Pulido:** implementar el microfrontend Perfil, revisar NFRs (tiempos de build, `nx affected`), pulir la navegación y el header compartido. Realiza FR-2, FR-6.
- **Fase 4 — Deploy + Documentación:** desplegar la demo pública, escribir el README con diagrama de arquitectura. Realiza FR-10, FR-11.
- **MVP2 (futuro, fuera de alcance de este documento):** migrar de federación estática a federación dinámica vía Manifest (ver §6.3). Sin FRs ni fecha definidos todavía.

## 11. Success Metrics

**Primary**
- **SM-1**: Antonio puede explicar y demostrar en voz alta —usando su propio repo como referencia— cómo funciona Native Federation (host/remote/singleton) y por qué se prefirió sobre Module Federation clásico. Validates FR-1, FR-9.
- **SM-2**: Shell + 3 Remotes corren federados, tanto en local como en la demo pública, sin errores de "version mismatch" entre Angular/RxJS. Validates FR-1, FR-7, FR-9.
- **SM-3**: Demo pública desplegada, accesible vía URL compartible, con README completo y navegable end-to-end (Catálogo → Carrito → Perfil). Validates FR-10, FR-11.

**Secondary**
- **SM-4**: El build incremental de cada Remote se mantiene bajo el budget de performance definido (§7). Validates NFR de performance.
- **SM-5**: `nx affected` identifica correctamente los Remotes impactados al modificar `libs/shared/ui` o `libs/shared/auth`. Validates NFR de DX (§7).

**Counter-metrics (do not optimize)**
- **SM-C1**: No optimizar por "terminarlo rápido" copiando patrones de tutoriales sin entenderlos — el objetivo declarado es comprensión profunda, no solo un demo funcionando. Counterbalances SM-3.
- **SM-C2**: No sacrificar la independencia real de cada Remote (FR-9) mediante atajos que los acoplen fuertemente solo para ahorrar tiempo de desarrollo. Counterbalances SM-1, SM-2.

## 12. Open Questions

1. ¿Vale la pena, en una fase posterior, experimentar también con Module Federation clásico para comparar en carne propia contra Native Federation, dado que el objetivo es aprender ambos paradigmas del ecosistema? (relacionado con la decisión de §4.1 y `addendum.md`)
2. ¿La demo pública debe mostrar el flujo de "iniciar sesión" de forma prominente en la portada, o basta con que exista internamente y sea descubrible navegando?
3. ¿Qué proveedor de hosting se usará para el deploy público (Vercel, Netlify, GitHub Pages, Cloudflare Pages)? La elección afecta cómo se sirven múltiples Remotes con Native Federation en producción.
4. ¿Se requiere algún nivel de testing automatizado (unit y/o e2e cross-remote) como parte del objetivo de aprendizaje, o queda fuera de alcance de este PRD y se resuelve informalmente durante el desarrollo?
5. ¿Vale la pena, como extensión v2, implementar pipelines de CI/CD con despliegue independiente por Remote, dado que eso es lo que demuestra "independent deployability" de forma más fiel? (ver §6.2 NOTE FOR PM)

## 13. Assumptions Index

- §4.2 — Datos de productos como dataset mock estático embebido, sin backend.
- §4.5 — Sesión compartida enteramente mock (en memoria/`localStorage`), sin cookies ni JWT real.
- §4.8 — Se prioriza tener README y deploy funcionando sobre pulir features adicionales, dado el propósito de portafolio.
- §9 — Bundle inicial del Shell `<300KB` gzip como budget de referencia, no medido aún contra una build real.
- §8 — Proveedor de hosting específico sin decidir (ver Open Question 3).
- §10 — Pacing de ~1 fase por semana es orientativo, ajustable a la disponibilidad real part-time de Antonio.
