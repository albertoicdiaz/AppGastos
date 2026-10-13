/**
 * Mis Gastos: lee los avisos de compra con tarjeta de Banco de Chile en tu Gmail.
 *
 * Cómo usarlo (una sola vez, desde el computador):
 *  1. Abre https://script.google.com → Nuevo proyecto, borra lo que trae y pega este archivo.
 *  2. Cambia CAMBIA-ESTA-CLAVE por una clave tuya (cualquier texto largo, sin espacios).
 *  3. Elige la función "probar" y presiona Ejecutar. Acepta los permisos de Gmail
 *     (Google advierte que la app no está verificada porque es tuya: Avanzado → Ir al proyecto).
 *  4. Implementar → Nueva implementación → Aplicación web.
 *     Ejecutar como: Yo. Quién tiene acceso: Cualquier usuario. Copia la URL que termina en /exec.
 *  5. En la app (Gastos → Compras con tarjeta) pega:  <URL>?token=<tu clave>
 *
 * El script solo lee correos de enviodigital@bancochile.cl que digan "compra por" y devuelve su texto;
 * la app los interpreta (parseBankMail) y evita duplicados. No guarda nada ni modifica tu correo.
 */
const TOKEN = 'CAMBIA-ESTA-CLAVE';
const BUSQUEDA = 'from:enviodigital@bancochile.cl "compra por"';

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (TOKEN === 'CAMBIA-ESTA-CLAVE' || p.token !== TOKEN) return json_({ error: 'clave incorrecta' });
  const dias = Math.min(Math.max(parseInt(p.dias, 10) || 30, 1), 365);
  const correos = [];
  GmailApp.search(BUSQUEDA + ' newer_than:' + dias + 'd', 0, 200).forEach(hilo =>
    hilo.getMessages().forEach(m => {
      const texto = m.getPlainBody() || m.getBody().replace(/<[^>]+>/g, ' ');
      correos.push({ id: m.getId(), fecha: m.getDate().toISOString(), texto: texto.slice(0, 3000) });
    }));
  return json_({ correos: correos });
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

// Ejecútala desde el editor para dar permisos y ver qué encuentra (Ver → Registros).
function probar() {
  Logger.log(doGet({ parameter: { token: TOKEN, dias: '30' } }).getContent());
}
