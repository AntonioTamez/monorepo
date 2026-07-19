---
stepsCompleted: [step-01-validate-prerequisites, step-02-design-epics, step-03-create-stories, step-04-final-validation]
inputDocuments:
  - planning-artifacts/prds/prd-monorepo-2026-07-17/prd.md
  - planning-artifacts/prds/prd-monorepo-2026-07-17/addendum.md
  - planning-artifacts/architecture/architecture-monorepo-2026-07-18/ARCHITECTURE-SPINE.md
  - planning-artifacts/ux-designs/ux-monorepo-2026-07-17/DESIGN.md
  - planning-artifacts/ux-designs/ux-monorepo-2026-07-17/EXPERIENCE.md
---

# Llano — Monorepo de Microfrontends Angular y Nx - Epic Breakdown

## Overview

Este documento descompone en épicas y historias implementables los requisitos del PRD
(`prd-monorepo-2026-07-17`), el spine de Arquitectura (`architecture-monorepo-2026-07-18`) y el
par de UX (`ux-monorepo-2026-07-17`, DESIGN.md + EXPERIENCE.md) — MVP1 completo: Shell + 3
Remotes (Catálogo, Carrito/Checkout, Perfil) federados vía Native Federation.

## Requirements Inventory

### Functional Requirements

FR-1: El Shell carga y enruta a los tres Remotes (Catálogo, Carrito/Checkout, Perfil) vía Native Federation, con lazy loading por ruta.
FR-2: El Shell muestra un header de navegación persistente entre las rutas de los tres Remotes, construido a partir de componentes del Design System compartido.
FR-3: El usuario puede ver una lista de productos mock (nombre, precio, imagen, categoría) y filtrarla por categoría dentro de Catálogo.
FR-4: El usuario puede agregar un producto desde Catálogo al Carrito Compartido (`libs/shared/cart`), reflejado en Carrito/Checkout sin recargar la página.
FR-5: El usuario puede ver los items del carrito, modificar cantidad, eliminarlos, ver el total, y completar un checkout simulado que vacía el carrito y muestra confirmación.
FR-6: El usuario puede ver los datos de su perfil mock (nombre, email, historial simulado de pedidos) y editar nombre/email, persistiendo en `localStorage`.
FR-7: El usuario puede "iniciar sesión" (mock) desde el Shell o Perfil, y el estado de sesión es visible y consistente en los tres Remotes vía `libs/shared/auth`.
FR-8: El Shell y los tres Remotes consumen componentes base (botón, card, layout, header) desde `libs/shared/ui`; ninguno implementa su propia versión.
FR-9: Cada uno de los tres Remotes puede levantarse (`nx serve <remote>`) y buildearse (`nx build <remote>`) de forma aislada, sin que el Shell ni los otros Remotes estén corriendo/buildeados. Independencia de build/serve, no de sincronización de estado compartido fuera del contexto federado.
FR-10: El repositorio expone un README con instrucciones de instalación, comandos para correr Shell + 3 Remotes en local, un diagrama simple de arquitectura, y un link a la demo desplegada.
FR-11: La aplicación completa (Shell + 3 Remotes federados) está desplegada y accesible públicamente vía una única URL, sin requerir instalación local.

### NonFunctional Requirements

NFR-1 (Performance/build): el build incremental de cada Remote en desarrollo debe completarse en menos de 10 segundos, aprovechando `ApplicationBuilder` (esbuild) y el computation caching de Nx.
NFR-2 (DX): `nx affected` debe identificar correctamente qué Remotes rebuildear/retestear al modificar una lib compartida (`libs/shared/ui`, `libs/shared/auth`, `libs/shared/cart`), sin falsos negativos ni un grafo de dependencias "spaghetti".
NFR-3 (Reliability/versionado): Angular y RxJS compartidos como Singleton entre Shell y los tres Remotes — sin errores de "version mismatch" en runtime.
NFR-4 (Maintainability): cada Remote debe poder desarrollarse y debuggearse de forma aislada por un solo desarrollador, sin necesidad de levantar todo el workspace.
NFR-5 (Cost): el proyecto debe operar con costo $0 — hosting en un tier gratuito para el deploy público.
NFR-6 (Privacy/Safety): no se manejan datos reales de usuarios — todos los datos (productos, perfil, historial de pedidos) son simulados; no aplica un riesgo formal de seguridad dado que no hay backend ni datos reales.
NFR-7 (Performance/bundle): bundle inicial del Shell objetivo `<300KB` gzip — medido en cada build de producción; si se supera, es blocker de esa fase.
NFR-8 (Versioning policy): Angular y Nx en la última versión estable disponible al iniciar Fase 0, fijada (pinned) para el resto del roadmap — sin actualizaciones mid-project salvo un blocker real (ej. vulnerabilidad de seguridad). TypeScript en modo `strict`, Node.js LTS.
NFR-9 (Accessibility): WCAG 2.2 AA como piso en las tres superficies (Catálogo, Carrito, Perfil) — ver UX-DRs de accesibilidad para el detalle comportamental.

