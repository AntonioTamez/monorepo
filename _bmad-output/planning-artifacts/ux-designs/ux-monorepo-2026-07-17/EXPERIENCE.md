---
title: Monorepo de Microfrontends con Angular y Nx — Experiencia
name: Llano
status: final
created: 2026-07-17
updated: 2026-07-18
sources:
  - ../../prds/prd-monorepo-2026-07-17/prd.md
  - ../../prds/prd-monorepo-2026-07-17/addendum.md
---

# Llano — Experience Spine

> Web responsive de una sola experiencia continua, compuesta en runtime a partir de un Shell + 3 microfrontends federados (Native Federation, MVP1 estático). La federación es invisible para quien usa el producto — de cara al usuario esto es una sola tienda, no tres apps. Ver `prd.md` §3 Glosario para los términos de arquitectura (Shell, Remote, Federación) que este documento asume.

## Foundation

Web responsive (desktop → móvil), sin app nativa (PRD §5 Non-Goals). Tailwind CSS + componentes Angular propios en `libs/shared/ui` — sin librería de componentes heredada (no Material, no PrimeNG); `DESIGN.md` es la referencia de identidad visual y define el token set completo desde cero. `[ASSUMPTION: la interfaz de usuario final (copys, labels, mensajes) está en español, consistente con la terminología de dominio ya usada en el PRD (Catálogo, Carrito, Perfil)]`.

Sin cuentas reales ni multi-tenancy: la "sesión" es un mock compartido (PRD FR-7, `libs/shared/auth`) que vive en memoria/`localStorage`, visible de la misma forma para cualquiera que abra la demo pública.

## Information Architecture

| Surface | Alcanzado desde | Propósito | Remote (PRD) |
|---|---|---|---|
| Catálogo | Raíz `/` del Shell, o link "Catálogo" en el header | Explorar productos mock, filtrar por categoría, agregar al carrito | Catálogo |
| Carrito | Ícono de carrito en el header (persistente, con `{components.cart-badge}`) | Ver/editar items, ver total, completar checkout simulado | Carrito/Checkout |
| Perfil | Ícono de sesión/avatar en el header | Iniciar sesión mock (si no hay sesión) · ver/editar datos + historial simulado (si hay sesión) | Perfil |

No existe una superficie de "detalle de producto": agregar al carrito ocurre directamente desde la card en el grid del Catálogo (PRD FR-3/FR-4 no piden una vista de detalle). La confirmación de checkout es un **estado**, no una superficie nueva — ver Carrito, State Patterns.

→ Referencia de composición: `mockups/key-catalogo.html`, `mockups/key-carrito.html`, `mockups/key-perfil.html`. El spine gana sobre cualquier mock en conflicto.

## Voice and Tone

Microcopy. La voz de marca vive en `DESIGN.md.Brand & Style`. Editorial y directa — frases cortas, sin signos de exclamación, sin lenguaje de urgencia/venta.

| Do | Don't |
|---|---|
| "3 productos en tu carrito" | "¡Tienes 3 productos geniales en tu carrito! 🛒" |
| "Sin productos en esta categoría" | "¡Ups! No encontramos nada 😢" |
| "Compra confirmada" | "¡Gracias por tu compra! Pedido #1234 confirmado exitosamente ✓" |
| "Inicia sesión para ver tu perfil" | "¡Únete a Llano hoy mismo!" |
| Precio siempre en `{typography.body-md}` + `{colors.accent}`, sin tachones ni "¡OFERTA!" | Badges de descuento, contadores de urgencia ("¡Solo quedan 2!") |

## Component Patterns

Comportamiento. Las especificaciones visuales viven en `DESIGN.md.Components`.

