# AppGastos: contexto para continuar el proyecto

## Objetivo
Una PWA para iPhone (se instala desde Safari con "Añadir a pantalla de inicio") que sirve para:
1. Controlar mis finanzas personales por categorías, incluyendo pagos hechos con Apple Wallet.
2. Dividir una cuenta cuando pago yo y comen otras personas conmigo, y enviarle a cada una el detalle de lo que me debe.

Idioma: español de Chile. Moneda: CLP, sin decimales. Teléfonos: si no traen código de país se asume +56.

## Archivos (todos en la misma carpeta, servidos por HTTPS)
- `index.html`: toda la app (HTML, CSS y JS en un solo archivo, sin librerías ni servidor).
- `manifest.json`: nombre "Mis Gastos", `display: standalone`, color #0f766e, íconos 192 y 512.
- `sw.js`: service worker con caché (`gastos-v2`). Si se cambia algún archivo, subir el número de versión para que el iPhone actualice.
- `icon-180.png`, `icon-192.png`, `icon-512.png`: íconos (recibo blanco sobre fondo verde).
- `gastos-pwa.zip`: todo lo anterior empaquetado.

## Cómo se publica
Subir los archivos juntos a un hosting con HTTPS (GitHub Pages, Netlify o Vercel). En el iPhone: abrir la URL en Safari, Compartir, Añadir a pantalla de inicio.

## Estructura de la app (3 pestañas)
### 1. Gastos
- Resumen del mes con total y barras por categoría (con %). Se puede cambiar de mes con ‹ ›.
- Formulario: monto, categoría (chips con emoji), fecha, nota.
- Lista de movimientos del mes; cada uno tiene un selector para corregir la categoría y un botón para eliminar.
- Categorías: Comida 🍽️, Supermercado 🛒, Transporte 🚗, Hogar 🏠, Ocio 🎬, Salud 💊, Cuentas 💡, Suscripciones 📱, Compras 🛍️, Otros 📦.
- Importar movimientos de Apple Wallet: ver más abajo.

### 2. Dividir (módulo aparte)
- Datos de la cuenta: concepto, total sin propina, propina % (por defecto 10, con atajos 0/10/15).
- Modos: partes iguales (redondea hacia arriba) o por consumo (cada persona con su monto; la propina se aplica proporcional).
- Personas: se eligen tocando chips de los contactos guardados, o se agrega una persona nueva (nombre y teléfono) que además se guarda en Contactos. La primera persona siempre soy yo (nombre editable).
- Resultado por persona, con botones: WhatsApp (abre `wa.me/<número>?text=...`), Mensaje (`sms:+número&body=...`) y marcar "pagó".
- El mensaje incluye: concepto, total, propina, la parte de esa persona, el detalle de todos y mis datos de transferencia (campo de texto guardado).
- Extras: "Compartir resumen general" (Web Share o copiar), "Guardar mi parte en Mis gastos", "Nueva cuenta" (mantiene a las personas seleccionadas).

### 3. Contactos
- Lista de nombre y teléfono guardados localmente, con agregar, editar y eliminar.
- iOS no permite que una web lea la agenda, así que los números se escriben a mano.

## Importación desde Apple Wallet (diseño y razón)
Una página web no puede leer Wallet ni el correo por sí sola. Solución sin servidor:
1. En Atajos: Automatización, Transacción (Wallet), ejecutar inmediatamente.
2. Acción "Añadir al archivo" en iCloud Drive, `gastos.txt`, con el texto `fecha;importe;comerciante` (fecha como `yyyy-MM-dd`).
3. En la app: Importar, elegir `gastos.txt` (o pegar las líneas).
- Formatos de línea aceptados: `2026-10-09;12500;Starbucks` o `12500;Starbucks`. Separadores `;`, `|` o tab. Fechas `yyyy-mm-dd` o `dd/mm/yyyy`. Montos `12.500`, `12.500,00` o `12500.50`.
- Cada movimiento se categoriza por palabras clave del comercio (lista `RULES`) y se evita duplicar usando la clave `fecha|monto|comercio`.
- No es en tiempo real y la app todavía no lee el correo.

## Modelo de datos (localStorage, solo en el dispositivo)
- `expenses`: `[{id, amount, cat, note, date 'YYYY-MM-DD', key?, src?}]`
- `contacts`: `[{id, name, phone (solo dígitos con código de país)}]`
- `split`: `{concept, mode 'equal'|'consumo', total, tip, sel [ids de contactos], amounts {id: monto}, paid {id: bool}, meName}`
- `banco`: texto con los datos de transferencia.
Limitación importante: en iOS, Safari y la app instalada en la pantalla de inicio tienen almacenamiento separado, y si se desinstala la app se pierden los datos. No hay respaldo ni sincronización.

## Código: funciones puras (bloque `PURE-START`/`PURE-END` en el script)
`autoCat`, `parseAmount`, `normDate`, `normPhone`, `calcSplit`, `parseLines`. Están probadas con pruebas automáticas en Node (montos chilenos, teléfonos, fechas, categorías, división igual y por consumo, importación de líneas).
Bug corregido: con 85.000 + 10% entre 5 personas daba $18.701 por error de coma flotante; ahora da $18.700 (se calcula el total en enteros antes de dividir y se redondea hacia arriba).

## Decisiones y límites conocidos
- Sin servidor ni cuentas: todo local. Es simple y privado, pero no hay respaldo.
- Gmail: una página no puede leer el correo sin un backend. Existe un conector de Gmail para Claude (no está conectado todavía), con el que Claude podría leer avisos del banco en una conversación. No se ha leído ningún correo.
- Los chats de claude.ai no se pueden mover a un proyecto si la cuenta no tiene proyectos creados; por eso este contexto se entrega como documento.

## Ideas pendientes (no hechas)
- Exportar e importar respaldo en JSON (para no perder datos y para pasar de Safari a la app instalada).
- Presupuesto mensual por categoría con alertas.
- Sincronización con un backend (por ejemplo Google Sheets mediante Apps Script) para tener los gastos de Wallet en tiempo real.
- Leer avisos del banco desde Gmail.
- Gráficos mensuales y comparación entre meses.
- Historial de cuentas divididas y saldo pendiente por persona.
- Edición de un gasto (hoy solo se cambia la categoría o se elimina).
