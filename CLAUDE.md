# CLAUDE.md — Web de autor de Gonzalo Lora Veizaga

Este archivo va en la raíz del repositorio. Claude Code lo lee al empezar cada sesión. Lo que no está escrito acá, la próxima sesión no lo sabe.

## Qué es este sitio

La web de autor de Gonzalo R. Lora Veizaga, «Pacha Shunku», ingeniero ambiental en La Paz, Bolivia. Al frente van el libro sobre el Lago Titikaka, los ensayos y el blog. El perfil profesional es una página secundaria.

## Stack

- **Astro** con colecciones de contenido en markdown. Sin CMS, sin base de datos y sin JavaScript del lado del cliente salvo que haga falta.
- Las entradas del blog y los ensayos son archivos .md en src/content/. El autor tiene que poder escribirlos en Obsidian y subirlos sin tocar código.
- Despliegue con GitHub Pages mediante GitHub Actions. Dominio propio configurado con CNAME.
- RSS, sitemap y metadatos Open Graph para que los enlaces se vean bien en Facebook y X.

## Reglas de contenido (no negociables)

1. **No inventar texto biográfico ni cifras.** Si falta un dato, dejar [PENDIENTE: …] visible en el borrador y anotarlo en PENDIENTES.md.
2. **Trayectoria: unos 20 años.** Nunca escribir 30.
3. **Titikaka con k** en la voz del autor. *Titicaca* sólo en citas o nombres oficiales que lo escriban así.
4. **Obra** de Jimena Tatiana Gonzales García (T'ika Pacha) y José Mario Illescas Pompilia (Hatun Illapa): no se publica ningún texto suyo ni se resume su contenido sin orden expresa del autor. Se los nombra siempre con nombre completo y nombre de portada.
5. No publicar teléfonos ni dirección. El contacto se resuelve con un correo o un formulario que el autor decida.
6. Lugares sensibles del mapa (sitios arqueológicos, lugares sagrados y los que el autor indique): las coordenadas exactas nunca entran al repositorio. Con precision: aproximada, el archivo sólo lleva coordenadas redondeadas a dos decimales; con precision: oculta, el archivo no lleva lat ni lon. La ubicación exacta queda en la bóveda privada del autor.

## Convenciones de escritura

- Español. Separador decimal con punto («75.31%»). Separador de miles con espacio y sólo desde cinco cifras («37 152»; «1039»). % pegado al número, sin «el» delante. Años sin «el».
- Citas textuales entre comillas angulares « ».
- Redacción directa y fácil de leer. Evitar la fórmula «no es X, es Y».

## Diseño

Sobrio, editorial, pensado para leer textos largos: tipografía con serifa para el cuerpo, ancho de línea cómodo (unos 65-70 caracteres) y modo oscuro. La paleta e identidad visual del autor es un tema abierto. Usar tokens CSS en un solo archivo (src/styles/tokens.css) para poder cambiarla después sin rehacer nada.

## Manejo de archivos

- No borrar ni sobrescribir contenido escrito por el autor sin preguntar.
- No renombrar archivos de contenido: rompe enlaces.
- Cada cambio de reglas se anota con fecha al final de este archivo.

## Registro de cambios de reglas

- 21-10-2026: versión inicial.
- 21-10-2026: regla 6, lugares sensibles del mapa. Las coordenadas exactas no entran al repositorio; el esquema de `lugares` lo hace cumplir al construir el sitio.