### Additional Requirements

*(De `ARCHITECTURE-SPINE.md` — decisiones técnicas que fijan cómo se implementa lo que el PRD y el UX piden.)*

**Starter/scaffolding (impacta Epic 1 Story 1):** no hay starter template de terceros — el scaffold es vía generadores nativos de Nx: `nx g @nx/angular:host apps/shell --remotes=catalogo,carrito,perfil` y `nx g @nx/angular:remote apps/<remote> --host=shell` (addendum.md), sobre Nx 23.1 + Angular 22.

- Organización de libs por tipo Nx estándar (`feature`/`ui`/`data-access`/`util`) por scope (`catalogo`/`carrito`/`perfil`/`shell`/`shared`), enforced con tags + `@nx/enforce-module-boundaries` (AD-1, AD-2). Ningún Remote depende de otro Remote, directa ni transitivamente.
- `libs/shared/cart` y `libs/shared/auth` implementados como servicio Angular único `providedIn: 'root'` cada uno, con `signal()`/`computed()` como fuente de verdad (no NgRx, no BehaviorSubject) — el total del carrito es un `computed()` derivado, nunca sincronizado a mano. Editar Perfil (FR-6) llama al mismo método del service de `libs/shared/auth` que usa el login (AD-3).
- `libs/shared/util-types` exporta `Product`, `CartItem`, `User`/`Session` — ningún Remote redefine estos tipos. `price` siempre `number` decimal (nunca centavos), formateado con un único helper compartido (AD-4).
- Fallo de carga de un Remote: cada ruta federada envuelve `loadRemoteModule(...)` en un `.catch()` que resuelve a `RemoteUnavailableComponent` (`libs/shared/ui`), dentro del mismo `<router-outlet>`, con `role="alert"`/`aria-live="polite"`. El botón "Reintentar" reinvoca la carga solo para esa ruta, nunca un reload completo. No cubre errores de runtime en un Remote ya montado (AD-5, Deferred).
- `federation.config.mjs` (no `.js`) de Shell y los 3 Remotes declara `shared: true`/`singleton: true` para Angular, RxJS, **y también** `libs/shared/auth`, `libs/shared/cart`, `libs/shared/util-types` — evita que cada Remote bundlee su propia copia de estos services (AD-6).
- Deploy único a Cloudflare Pages (free tier): cada Remote se buildea con `--base-href=/{remote}/` coincidente con su sub-path; un script combina los 4 `dist/` de Nx en un directorio `publish/` único; el archivo `_redirects` declara las reglas de cada Remote **antes** que el catch-all SPA del Shell (AD-7).
- Exposición de federación: cada Remote expone solo rutas/componentes lazy de su `feature` lib — nunca el `AppModule`/bootstrap completo (antipatrón señalado en addendum.md).
- Un único `tailwind.config` en la raíz del workspace, extendido (no redefinido) por Shell y los 3 Remotes, mapeando los tokens de `DESIGN.md`.
- Stack fijado: Nx 23.1, Angular 22, `@angular-architects/native-federation` 22.0.6, Node.js 24 (Active LTS), TypeScript `strict`, Tailwind CSS, Cloudflare Pages.
- **Fuera de alcance / Deferred (no crear historias para esto en MVP1):** profundidad de testing unit/e2e cross-remote, CI/CD con deploy independiente por Remote, federación dinámica vía Manifest (MVP2), escalar `cart`/`auth` a NgRx, aislamiento de errores de runtime en un Remote ya montado.

### UX Design Requirements

*(De `DESIGN.md` + `EXPERIENCE.md`, par de UX `ux-monorepo-2026-07-17` — identidad visual "Llano", editorial-minimalista.)*

**Design tokens:**