| Componente | Uso | Reglas de comportamiento |
|---|---|---|
| Product Card | Catálogo | Renderiza como (o contiene) un `<button>` nativo con `aria-label="Agregar {producto} al carrito"` como nombre accesible del control completo — no un `<div>` con click handler (no hay vista de detalle intermedia). La imagen dentro del botón usa `alt=""` (decorativa, el nombre ya está en el aria-label). Al agregar: micro-confirmación inline (ej. el botón cambia a "Agregado ✓" por ~1.5s, sin toast/modal), escribe al Carrito Compartido (`libs/shared/cart`, PRD §3/§4.2) y el `{components.cart-badge}` del header incrementa de inmediato. |
| Category Chip | Catálogo (filtro) | Selección única (no multi-select) — elegir una categoría reemplaza el filtro activo, no lo suma. "Todos" es el estado por defecto y siempre visible como primer chip. |
| Cart Line Item | Carrito | Lee/escribe el mismo Carrito Compartido (`libs/shared/cart`) que Catálogo — nunca su propia copia local. Stepper de cantidad (−/+) con actualización optimista del total; el nuevo valor de cantidad y el nuevo total se anuncian vía `aria-live="polite"` (sin mover el foco), no solo visualmente. Eliminar es una acción explícita (ícono de basura), no llegar a cantidad 0 con el stepper — el stepper se detiene en 1. La imagen del thumbnail (48×60px) usa `alt=""`: es decorativa porque el título del producto, ya visible como texto adyacente, cubre el mismo nombre accesible. |
| Checkout Button | Carrito | Es la instancia de Botón primario (`DESIGN.md` Components) para esta superficie — no un componente visual aparte. Único botón primario visible en la superficie. Deshabilitado si el carrito está vacío: atributo `disabled` real (no solo la clase visual `{colors.ink-faint}`) — no queda focuseable ni clickeable, no oculto. |
| Session Widget | Header, Perfil | En el header es solo un ícono/avatar; el estado (sesión iniciada o no) se refleja igual en las 3 superficies vía `libs/shared/auth` — nunca hay que "reiniciar sesión" al cambiar de Catálogo a Carrito a Perfil. |
| Login Form | Perfil (estado sin sesión) | Un solo campo de nombre — no hay contraseña real ni validación de credenciales (PRD §4.5: sesión enteramente simulada). Enviar el form inicia sesión inmediatamente. |
| Order History Row | Perfil (estado con sesión) | Lista de solo lectura — sin acción de "repetir pedido" ni "cancelar" (PRD no lo pide; fuera de alcance). |
| Header/Nav | Las 3 superficies (persistente) | Fijo en la parte superior en todo momento, incluso al hacer scroll. Aloja `{components.cart-badge}` y el Session Widget; ambos reflejan su estado sin necesidad de refrescar la página. En `< md` colapsa a solo íconos (ver Responsive & Platform) — la marca y los íconos de carrito/sesión nunca desaparecen, lo que sí se oculta son los labels de texto de navegación. |

## State Patterns

| Estado | Superficie | Tratamiento |
|---|---|---|
| Carga inicial (federación en curso) | Cualquiera, primera visita a esa ruta | Skeleton del layout esperado (grid de cards en Catálogo, lista en Carrito) mientras el Remote correspondiente se descarga vía Native Federation. Sin spinner genérico de pantalla completa. |
| Remote no disponible | Cualquiera | `[ASSUMPTION: comportamiento no estaba definido en el PRD — la revisión adversarial lo señaló como hueco]`. Si un Remote falla al cargar (404, error de red, parse error), el Shell muestra un estado de error acotado **solo en el área de ese Remote** (no rompe el header ni la navegación): headline-sm "No se pudo cargar {sección}" + botón secundario "Reintentar". El resto del Shell (header, navegación) sigue funcional. |
| Filtro sin resultados | Catálogo | "Sin productos en esta categoría." + botón secundario "Ver todos". |
| Carrito vacío | Carrito | `{typography.display-lg-mobile}`/`{typography.headline-md}`: "Tu carrito está vacío." Body en `{typography.body-lg}` (estado vacío, texto más generoso que el body-md por defecto): "Agrega productos desde el Catálogo." Botón secundario que navega a Catálogo. |
| Checkout confirmado | Carrito (mismo route, estado post-acción) | Reemplaza la lista de items: ícono con fondo `{colors.success}` y glifo `{colors.success-foreground}` + `{typography.headline-sm}` "Compra confirmada" en `{colors.success}`, body en `{typography.body-lg}` con el total que se pagó. El carrito queda vacío; botón secundario "Volver al Catálogo". No hay número de orden real (no hay backend). |
| Sin sesión | Perfil | Muestra el Login Form. Sin mensaje de error ni fricción — es el estado de entrada normal, no un bloqueo. |
| Con sesión | Perfil | Datos editables + historial simulado. Guardar un campo (nombre/email) da feedback inline inmediato (ej. borde pasa a `{colors.success}` por un instante), sin toast. Debajo de los datos, un botón secundario "Cerrar sesión" — sin modal de confirmación (acción reversible de bajo riesgo, ver Interaction Primitives). Al hacer click, limpia el estado de `libs/shared/auth` de inmediato: Perfil vuelve al estado "Sin sesión" (Login Form) y el Session Widget del header revierte a silueta genérica en las 3 superficies, sin necesidad de recargar ninguna. |

