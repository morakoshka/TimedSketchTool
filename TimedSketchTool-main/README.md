# TimedSketchTool

## Galería personal

La galería requiere PHP, MySQL y una sesión de Apache; no funciona al abrir
`index.html` directamente como archivo local.

1. Inicia Apache y MySQL en XAMPP.
2. Para una instalación nueva, importa `config/schema.sql` en MySQL (por
   ejemplo, desde phpMyAdmin). En una base existente que aún no tenga los
   metadatos de sesión, ejecuta una sola vez
   `config/migrate_gallery_metadata.sql`. Ejecuta también una sola vez
   `config/migrate_admin.sql` en cada base existente para habilitar los roles,
   las categorías administrables y la configuración del sistema.
3. Si tu instalación no usa los valores predeterminados de XAMPP, configura
   `TST_DB_HOST`, `TST_DB_NAME`, `TST_DB_USER` y `TST_DB_PASSWORD` en el entorno
   de Apache. Los valores predeterminados son `127.0.0.1`,
   `timed_sketch_tool`, `root` y contraseña vacía.
4. Abre `http://localhost/TimedSketchTool/TimedSketchTool-main/`.

El diseño retro azul del prototipo `TST-rediseño` está integrado en este
proyecto: los estilos están en `assets/css/style.css` y el logotipo en
`assets/img/timed-sketch-logo.png`. La página principal conserva los módulos de
cuenta, galería y administración además de las funciones de práctica; los
estilos complementan también esas secciones y se adaptan a pantallas pequeñas.

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

La lógica del frontend está separada por responsabilidad en
`assets/js/galeria/`: `galeria-base.js` comparte estado y utilidades;
`galeria-registro-usuario.js`, `galeria-inicio-sesion.js` y
`galeria-cierre-sesion.js` gestionan las operaciones de cuenta;
`galeria-registro.js` guarda dibujos; `galeria-consulta.js` muestra la galería y
los detalles; `galeria-edicion.js` y `galeria-eliminacion.js` gestionan cambios
y borrado; y `galeria-filtros.js` aplica los filtros.

La práctica también está dividida por responsabilidad: `imagenes.js` carga
referencias solo en el navegador; `categorias-referencia.js`,
`configuracion-sesion.js` y `seleccion-imagenes.js` preparan la sesión;
`sesiones.js`, `temporizador.js` y `controles-sesion.js` coordinan la práctica;
`atajos-teclado.js`, `resumen-sesion.js`, `modo-zen.js` y
`pantalla-completa.js` implementan las funciones complementarias. El orden de
carga de `index.html` respeta las dependencias entre módulos.

Durante una práctica, Espacio pausa o reanuda, la flecha izquierda repite la
imagen anterior y la flecha derecha avanza. El modo libre mide el tiempo
transcurrido y avanza solo con los controles. Al terminar se muestra el número
de ejercicios completados y el tiempo total de práctica.

## Administración

El panel aparece solo para cuentas con permisos de administrador. Para crear al
primer administrador en una instalación existente, registra la cuenta y asigna
el permiso directamente en MySQL, sustituyendo el correo por el de esa cuenta:

```sql
UPDATE users SET is_admin = 1 WHERE email = 'admin@example.com';
```

Después, inicia sesión o vuelve a cargar la aplicación. Los administradores
pueden crear, renombrar y eliminar categorías (las predeterminadas no se
eliminan y las categorías en uso no pueden borrarse), revisar y eliminar dibujos
de cualquier usuario, y conceder o retirar permisos de administración. El
sistema impide retirar el propio permiso o dejar la instalación sin
administradores. También pueden cambiar el título, el mensaje de bienvenida y
la duración predeterminada de las sesiones. Las operaciones administrativas se
validan en el servidor y las modificaciones usan el token CSRF de la sesión.