UX-DR1: Paleta de colores monocromática + un único acento terracota (`accent #B8432B`, contraste ~5.4:1) implementada como tokens (`background`, `surface`, `surface-alt`, `border`, `border-strong #8A8A85`, `ink`, `ink-muted`, `ink-faint`, `success #3F6B4E`, `error #B3261E`) — `accent` reservado exclusivamente para botones primarios, precios, cart-badge y estado "seleccionado".
UX-DR2: Escala tipográfica de dos familias — Fraunces (serif, solo títulos/marca, peso 400 siempre: `display-lg`, `display-lg-mobile`, `headline-md`, `headline-sm`) e Inter (sans, todo lo funcional: `body-lg`, `body-md`, `label`, `caption`).
UX-DR3: Escala de `rounded` (`sm` 2px – `DEFAULT` 4px en casi todo) con exactamente dos excepciones a `rounded.full`: Cart Badge y Session Widget — ningún otro elemento usa esquinas totalmente redondeadas.
UX-DR4: Escala de `spacing` basada en unidad de 4px + `gutter` (24px) + márgenes responsivos (`margin-mobile` 20px / `margin-desktop` 80px) + `editorial-gap` (96px) entre secciones mayores.

**Componentes reutilizables (Design System, `libs/shared/ui` salvo que se indique):**

UX-DR5: Botón primario (fondo `accent`, hover `accent-hover`, disabled real vía atributo `disabled` no solo color) y Botón secundario (borde `border-strong`, fondo transparente) — nunca más de un botón primario visible por vista.
UX-DR6: Product Card (Catálogo) — imagen 4:5, renderizada como `<button>` nativo con `aria-label="Agregar {producto} al carrito"`, imagen `alt=""` (decorativa), sombra sutil + título sube 2px en hover; al agregar, micro-confirmación inline "Agregado ✓" (~1.5s, sin toast/modal).
UX-DR7: Cart Badge — círculo `rounded.full`, visible solo cuando hay ≥1 item, anclado al ícono de carrito del header.
UX-DR8: Header/Nav — barra fija persistente en las 3 superficies, aloja Cart Badge + Session Widget, colapsa a solo íconos en `<md` (sin ocultar marca/carrito/sesión, solo labels de texto).
UX-DR9: Category Chip — selección única (no multi-select), estado activo con `accent` + `aria-pressed` + indicador de forma (no solo color); "Todos" como chip por defecto.
UX-DR10: Cart Line Item — thumbnail 48×60px (`alt=""`, decorativo), stepper de cantidad (se detiene en 1, eliminar es acción explícita con ícono), total optimista anunciado vía `aria-live="polite"`.
UX-DR11: Checkout Button — instancia de Botón primario en Carrito, deshabilitado con atributo `disabled` real (no solo clase visual) cuando el carrito está vacío.
UX-DR12: Login Form — estilo underline (sin caja), label siempre visible (nunca placeholder-as-label), un solo campo de nombre (sin contraseña real).
UX-DR13: Session Widget — ícono circular en el header (única otra excepción a `rounded.full`), refleja el mismo estado de sesión en las 3 superficies sin re-login.
UX-DR14: Order History Row — fila de solo lectura, sin acciones ni hover interactivo.
UX-DR15: RemoteUnavailableComponent — estado "Remote no disponible" con headline + botón secundario "Reintentar", acotado al área de esa sección (no rompe header/nav).

**Estados:**

UX-DR16: Estado de carga inicial (federación en curso) — skeleton del layout esperado por superficie, con `aria-busy="true"` en el contenedor, sin spinner genérico de pantalla completa.
UX-DR17: Estados vacíos — "Filtro sin resultados" (Catálogo) y "Carrito vacío" (Carrito), cada uno con botón secundario de recuperación (Ver todos / Ir a Catálogo).
UX-DR18: Estado "Checkout confirmado" — ícono + texto en `success`, reemplaza la lista de items en la misma ruta de Carrito (no una superficie nueva).
UX-DR19: No existe estado de error de validación de formulario — Login/Perfil son guardados simulados que siempre completan con éxito (confirmar en la implementación que no se construye manejo de error de forms).

**Accesibilidad (WCAG 2.2 AA, piso en las 3 superficies):**

UX-DR20: Estructura semántica — un `<h1>` por superficie, cada Remote compuesto dentro de su propio `<main>`, títulos de Product Card como `<h3>` subordinados.
UX-DR21: Foco visible (`outline` en `accent`) en todo elemento interactivo; orden de tab según orden de lectura.
UX-DR22: Estado "Remote no disponible" anunciado vía `role="alert"`/`aria-live="polite"`.
UX-DR23: Transiciones (hover-lift, swap "Agregado ✓", flash de borde `success`) respetan `prefers-reduced-motion: reduce`.

