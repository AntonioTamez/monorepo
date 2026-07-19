---
title: Monorepo de Microfrontends con Angular y Nx — Identidad Visual
status: final
created: 2026-07-17
updated: 2026-07-18
sources:
  - ../../prds/prd-monorepo-2026-07-17/prd.md
  - ../../prds/prd-monorepo-2026-07-17/addendum.md
name: Llano
description: Sistema visual editorial-minimalista para una tienda demo (Catálogo, Carrito/Checkout, Perfil) construida como ejercicio de aprendizaje de microfrontends Angular + Nx.
colors:
  background: '#FFFFFF'
  surface: '#FFFFFF'
  surface-alt: '#F7F7F6'
  surface-container: '#EFEFED'
  border: '#E0E0DD'
  border-strong: '#8A8A85'
  ink: '#141414'
  ink-muted: '#5C5C58'
  ink-faint: '#9A9A95'
  accent: '#B8432B'
  accent-hover: '#96351F'
  accent-foreground: '#FFFFFF'
  success: '#3F6B4E'
  success-foreground: '#FFFFFF'
  error: '#B3261E'
  error-foreground: '#FFFFFF'
typography:
  display-lg:
    fontFamily: Fraunces
    fontSize: 56px
    fontWeight: '400'
    lineHeight: '1.05'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Fraunces
    fontSize: 36px
    fontWeight: '400'
    lineHeight: '1.1'
  headline-md:
    fontFamily: Fraunces
    fontSize: 32px
    fontWeight: '400'
    lineHeight: '1.15'
  headline-sm:
    fontFamily: Fraunces
    fontSize: 22px
    fontWeight: '400'
    lineHeight: '1.25'
  body-lg:
    fontFamily: Inter
    fontSize: 17px
    fontWeight: '400'
    lineHeight: '1.55'
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: '1.5'
  label:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: '1.3'
    letterSpacing: 0.04em
  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1.4'
rounded:
  sm: 2px
  DEFAULT: 4px
  md: 6px
  lg: 8px
  full: 9999px
spacing:
  unit: 4px
  '1': 4px
  '2': 8px
  '3': 12px
  '4': 16px
  '6': 24px
  '8': 32px
  '12': 48px
  '16': 64px
  gutter: 24px
  margin-mobile: 20px
  margin-desktop: 80px
  editorial-gap: 96px
components:
  button-primary:
    background: '{colors.accent}'
    foreground: '{colors.accent-foreground}'
    radius: '{rounded.sm}'
  button-secondary:
    background: 'transparent'
    foreground: '{colors.ink}'
    border: '{colors.border-strong}'
    radius: '{rounded.sm}'
  product-card:
    background: '{colors.surface}'
    border: '{colors.border}'
    radius: '{rounded.DEFAULT}'
    title: '{typography.headline-sm}'
    price: '{typography.body-md}'
  cart-badge:
    background: '{colors.accent}'
    foreground: '{colors.accent-foreground}'
    radius: '{rounded.full}'
    typography: '{typography.caption}'
---

## Brand & Style

**Llano** es minimalismo editorial aplicado a una tienda demo: la disciplina visual de una revista de diseño, no de un e-commerce genérico. `[ASSUMPTION: "Llano" es un nombre de marca placeholder para la tienda demo — no fue pedido explícitamente; cámbialo libremente, no afecta ningún FR del PRD]`. Blanco y negro hacen el trabajo pesado; un único acento terracota (`{colors.accent}`) marca lo accionable — precios, botones primarios, el contador del carrito — y nada más. Cero azul corporativo, cero gradientes, cero iconografía decorativa. La densidad de información es baja a propósito: mucho aire, tipografía con carácter, imágenes de producto que respiran.

El contraste editorial clásico —serif con personalidad en titulares, sans neutra en cuerpo— es el único "efecto especial" que este sistema se permite. Todo lo demás es disciplina y espacio en blanco.

## Colors

