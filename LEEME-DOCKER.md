# Mis Gastos en Docker (homelab Windows)

## Qué hay en esta carpeta
- `index.html`, `manifest.json`, `sw.js`, íconos: la app.
- `server.js`: servidor pequeño (Node, sin dependencias) que sirve la app y guarda los datos en `/data/datos.json`.
- `Dockerfile` y `compose.yaml`: publican la app en el puerto **5001** y guardan los datos en el volumen **mis-gastos-datos**.

## Cómo levantarla
1. Abre Docker Desktop y espera a que diga que está corriendo.
2. Descomprime el .zip, por ejemplo en `C:\homelab\mis-gastos`.
3. Abre PowerShell en esa carpeta y ejecuta:
   ```powershell
   docker compose up -d --build
   ```
4. Abre http://localhost:5001 en el PC. Desde el iPhone u otro equipo de la casa: `http://IP-DEL-PC:5001` (la IP sale con `ipconfig`, "Dirección IPv4"). Si Windows pregunta por el firewall, permite el acceso en redes privadas.

## Cómo se guardan los datos
- La app sigue guardando todo en el navegador (como antes) y además copia los gastos, contactos, sueldos, cuentas divididas, periodos y datos de transferencia al servidor. El servidor los escribe en el volumen `mis-gastos-datos`, así que no se pierden si borras el contenedor, actualizas la imagen o reinicias el PC.
- Al abrir la app, o al volver a ella, se baja lo del servidor. Así el PC y el iPhone ven lo mismo. Si dos equipos cambian lo mismo casi al mismo tiempo, gana el último en guardar.
- La primera vez que abras la app en un navegador que ya tenía datos (por ejemplo, la versión de localhost), esos datos se suben solos si el servidor aún no los tiene.
- La clave de API de Claude **no** se sube al servidor: queda solo en cada dispositivo.

## Comandos útiles
```powershell
docker compose logs -f              # ver el registro
docker compose down                 # detener (los datos quedan en el volumen)
docker compose up -d --build        # actualizar después de cambiar archivos
# Respaldo del volumen a un archivo en la carpeta actual:
docker run --rm -v mis-gastos-datos:/data -v ${PWD}:/respaldo alpine cp /data/datos.json /respaldo/
```
`docker compose down -v` **borra** el volumen y los datos: no uses `-v` salvo que quieras empezar de cero.

## Límites
- Por http (sin https) el iPhone abre la app pero Safari no la instala como app offline. Para eso hace falta https (por ejemplo, un proxy inverso con certificado o Tailscale).
- No hay usuario ni contraseña: cualquiera en tu red que abra el puerto 5001 ve tus gastos. No lo expongas a internet sin protegerlo.