*Fuera de alcance: no existe un estado de "guardado fallido" en Login/Perfil — ambos son simulados (PRD §4.5) y siempre se completan con éxito. `{colors.error}` no se reserva para validación de formulario (ver `DESIGN.md` Colors); su único uso real es el ícono de eliminar en Cart Line Item.*

## Interaction Primitives

- **Click-first.** Sin atajos de teclado dedicados (no es un power-tool) — pero todo elemento interactivo es alcanzable y operable por teclado (ver Accessibility Floor).
- **Agregar al carrito** es una sola acción sin confirmación intermedia (sin modal "¿estás seguro?") — el mock cart es de bajo riesgo, no requiere fricción.
- **Cantidad en el carrito**: stepper +/−, sin input numérico libre — mantiene el mismo patrón simple en toda la superficie.
- **Navegación entre Catálogo/Carrito/Perfil**: siempre vía el header persistente, nunca hay "volver" contextual que rompa la navegación estándar del Shell.
- **Prohibido en todo el sistema**: modales de confirmación para acciones reversibles de bajo riesgo, badges de urgencia/escasez, auto-play de cualquier tipo, infinite scroll en el Catálogo (paginación o "cargar más" explícito si el dataset creciera).

## Accessibility Floor

Comportamiento. El contraste visual vive en `DESIGN.md` (ratios de `{colors.accent}` y `{colors.ink}` sobre `{colors.background}` ya verificados y comprometidos ahí, ver Colors).

- WCAG 2.2 AA como piso, en las tres superficies.
- El nombre y la categoría de cada producto deben ser perceptibles por un lector de pantalla en toda superficie donde aparezcan: en Catálogo, vía el `aria-label` del botón de Product Card (ver Component Patterns) — la imagen ahí es decorativa (`alt=""`) porque el nombre ya vive en el botón. En Cart Line Item, el thumbnail también usa `alt=""` porque el título adyacente cubre el mismo nombre (ver Component Patterns). En cualquier otro lugar donde una imagen de producto NO esté envuelta en un control o acompañada de un título con el mismo nombre, lleva `alt` descriptivo (nombre + categoría) en su lugar.
- Los Category Chips y el estado "seleccionado" del filtro se comunican con algo más que color (ej. `aria-pressed` + un indicador de forma), no solo con `{colors.accent}`.
- Labels de formulario (Login, Perfil) siempre visibles como texto real, nunca solo placeholder — ya especificado como regla de `DESIGN.md.Components.Inputs`. Ningún placeholder transmite información que no esté también en el label visible (ej. formato requerido) — el placeholder es siempre un hint suplementario, nunca la única fuente de una instrucción.
- Foco visible (outline con `{colors.accent}`) en todo elemento interactivo; orden de tab sigue el orden de lectura en cada Remote.
- El estado "Remote no disponible" se anuncia a lectores de pantalla (`role="alert"` o `aria-live="polite"` en el contenedor de error), no es solo un cambio visual silencioso. El estado de carga (skeleton) usa `aria-busy="true"` en su contenedor mientras el Remote se descarga, liberado al renderizar el contenido real.
- Estructura semántica: un `<h1>` por superficie (Catálogo, Carrito, Perfil), cada Remote se compone dentro de su propio `<main>`, `<nav>` para el Header. Los títulos de Product Card (`{typography.headline-sm}`) son `<h3>` (o nivel equivalente) subordinados al `<h1>`/heading de sección del Catálogo — nunca un heading "suelto" sin jerarquía por encima.
- Transiciones y micro-animaciones (hover-lift de Product Card, swap a "Agregado ✓", flash de borde en `{colors.success}`) respetan `prefers-reduced-motion: reduce` — el cambio de estado se mantiene, la transición animada se retira.

## Responsive & Platform

| Breakpoint | Comportamiento |
|---|---|
| `≥ lg` (1024px+) | Catálogo en grid de 3-4 columnas. Header con navegación completa en línea. |
| `md` (768–1023px) | Catálogo en grid de 2 columnas. Header sin cambios. |
| `< md` (`sm`, <768px) | Catálogo en 1 columna. Header colapsa a: marca + ícono de carrito + ícono de sesión (sin labels de texto en la navegación). |

Sin comportamiento específico de plataforma nativa (no hay app — PRD §5). El breakpoint `margin-mobile`/`margin-desktop` de `DESIGN.md.Layout & Spacing` aplica en todas las superficies por igual.

## Inspiration & Anti-patterns