**Responsive:**

UX-DR24: Breakpoints — `≥lg` grid Catálogo 3-4 columnas + nav completa; `md` grid 2 columnas; `<md` grid 1 columna + header colapsado a íconos.

**Voice & Tone / Interaction (cross-cutting, no un componente único):**

UX-DR25: Microcopy editorial y directo — sin signos de exclamación, sin lenguaje de urgencia/venta, sin emojis (ver tabla Do/Don't de `EXPERIENCE.md`).
UX-DR26: Prohibido en todo el sistema — modales de confirmación para acciones reversibles de bajo riesgo, badges de urgencia/escasez, auto-play, infinite scroll en Catálogo.

### FR Coverage Map

FR-1: Epic 1 - Enrutamiento federado a los tres microfrontends
FR-9: Epic 1 - Serve y build aislado por Remote
FR-3: Epic 2 - Listado y filtro de productos
FR-8: Epic 2 - Componentes base reutilizados sin duplicación
FR-2: Epic 3 - Navegación persistente (contador de carrito incluido)
FR-4: Epic 3 - Agregar producto al carrito (estado cross-remote)
FR-5: Epic 3 - Gestión de carrito y checkout simulado
FR-7: Epic 3 - Estado de sesión consistente entre Remotes (login: Story 3.7; logout: Story 3.8)
FR-6: Epic 4 - Ver y editar perfil mock
FR-10: Epic 5 - README con instrucciones y arquitectura
FR-11: Epic 5 - Demo pública desplegada

## Epic List

### Epic 1: Fundación federada — Shell + Remotes independientes
Se puede levantar el Shell, navegar entre las 3 rutas federadas (aún vacías de contenido de negocio), cada Remote se sirve/buildea de forma aislada, y un fallo de carga de un Remote se ve acotado con opción de "Reintentar" — sin romper el resto de la navegación.
**FRs covered:** FR-1, FR-9

### Epic 2: Catálogo navegable con Design System compartido
El usuario ve y filtra productos mock por categoría en Catálogo; los primeros componentes base (Botón, Product Card, Category Chip) viven en `libs/shared/ui` y ya no se reimplementan por Remote.
**FRs covered:** FR-3, FR-8

### Epic 3: Carrito cross-remote + Sesión compartida
Agregar un producto en Catálogo se refleja en Carrito sin recargar la página; el usuario gestiona cantidades, completa un checkout simulado, y puede "iniciar sesión" mock con estado consistente en las 3 superficies (header incluido, con su contador de carrito).
**FRs covered:** FR-2, FR-4, FR-5, FR-7

### Epic 4: Perfil de usuario
El usuario ve y edita su perfil mock (nombre/email) y su historial simulado de pedidos, persistido en `localStorage`.
**FRs covered:** FR-6

### Epic 5: Documentación + Demo pública
Cualquiera puede abrir una URL pública y usar la demo completa sin instalar nada; el README explica cómo correrlo en local, con diagrama de arquitectura.
**FRs covered:** FR-10, FR-11

## Epic 1: Fundación federada — Shell + Remotes independientes

Se puede levantar el Shell, navegar entre las 3 rutas federadas (aún vacías de contenido de negocio), cada Remote se sirve/buildea de forma aislada, y un fallo de carga de un Remote se ve acotado con opción de "Reintentar" — sin romper el resto de la navegación.

### Story 1.1: Scaffolding del workspace Nx con Shell y 3 Remotes federados

As a Antonio (dev),
I want generar el workspace Nx con Shell + 3 Remotes (Catálogo, Carrito, Perfil) vía Native Federation,
So that tengo la base federada mínima corriendo antes de construir cualquier feature.

**Acceptance Criteria:**

**Given** un repo vacío
**When** corro los generadores de `@nx/angular` (Nx 23.1, Angular 22) para host + 3 remotes
**Then** se crean `apps/shell`, `apps/catalogo`, `apps/carrito`, `apps/perfil`, cada uno con `federation.config.mjs`
**And** Angular y RxJS quedan declarados `singleton: true` en los 4 archivos de federación (AD-6)
**And** `nx serve shell` levanta el Shell federando los 3 Remotes sin errores de consola

### Story 1.2: Organización de libs con tags Nx y boundaries enforced

As a Antonio (dev),
I want que las libs sigan el tipado `feature`/`ui`/`data-access`/`util` con tags de scope,
So that ningún Remote pueda importar código de otro por error.

**Acceptance Criteria:**

**Given** el workspace scaffolded (Story 1.1)
**When** genero las libs iniciales con tags `scope:*`/`type:*` y configuro `@nx/enforce-module-boundaries`
**Then** un import de prueba desde `apps/carrito` hacia código de `apps/catalogo` falla el lint
**And** un import de prueba desde una lib `ui` hacia una `data-access` falla el lint

### Story 1.3: Navegación federada entre las 3 rutas del Shell

As a un visitante,
I want navegar entre `/catalogo`, `/carrito` y `/perfil` desde el Shell sin recargar la página completa,
So that experimento la app como una sola tienda continua, no tres apps separadas.

**Acceptance Criteria:**

**Given** el Shell corriendo con los 3 Remotes federados
**When** navego a cada una de las 3 rutas
**Then** cada ruta carga el bundle del Remote correspondiente sin recarga completa de página
**And** cada Remote aparece como entrada de red separada en DevTools la primera vez que se visita
**And** Angular/RxJS se cargan una sola vez sin importar cuántos Remotes se visiten

### Story 1.4: Skeleton de carga mientras un Remote federa

As a un visitante,
I want ver un skeleton del layout esperado mientras un Remote se descarga,
So that no percibo la carga como una pantalla en blanco o rota.

**Acceptance Criteria:**

**Given** navego a una ruta federada por primera vez
**When** el Remote correspondiente aún se está descargando
**Then** se muestra un skeleton del layout esperado, no un spinner genérico de pantalla completa
**And** el contenedor del skeleton tiene `aria-busy="true"`, liberado al renderizar el contenido real

### Story 1.5: Estado "Remote no disponible" con reintento

As a un visitante,
I want ver un mensaje claro y poder reintentar si un Remote falla al cargar,
So that no interpreto un fallo de red como que todo el sitio está roto.

**Acceptance Criteria:**

**Given** una ruta federada cuyo Remote falla al cargar (404, error de red, parse error)
**When** ocurre el fallo
**Then** el Shell muestra `RemoteUnavailableComponent` acotado al área de esa ruta, con `role="alert"`/`aria-live="polite"`, sin afectar header/nav
**And** un botón "Reintentar" reinvoca la carga solo para esa ruta, nunca un reload completo de página

### Story 1.6: Independencia real de build y serve por Remote

As a Antonio (dev),
I want levantar y buildear cada Remote de forma aislada sin el Shell ni los otros Remotes corriendo,
So that puedo desarrollar y debuggear cada uno por separado.

**Acceptance Criteria:**

**Given** el workspace scaffolded con tags/boundaries
**When** ejecuto `nx serve catalogo` sin Shell ni otros Remotes corriendo
**Then** Catálogo se levanta standalone en su propio puerto, con estado de Carrito/Sesión vacío o local
**And** `nx build <remote>` para cada uno de los tres se completa sin errores de dependencias de otro Remote
**And** `nx affected` identifica correctamente qué Remotes se ven impactados al modificar una lib compartida

### Story 1.7: Tokens de diseño y config única de Tailwind

As a Antonio (dev),
I want una config única de Tailwind en la raíz con los tokens de `DESIGN.md` ya mapeados,
So that el Shell y los 3 Remotes compartan la misma identidad visual desde el día uno.

**Acceptance Criteria:**

**Given** el workspace scaffolded
**When** configuro `tailwind.config` en la raíz con los tokens de color/tipografía/spacing/rounded
**Then** Shell y los 3 Remotes extienden esa config, ninguno la redefine
**And** un cambio de token en la raíz se refleja en los 4 proyectos sin tocar código dentro de `apps/`
**And** un componente de Layout/Container compartido en `libs/shared/ui` aplica los márgenes responsivos (`margin-mobile`/`margin-desktop`) y el `editorial-gap` entre secciones, reutilizado por el Shell y los 3 Remotes (FR-8, cuarto componente base junto a botón/card/header)

## Epic 2: Catálogo navegable con Design System compartido

El usuario ve y filtra productos mock por categoría en Catálogo; los primeros componentes base (Botón, Product Card, Category Chip) viven en `libs/shared/ui` y ya no se reimplementan por Remote.

### Story 2.1: Modelo de Product y dataset mock del catálogo

As a Antonio (dev),
I want definir la interface `Product` en `libs/shared/util-types` y un dataset mock embebido,
So that Catálogo tenga datos reales para listar sin depender de un backend.

**Acceptance Criteria:**

**Given** `libs/shared/util-types` (creada en esta historia)
**When** defino `Product` (`id: string`, `name`, `price: number` decimal, `image`, `category`) y un JSON mock con al menos 8-12 productos en al menos 3 categorías
**Then** Catálogo importa `Product` desde `libs/shared/util-types`, no redefine su propia versión
**And** el dataset vive embebido en el propio Remote (JSON local), sin llamada a backend

### Story 2.2: Listado de productos con Product Card

As a un visitante,
I want ver la lista de productos mock (nombre, precio, imagen, categoría),
So that puedo explorar qué hay disponible en la tienda.

**Acceptance Criteria:**

**Given** el dataset mock de productos (Story 2.1)
**When** navego a `/catalogo`
**Then** veo al menos 8-12 productos, cada uno como Product Card (imagen 4:5, título en `headline-sm`, precio en `body-md` + `accent`)
**And** cada card renderiza como `<button>` nativo con `aria-label="Agregar {producto} al carrito"`, imagen `alt=""` (decorativa) — el click aún no escribe al carrito (eso llega en Epic 3), pero el control ya es accesible por teclado

### Story 2.3: Filtro por categoría con Category Chip

As a un visitante,
I want filtrar los productos por categoría,
So that encuentro más rápido lo que busco.

**Acceptance Criteria:**

**Given** la lista de productos con al menos 3 categorías (Story 2.2)
**When** selecciono una Category Chip
**Then** la lista se reduce a solo esa categoría, sin recargar la página
**And** el chip activo se comunica con `accent` + `aria-pressed` + un indicador de forma, no solo color
**And** "Todos" es el estado por defecto, siempre visible como primer chip, y seleccionar otra categoría reemplaza el filtro (selección única, nunca se suma)

### Story 2.4: Estado "sin resultados" del filtro

As a un visitante,
I want ver un mensaje claro si una categoría no tiene productos,
So that no interpreto una lista vacía como un error.

**Acceptance Criteria:**

**Given** un filtro de categoría aplicado sobre una categoría sin productos
**When** se renderiza el resultado
**Then** veo "Sin productos en esta categoría." + botón secundario "Ver todos"
**And** el botón "Ver todos" limpia el filtro y vuelve al estado "Todos"

### Story 2.5: Botón primario/secundario consolidados en el Design System compartido

As a Antonio (dev),
I want que Botón primario y Botón secundario vivan en `libs/shared/ui`,
So that Carrito y Perfil los reutilicen sin reimplementarlos.

**Acceptance Criteria:**

**Given** Catálogo ya usa Botón secundario (Story 2.4: "Ver todos")
**When** busco definiciones de "botón" en el workspace
**Then** solo existe una implementación de Botón primario y una de Botón secundario, ambas dentro de `libs/shared/ui`
**And** un cambio visual en el botón compartido (ej. color de hover) se refleja en Catálogo sin tocar código dentro de `apps/`

## Epic 3: Carrito cross-remote + Sesión compartida

Agregar un producto en Catálogo se refleja en Carrito sin recargar la página; el usuario gestiona cantidades, completa un checkout simulado, y puede "iniciar sesión" mock con estado consistente en las 3 superficies (header incluido, con su contador de carrito).

### Story 3.1: Servicio de Carrito Compartido con Signals + tipo CartItem

As a Antonio (dev),
I want un servicio singleton de carrito en `libs/shared/cart` con Signals como fuente de verdad,
So that Catálogo y Carrito lean/escriban el mismo estado sin copias locales.

**Acceptance Criteria:**

**Given** `Product` ya existe en `libs/shared/util-types` (Epic 2)
**When** defino `CartItem` y el `CartService` (`providedIn: 'root'`) con `signal()` de items y `computed()` de total
**Then** `libs/shared/cart` y `libs/shared/util-types` quedan declaradas `singleton: true` en los 4 `federation.config.mjs`
**And** el total del carrito es un `computed()` derivado de los items, nunca sincronizado a mano

### Story 3.2: Agregar producto al carrito desde Catálogo (cross-remote)

As a un visitante,
I want agregar un producto al carrito desde Catálogo,
So that pueda comprarlo sin salir de donde estoy explorando.

**Acceptance Criteria:**

**Given** el `CartService` (Story 3.1) y el Product Card ya renderizado (Epic 2)
**When** hago click en una Product Card
**Then** el producto se agrega al Carrito Compartido vía `libs/shared/cart`
**And** el botón muestra la micro-confirmación inline "Agregado ✓" por ~1.5s, sin toast/modal
**And** navegar a `/carrito` muestra ese producto ya en la lista, sin recarga de página

### Story 3.3: Header/Nav completo con Cart Badge

As a un visitante,
I want ver cuántos items tengo en el carrito desde cualquier pantalla,
So that no tenga que entrar a Carrito para saberlo.

**Acceptance Criteria:**

**Given** hay items en el Carrito Compartido (Story 3.2)
**When** agrego un producto desde Catálogo
**Then** el header, persistente en las 3 superficies, muestra el Cart Badge actualizado de inmediato
**And** el Cart Badge solo aparece cuando hay ≥1 item
**And** el header no se recarga (mismo nodo DOM, sin parpadeo) al navegar entre Catálogo/Carrito/Perfil

### Story 3.4: Listado de Carrito con Cart Line Item y gestión de cantidades

As a un visitante,
I want ver mis items del carrito y ajustar sus cantidades,
So that controle qué y cuánto voy a comprar.

**Acceptance Criteria:**

**Given** hay items en el Carrito Compartido
**When** navego a `/carrito`
**Then** veo cada item como Cart Line Item (thumbnail 48×60 `alt=""`, título, stepper, precio)
**And** el stepper +/- actualiza el total optimistamente y lo anuncia vía `aria-live="polite"`
**And** el stepper se detiene en 1; eliminar es una acción explícita con ícono de basura, no llegar a 0 con el stepper

### Story 3.5: Estado de Carrito vacío

As a un visitante,
I want un mensaje claro cuando mi carrito no tiene productos,
So that sepa qué hacer a continuación.

**Acceptance Criteria:**

**Given** el carrito no tiene items (inicial o tras eliminar todos)
**When** navego a `/carrito`
**Then** veo "Tu carrito está vacío." + "Agrega productos desde el Catálogo." + botón secundario que navega a Catálogo

### Story 3.6: Checkout simulado con confirmación

As a un visitante,
I want completar una compra simulada,
So that experimente el flujo completo sin pago real.

**Acceptance Criteria:**

**Given** hay al menos 1 item en el carrito
**When** confirmo el checkout (Checkout Button, único primario visible, `disabled` real si el carrito está vacío)
**Then** veo el estado "Compra confirmada" (ícono + texto en `success`, total pagado) en la misma ruta de Carrito
**And** el carrito queda vacío después de confirmar
**And** no se llama a ningún servicio de pago real

### Story 3.7: Sesión compartida (mock) con Login Form

As a un visitante,
I want "iniciar sesión" con solo mi nombre y verla reflejada en todas partes,
So that no tenga que volver a loguearme al cambiar de sección.

**Acceptance Criteria:**

**Given** `libs/shared/auth` (servicio `providedIn: 'root'`, `signal()`) y `User` en `libs/shared/util-types`
**When** lleno el Login Form (un solo campo de nombre, sin contraseña) y lo envío
**Then** el ícono de sesión del header cambia de inmediato (silueta genérica → nombre/avatar)
**And** navego a Catálogo y Carrito sin volver a iniciar sesión — el header refleja la misma sesión en las 3 superficies
**And** no existe estado de error de validación: el submit siempre inicia sesión (guardado simulado, PRD §4.5)
**And** `libs/shared/auth` queda declarado `singleton: true` en los 4 `federation.config.mjs`

### Story 3.8: Cerrar sesión con estado limpiado en las 3 superficies

As a un visitante con sesión iniciada,
I want cerrar sesión desde Perfil,
So that el estado de sesión se limpie de verdad en todas las superficies, no solo donde hice logout.

**Acceptance Criteria:**

**Given** tengo sesión iniciada (Story 3.7)
**When** hago click en el botón secundario "Cerrar sesión" en Perfil
**Then** no aparece modal de confirmación (acción reversible de bajo riesgo)
**And** Perfil vuelve de inmediato al estado "Sin sesión" (Login Form)
**And** el Session Widget del header revierte a silueta genérica, y navegar a Catálogo/Carrito confirma que ninguno muestra ya el estado autenticado — verificable sin recargar la página

## Epic 4: Perfil de usuario

El usuario ve y edita su perfil mock (nombre/email) y su historial simulado de pedidos, persistido en `localStorage`.

### Story 4.1: Ver y editar perfil (con sesión iniciada)

As a un visitante con sesión iniciada,
I want ver y editar mi nombre/email,
So that mi perfil mock refleje mis datos.

**Acceptance Criteria:**

**Given** tengo sesión iniciada (Epic 3, Story 3.7)
**When** navego a `/perfil`
**Then** veo mis datos (nombre, email) en campos editables, en vez del Login Form
**And** al editar el nombre y guardar, el Session Widget del header refleja el nuevo nombre de inmediato — mismo servicio de `libs/shared/auth` que usa el login, no una copia local
**And** el campo da feedback inline inmediato (ej. borde pasa a `success` por un instante), sin toast

### Story 4.2: Persistencia del perfil editado

As a un visitante,
I want que mi nombre editado se conserve si recargo la página,
So that no pierda mis cambios entre visitas.

**Acceptance Criteria:**

**Given** edité mi nombre (Story 4.1)
**When** recargo la página (F5)
**Then** el nuevo valor del nombre se conserva (persistido en `localStorage`)

### Story 4.3: Historial simulado de pedidos

As a un visitante con sesión,
I want ver mi historial de pedidos simulado,
So that tenga contexto de qué "compré" en la demo.

**Acceptance Criteria:**

**Given** tengo sesión iniciada
**When** navego a `/perfil`
**Then** veo una lista de Order History Row (fecha en `caption`+`ink-muted`, resumen en `body-md`), de solo lectura
**And** no hay botones ni hover interactivo — no es clickeable
**And** la lista es mock estática o generada, sin requerir backend

## Epic 5: Documentación + Demo pública

Cualquiera puede abrir una URL pública y usar la demo completa sin instalar nada; el README explica cómo correrlo en local, con diagrama de arquitectura.

### Story 5.1: Script de build combinado con base-href por Remote

As a Antonio (dev),
I want un script que buildee los 4 proyectos y los combine en un directorio de publish único,
So that pueda desplegar Shell + 3 Remotes desde un solo deploy.

**Acceptance Criteria:**

**Given** los 4 proyectos Nx buildeables independientemente (Epic 1)
**When** ejecuto el script de build de producción
**Then** cada Remote se buildea con `--base-href=/{remote}/` coincidente con su sub-path
**And** los 4 `dist/` se combinan en un directorio `publish/` (Shell en la raíz, Remotes en sus sub-paths)
**And** el bundle inicial del Shell es `<300KB` gzip — si se supera, el build lo señala como blocker

### Story 5.2: Reglas `_redirects` para servir las 4 apps desde un origin

As a Antonio (dev),
I want el archivo `_redirects` de Cloudflare Pages con el orden correcto de reglas,
So that el catch-all del Shell no se trague los assets de los Remotes.

**Acceptance Criteria:**

**Given** el directorio `publish/` armado (Story 5.1)
**When** genero `_redirects`
**Then** las reglas de cada Remote (`/catalogo/*`, `/carrito/*`, `/perfil/*`) aparecen antes que el catch-all del Shell (`/* → /index.html`)
**And** abrir directamente una URL profunda de un Remote sirve su propio `index.html`, no el del Shell

### Story 5.3: Deploy público a Cloudflare Pages

As a un visitante del portafolio,
I want abrir una URL pública y usar la demo completa sin instalar nada,
So that pueda evaluar el proyecto sin fricción.

**Acceptance Criteria:**

**Given** el proyecto conectado a Cloudflare Pages (free tier) con el build de las Stories 5.1–5.2
**When** abro la URL pública en un navegador sin configuración previa
**Then** veo el Shell funcionando con los 3 Remotes navegables
**And** la demo no requiere backend propio — los mocks funcionan client-side
**And** el costo de hosting es $0

### Story 5.4: README con instrucciones y diagrama de arquitectura

As a alguien que no conoce el proyecto,
I want un README claro,
So that pueda levantar el proyecto en local y entender la arquitectura sin ayuda externa.

**Acceptance Criteria:**

**Given** el proyecto completo (Epics 1–4) y desplegado (Story 5.3)
**When** leo el README siguiendo solo sus instrucciones
**Then** puedo clonar el repo y levantar Shell + los 3 Remotes en local
**And** el README incluye al menos un diagrama (ASCII o imagen simple) mostrando Shell, los 3 Remotes y las libs compartidas
**And** el README incluye un link a la demo pública desplegada