- **`{colors.background}` / `{colors.surface}` (blanco puro)** — el lienzo. Sin textura, sin tinte cálido: blanco de galería, no blanco hueso.
- **`{colors.surface-alt}` / `{colors.surface-container}` (grises casi imperceptibles)** — para separar secciones (ej. el fondo del header, contenedores de formulario) sin recurrir a bordes duros en todas partes.
- **`{colors.border}` / `{colors.border-strong}`** — líneas finas (hairlines) para separar, nunca sombras pesadas. `border-strong` solo en elementos interactivos (inputs, botones secundarios).
- **`{colors.ink}` (casi negro, no negro puro)** — texto principal. `{colors.ink-muted}` para texto secundario (metadatos, descripciones). `{colors.ink-faint}` para placeholders y estados deshabilitados.
- **`{colors.accent}` (terracota)** — el único color con temperatura en todo el sistema. Reservado exclusivamente para: botones primarios (agregar al carrito, checkout), precios, el contador del carrito en el header, y estados de "seleccionado" (categoría activa en el filtro). Nunca decorativo, nunca para chrome de navegación. Contraste verificado y comprometido: ~5.4:1 sobre `{colors.background}` (pasa AA para texto normal).
- **`{colors.success}`** — deliberadamente desaturado para no romper la disciplina monocromática (~6.1:1 sobre `{colors.background}`). Uso estrictamente funcional: confirmación de checkout. Nunca como acento visual.
- **`{colors.error}`** — deliberadamente desaturado (~6.5:1 sobre `{colors.background}`). Uso estrictamente funcional y único: el ícono de eliminar en Cart Line Item (`:hover`). Este sistema no tiene estados de error de formulario — Login y guardado de Perfil son simulados y siempre se completan con éxito (ver `EXPERIENCE.md` State Patterns) — por lo que `error` nunca se usa como color de validación.

## Typography

- **Fraunces** (serif editorial, óptica variable) es la voz de marca: nombre de la tienda en el header, títulos de sección (`{typography.display-lg}`, `{typography.headline-md}`), y el nombre de cada producto en su card (`{typography.headline-sm}`). Peso 400 siempre — nada de negritas en la serif, el carácter viene de la forma de la letra, no del peso.
- **Inter** (sans neutra, alta legibilidad) es la voz funcional: cuerpo de texto, botones, inputs, navegación, precios, metadatos. `{typography.label}` (mayúsculas, tracking abierto) se usa exclusivamente para etiquetas de formulario y nombres de categoría — nunca para texto corrido.
- Los títulos grandes (`display-lg`) usan leading apretado (1.05) y letter-spacing negativo para leerse como un bloque tipográfico compacto, tipo portada de revista.

## Layout & Spacing

Grid de una sola columna en móvil, hasta 3-4 columnas en el grid de Catálogo en desktop. El espaciado es generoso a propósito: `{spacing.editorial-gap}` (96px) entre secciones mayores (ej. entre el hero del Catálogo y el grid de productos), nunca menos de `{spacing.margin-mobile}` (20px) de margen lateral en móvil y `{spacing.margin-desktop}` (80px) en desktop.

El objetivo es que cada pantalla se sienta como una página de revista, no como una grilla de e-commerce apretada — menos productos visibles por scroll, más aire alrededor de cada uno.

El grid del Catálogo usa `{spacing.gutter}` (24px) entre columnas. El padding interno de componentes (botones, cards, chips, filas de Cart Line Item) sigue la escala `{spacing.2}`–`{spacing.4}` (8–16px); no se usan valores arbitrarios fuera de esta escala, salvo dimensiones de imagen (que son proporción/tamaño de asset, no espaciado — ej. el thumbnail 48×60px de Cart Line Item).

## Elevation & Depth

Sin sombras por defecto. La separación se comunica con `{colors.border}` (líneas finas de 1px), no con elevación. La única excepción: un `product-card` gana una sombra muy sutil y de bajo contraste (`0 4px 12px rgba(20,20,20,0.06)`) solo en `:hover`, para sugerir que es interactivo sin romper la planitud general del sistema.

## Shapes

Esquinas casi rectas (`{rounded.sm}`–`{rounded.DEFAULT}`, 2–4px) en casi todo — botones, cards, inputs. `[ASSUMPTION: la elección de "casi recto" en vez de redondeado interpreta "editorial moderno" como estética impresa/de galería — ajústalo si te imaginabas algo más suave]`. `{rounded.full}` se reserva para dos excepciones deliberadas: el badge circular del contador del carrito y el ícono del Session Widget — ambos son indicadores de estado/notificación, no contenido, por eso rompen la regla de esquinas rectas. Ningún otro elemento del sistema usa esta forma.

## Components