- **Inspiración:** boutiques editoriales tipo revista de diseño (más Aesop/Kinfolk que Amazon/Shopify default) — pocas piezas, mucho aire, fotografía de producto como protagonista.
- **Rechazado — banners promocionales y countdown timers:** rompen la disciplina "un solo acento, uso funcional" de `DESIGN.md` y no aportan nada a un proyecto de aprendizaje sin ventas reales.
- **Rechazado — mega-menús o navegación con más de 3 items:** la IA de este producto es deliberadamente chica (3 superficies); un header complejo sería teatro, no necesidad real.
- **Rechazado — gamificación de checkout (confetti, animaciones de celebración):** el checkout es simulado; celebrar una transacción falsa rompe el tono editorial y honesto del resto del sistema.

## Key Flows

### UJ-1 — Antonio verifica la federación (dev, primera corrida local)

*Mismo protagonista y premisa que UJ-1 en `prd.md` §2.3; expandido aquí a nivel de interacción.*

1. Antonio levanta el Shell y navega a `/` — ve el Catálogo cargar con un skeleton breve mientras Native Federation descarga el Remote.
2. Filtra por una categoría con un Category Chip; el grid se actualiza sin recargar la página.
3. Agrega un producto: el botón de la card pasa a "Agregado ✓" y el `cart-badge` del header pasa de 0 a 1 al instante.
4. Navega a Carrito (header) — ve el mismo producto ya ahí, sin ningún parpadeo de carga notable (Carrito ya estaba precargado como Remote).
5. **Climax:** abre DevTools → Network, y confirma que Catálogo y Carrito aparecieron como bundles de red separados, y que Angular/RxJS solo se cargaron una vez como Singleton (PRD §3) — la arquitectura que el PRD promete es visible, no solo teórica.

Falla esperada: si un Remote no aparece como bundle separado (ej. federación mal configurada), Antonio ve el estado "Remote no disponible" en el área de esa sección (ver State Patterns) en vez de un bundle — señal clara de que la federación falló, no un silencio ambiguo.

### UJ-2 — Diana, recruiter, recorre la demo

*Mismo protagonista y premisa que UJ-2 en `prd.md` §2.3 (ahí sin nombre); expandido aquí a nivel de interacción.*

1. Diana abre la URL pública desde su laptop. El Catálogo carga con el grid de productos ya visible en pocos segundos.
2. Agrega dos productos distintos al carrito, viendo el badge del header subir de 0 a 2.
3. Va a Carrito, ajusta la cantidad de un item con el stepper, ve el total recalcularse.
4. Completa el checkout simulado — ve la pantalla de confirmación con `{colors.success}`, sin fricción ni pasos de pago real.
5. **Climax:** navega a Perfil por curiosidad, ve el Login Form (nunca inició sesión), y entiende sin leer nada que esto es una demo funcional, no un sitio roto — el estado "sin sesión" se explica solo. Luego abre el README del repo para leer sobre la arquitectura detrás.

Falla esperada: si el Remote de Carrito no carga cuando Diana hace clic en el ícono de carrito, ve el estado "Remote no disponible" acotado a esa sección (ver State Patterns), con el botón "Reintentar" — el resto del Shell (header, navegación) sigue funcionando, y Diana no interpreta esto como que todo el sitio está roto.

### Flow 3 — Antonio verifica sesión cross-remote (dev, validando FR-7)

*Flujo adicional no numerado como UJ en el PRD (§2.3 solo definió UJ-1/UJ-2) — necesario para cerrar la superficie de Perfil/sesión con un journey propio.*

1. Antonio, con el Shell corriendo, va a Perfil (sin sesión) y llena el Login Form con un nombre de prueba.
2. Envía el form — el ícono de sesión en el header cambia de inmediato (de "sin sesión" a mostrar el nombre/avatar).
3. Navega a Catálogo, luego a Carrito, sin volver a "iniciar sesión" en ninguna — el header refleja la misma sesión en las tres.
4. **Climax:** vuelve a Perfil y ve sus datos ya ahí, sin re-loguearse — confirma en carne propia que `libs/shared/auth` (PRD FR-7) realmente comparte estado entre Remotes federados, no solo dentro de uno.

Falla esperada: si Antonio corre Perfil en modo standalone (`nx serve perfil`, sin Shell), el login mock funciona pero **no** se refleja en Catálogo/Carrito — comportamiento esperado, no bug (PRD §4.7/FR-9: la independencia de build/serve no garantiza estado compartido fuera del contexto federado).
