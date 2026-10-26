# TimedSketchTool

## Galería personal

La galería requiere PHP, MySQL y una sesión de Apache; no funciona al abrir
`index.html` directamente como archivo local.

1. Inicia Apache y MySQL en XAMPP.
2. Para una instalación nueva, importa `config/schema.sql` en MySQL (por
   ejemplo, desde phpMyAdmin). Si ya instalaste la galería, ejecuta una sola
   vez `config/migrate_gallery_metadata.sql` para añadir los nuevos campos sin
   borrar los dibujos existentes.
3. Si tu instalación no usa los valores predeterminados de XAMPP, configura
   `TST_DB_HOST`, `TST_DB_NAME`, `TST_DB_USER` y `TST_DB_PASSWORD` en el entorno
   de Apache. Los valores predeterminados son `127.0.0.1`,
   `timed_sketch_tool`, `root` y contraseña vacía.
4. Abre `http://localhost/TimedSketchTool/TimedSketchTool-main/`.

Los usuarios pueden registrarse e iniciar sesión con su correo. Cada cuenta
puede guardar imágenes JPEG, PNG, GIF o WebP de hasta 5 MB, agregar título,
descripción, categoría y fecha, y filtrar la galería por categoría o por un
rango de fechas. También puede vincular un dibujo a la sesión de práctica
actual para registrar su duración por imagen, número de referencias, categoría
y fecha de inicio. Las tarjetas permiten abrir una vista de detalle con la
imagen ampliada y toda la información asociada. Desde esa vista también se
pueden editar el título, la descripción, la categoría y la fecha; la imagen y
el registro histórico de la sesión se conservan sin cambios. Antes de eliminar
un dibujo, la aplicación solicita confirmación e identifica el dibujo; el
servidor limita la operación al propietario de la cuenta. Las imágenes se
guardan en MySQL y solo se sirven al usuario propietario de la sesión.

La lógica del frontend está separada por responsabilidad en `assets/js/galeria/`:
`galeria-base.js` comparte estado y utilidades; `galeria-cuenta.js` administra
autenticación; `galeria-registro.js` guarda dibujos; `galeria-consulta.js`
muestra la galería y los detalles; `galeria-edicion.js` y
`galeria-eliminacion.js` gestionan cambios y borrado; y
`galeria-filtros.js` aplica los filtros. Todos los módulos están en este mismo
directorio, y el orden de carga en `index.html` respeta sus dependencias.