- **Botón primario** — Fondo `{colors.accent}`, texto `{colors.accent-foreground}`, esquina `{rounded.sm}`, padding horizontal generoso. Fondo `{colors.accent-hover}` en `:hover`/`:active` (sin cambio de tamaño ni sombra — el sistema no eleva botones). Estado `disabled`: fondo `{colors.ink-faint}`, texto `{colors.accent-foreground}`, sin hover. Usado para "Agregar al carrito" y "Confirmar compra" — este último es el "Checkout Button" de `EXPERIENCE.md` (misma especificación visual, no un componente aparte). Nunca hay más de un botón primario visible a la vez en una misma vista.
- **Botón secundario** — Fondo transparente, borde `{colors.border-strong}`, texto `{colors.ink}`. Usado para acciones secundarias (ej. "Editar perfil", "Cancelar", "Cerrar sesión").
- **Product Card** — Imagen de producto (ratio 4:5, esquina `{rounded.DEFAULT}`), título en `{typography.headline-sm}`, precio en `{typography.body-md}` + `{colors.accent}`. Sin borde visible en reposo; sombra sutil + el título sube 2px en hover. El área completa es un único control tipo botón (no un `<div>` con click handler), con nombre accesible propio: `aria-label="Agregar {producto} al carrito"`. La imagen dentro es decorativa (`alt=""`) porque el nombre del producto ya vive en el aria-label del botón — evita que un lector de pantalla lo anuncie dos veces.
- **Cart Badge** — Círculo pequeño `{rounded.full}`, fondo `{colors.accent}`, número en `{typography.caption}` blanco. Vive anclado al ícono de carrito en el header; aparece solo cuando hay ≥1 item.
- **Login Form** (y todo Input del sistema) — Estilo de línea (underline), sin caja. Borde inferior `{colors.border-strong}` que pasa a `{colors.accent}` en focus. Label en `{typography.label}` sobre el campo, siempre visible (no placeholder-as-label). El Login Form es un único Input de este tipo + un Botón primario ("Entrar"), sin adorno adicional.
- **Header/Nav** — Barra superior fija, fondo `{colors.surface}`, borde inferior `{colors.border}` de 1px. Nombre de marca en Fraunces a la izquierda, navegación + ícono de carrito a la derecha, en `{typography.body-md}`.
- **Category Chip** — Borde `{colors.border-strong}`, texto `{typography.label}`, esquina `{rounded.sm}`. Estado activo: fondo `{colors.accent}`, texto `{colors.accent-foreground}`.
- **Cart Line Item** — Fila con imagen pequeña (48×60px, esquina `{rounded.sm}` — dimensión de imagen, no de espaciado, por eso es px fija fuera de la escala numérica), título en `{typography.body-md}`, stepper de cantidad, precio en `{typography.body-md}` + `{colors.accent}`. Ícono de eliminar en `{colors.ink-muted}` en reposo; en `:hover` gana un fondo circular `{colors.error}` con el glifo en `{colors.error-foreground}` (feedback claro de "esto elimina", no solo un cambio de color de línea). Separado del siguiente item con `{colors.border}` (1px).
- **Session Widget** — Ícono circular (`{rounded.full}`, único uso fuera del Cart Badge) en el header: inicial del nombre sobre `{colors.surface-container}` con sesión activa, silueta genérica sobre `{colors.surface-container}` sin sesión. Nunca usa `{colors.accent}` — no es una acción, es un indicador de estado.
- **Order History Row** — Fila de solo lectura: fecha en `{typography.caption}` + `{colors.ink-muted}`, resumen del pedido en `{typography.body-md}`. Sin botones, sin hover interactivo (no es clickeable).

## Do's and Don'ts

| Do | Don't |
|---|---|
| Usar `{colors.accent}` solo para acción/precio/notificación | Usar el acento para chrome, fondos decorativos o más de un elemento por vista |
| Fraunces solo en títulos y nombre de marca, peso 400 | Poner texto corrido o UI funcional en Fraunces |
| Separar con `{colors.border}` (líneas finas) | Usar sombras como recurso principal de jerarquía |
| Dejar aire generoso (`{spacing.editorial-gap}` entre secciones) | Apretar el grid de Catálogo para mostrar más productos por scroll |
| Esquinas casi rectas en todo el sistema | Introducir `rounded.lg`/`rounded.full` fuera del Cart Badge y el Session Widget |
| Un solo botón primario visible por vista | Competir con dos CTAs primarios en la misma pantalla |
