<?php
declare(strict_types=1);

require_once __DIR__ . '/config/database.php';

ini_set('session.use_strict_mode', '1');
ini_set('session.use_only_cookies', '1');

$isHttps = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
session_name('timed_sketch_session');
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'secure' => $isHttps,
    'httponly' => true,
    'samesite' => 'Strict'
]);
session_start();

header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function responderJson(array $datos, int $estado = 200): void
{
    http_response_code($estado);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($datos, JSON_UNESCAPED_UNICODE);
    exit;
}

function errorApi(string $mensaje, int $estado): void
{
    responderJson(['error' => $mensaje], $estado);
}

function exigirMetodo(string $metodo): void
{
    if ($_SERVER['REQUEST_METHOD'] !== $metodo) {
        header('Allow: ' . $metodo);
        errorApi('Método no permitido.', 405);
    }
}

function exigirTokenCsrf(): void
{
    $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!is_string($token) || empty($_SESSION['csrf_token']) ||
        !hash_equals($_SESSION['csrf_token'], $token)) {
        errorApi('La sesión expiró. Recarga la página e inténtalo de nuevo.', 403);
    }
}

function exigirUsuario(): int
{
    if (empty($_SESSION['user_id'])) {
        errorApi('Inicia sesión para continuar.', 401);
    }

    return (int) $_SESSION['user_id'];
}

function leerJson(): array
{
    $datos = json_decode(file_get_contents('php://input'), true);
    if (!is_array($datos)) {
        errorApi('La solicitud no contiene datos válidos.', 400);
    }

    return $datos;
}

function usuarioActual(PDO $pdo): ?array
{
    if (empty($_SESSION['user_id'])) {
        return null;
    }

    $statement = $pdo->prepare(
        'SELECT id, email, is_admin FROM users WHERE id = :id'
    );
    $statement->execute(['id' => (int) $_SESSION['user_id']]);
    $usuario = $statement->fetch();
    if (!$usuario) {
        return null;
    }

    return [
        'id' => (int) $usuario['id'],
        'email' => (string) $usuario['email'],
        'is_admin' => (bool) $usuario['is_admin']
    ];
}

function exigirAdministrador(PDO $pdo): int
{
    $userId = exigirUsuario();
    $statement = $pdo->prepare(
        'SELECT is_admin FROM users WHERE id = :id'
    );
    $statement->execute(['id' => $userId]);
    if (!(bool) $statement->fetchColumn()) {
        errorApi('No tienes permisos para administrar el sistema.', 403);
    }

    return $userId;
}

function validarCategoria(PDO $pdo, string $categoria): bool
{
    $statement = $pdo->prepare(
        'SELECT 1 FROM categories WHERE slug = :slug'
    );
    $statement->execute(['slug' => $categoria]);
    return (bool) $statement->fetchColumn();
}

function categoriasDisponibles(PDO $pdo): array
{
    return $pdo->query(
        'SELECT slug, label, is_system FROM categories ORDER BY is_system DESC, label'
    )->fetchAll();
}

function configuracionAplicacion(PDO $pdo): array
{
    $valores = $pdo->query(
        'SELECT setting_key, setting_value FROM app_settings'
    )->fetchAll(PDO::FETCH_KEY_PAIR);

    return [
        'app_title' => $valores['app_title'] ?? 'Timed Sketch Tool',
        'welcome_message' => $valores['welcome_message'] ?? 'Practica dibujo a tu ritmo',
        'default_duration_seconds' => (int) ($valores['default_duration_seconds'] ?? 30)
    ];
}

function validarFechaIso(string $fecha): bool
{
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha)) {
        return false;
    }

    [$anio, $mes, $dia] = array_map('intval', explode('-', $fecha));
    return checkdate($mes, $dia, $anio);
}

try {
    $pdo = conectarBaseDatos();
} catch (PDOException $error) {
    error_log('No se pudo conectar a la base de datos: ' . $error->getMessage());
    errorApi('No se pudo conectar con el servidor. Inténtalo más tarde.', 500);
}

try {
$accion = $_GET['action'] ?? '';

if ($accion === 'session') {
    exigirMetodo('GET');
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    responderJson([
        'user' => usuarioActual($pdo),
        'csrfToken' => $_SESSION['csrf_token'],
        'categories' => categoriasDisponibles($pdo),
        'settings' => configuracionAplicacion($pdo)
    ]);
}

if ($accion === 'register' || $accion === 'login') {
    exigirMetodo('POST');
    exigirTokenCsrf();
    $datos = leerJson();
    $email = $datos['email'] ?? null;
    $password = $datos['password'] ?? null;
    if (!is_string($email) || !is_string($password)) {
        errorApi('Escribe un correo electrónico y una contraseña válidos.', 422);
    }
    $email = strtolower(trim($email));

    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 254) {
        errorApi('Escribe un correo electrónico válido.', 422);
    }
    if (strlen($password) > 4096) {
        errorApi('La contraseña supera el tamaño permitido.', 422);
    }

    if ($accion === 'register') {
        $longitudContrasena = preg_match_all('/./us', $password);
        if ($longitudContrasena === false || $longitudContrasena < 10) {
            errorApi('La contraseña debe tener al menos 10 caracteres.', 422);
        }

        $statement = $pdo->prepare(
            'INSERT INTO users (email, password_hash) VALUES (:email, :password_hash)'
        );
        try {
            $statement->execute([
                'email' => $email,
                'password_hash' => password_hash($password, PASSWORD_DEFAULT)
            ]);
        } catch (PDOException $error) {
            if ($error->getCode() === '23000') {
                errorApi('Ya existe una cuenta con ese correo electrónico.', 409);
            }
            throw $error;
        }

        $_SESSION['user_id'] = (int) $pdo->lastInsertId();
    } else {
        $statement = $pdo->prepare(
            'SELECT id, email, password_hash FROM users WHERE email = :email'
        );
        $statement->execute(['email' => $email]);
        $usuario = $statement->fetch();

        if (!$usuario || !password_verify($password, $usuario['password_hash'])) {
            errorApi('Correo electrónico o contraseña incorrectos.', 401);
        }

        $_SESSION['user_id'] = (int) $usuario['id'];
    }

    session_regenerate_id(true);
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    $_SESSION['user_email'] = $email;
    responderJson([
        'user' => usuarioActual($pdo),
        'csrfToken' => $_SESSION['csrf_token'],
        'categories' => categoriasDisponibles($pdo),
        'settings' => configuracionAplicacion($pdo)
    ]);
}

if ($accion === 'logout') {
    exigirMetodo('POST');
    exigirTokenCsrf();
    $_SESSION = [];
    session_regenerate_id(true);
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    responderJson([
        'user' => null,
        'csrfToken' => $_SESSION['csrf_token'],
        'categories' => categoriasDisponibles($pdo),
        'settings' => configuracionAplicacion($pdo)
    ]);
}

if ($accion === 'drawings') {
    exigirMetodo('GET');
    $userId = exigirUsuario();
    $categoria = $_GET['category'] ?? 'todas';
    $fechaDesde = $_GET['date_from'] ?? '';
    $fechaHasta = $_GET['date_to'] ?? '';
    if (!is_string($categoria)) {
        errorApi('La categoría seleccionada no es válida.', 422);
    }
    if ($categoria !== 'todas' && !validarCategoria($pdo, $categoria)) {
        errorApi('La categoría seleccionada no es válida.', 422);
    }

    foreach ([$fechaDesde, $fechaHasta] as $fecha) {
        if (!is_string($fecha)) {
            errorApi('El rango de fechas no es válido.', 422);
        }
        if ($fecha !== '' && !validarFechaIso($fecha)) {
            errorApi('El rango de fechas contiene una fecha no válida.', 422);
        }
    }
    if ($fechaDesde !== '' && $fechaHasta !== '' && $fechaDesde > $fechaHasta) {
        errorApi('La fecha inicial no puede ser posterior a la fecha final.', 422);
    }

    $condiciones = ['user_id = :user_id'];
    $parametros = ['user_id' => $userId];
    if ($categoria !== 'todas') {
        $condiciones[] = 'category = :category';
        $parametros['category'] = $categoria;
    }
    if ($fechaDesde !== '') {
        $condiciones[] = 'drawing_date >= :date_from';
        $parametros['date_from'] = $fechaDesde;
    }
    if ($fechaHasta !== '') {
        $condiciones[] = 'drawing_date <= :date_to';
        $parametros['date_to'] = $fechaHasta;
    }

    $statement = $pdo->prepare(
        'SELECT id, title, description, category, drawing_date,
                session_duration_seconds, session_image_count,
                session_category, session_started_at, created_at
         FROM drawings
         WHERE ' . implode(' AND ', $condiciones) . '
         ORDER BY drawing_date DESC, id DESC'
    );
    $statement->execute($parametros);
    responderJson(['drawings' => $statement->fetchAll()]);
}

if ($accion === 'update') {
    exigirMetodo('POST');
    exigirTokenCsrf();
    $userId = exigirUsuario();
    $datos = leerJson();
    $id = filter_var($datos['id'] ?? null, FILTER_VALIDATE_INT);
    if (!$id || $id < 1) {
        errorApi('El dibujo solicitado no existe.', 404);
    }

    $titulo = $datos['title'] ?? null;
    $descripcion = $datos['description'] ?? null;
    $categoria = $datos['category'] ?? null;
    $fechaDibujo = $datos['drawing_date'] ?? null;
    if (!is_string($titulo) || !is_string($descripcion) ||
        !is_string($categoria) || !is_string($fechaDibujo)) {
        errorApi('Completa correctamente la información del dibujo.', 422);
    }

    $titulo = trim($titulo);
    $longitudTitulo = preg_match_all('/./us', $titulo);
    if ($longitudTitulo === false || $longitudTitulo < 1 || $longitudTitulo > 100) {
        errorApi('El título debe tener entre 1 y 100 caracteres.', 422);
    }

    $longitudDescripcion = preg_match_all('/./us', $descripcion);
    if ($longitudDescripcion === false || $longitudDescripcion > 2000) {
        errorApi('La descripción no puede superar los 2000 caracteres.', 422);
    }

    if (!validarCategoria($pdo, $categoria)) {
        errorApi('La categoría seleccionada no es válida.', 422);
    }

    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $fechaDibujo)) {
        errorApi('Selecciona una fecha válida para el dibujo.', 422);
    }
    [$anio, $mes, $dia] = array_map('intval', explode('-', $fechaDibujo));
    if (!checkdate($mes, $dia, $anio)) {
        errorApi('Selecciona una fecha válida para el dibujo.', 422);
    }

    $propietario = $pdo->prepare(
        'SELECT id FROM drawings WHERE id = :id AND user_id = :user_id'
    );
    $propietario->execute(['id' => $id, 'user_id' => $userId]);
    if (!$propietario->fetch()) {
        errorApi('El dibujo solicitado no existe.', 404);
    }

    $statement = $pdo->prepare(
        'UPDATE drawings
         SET title = :title,
             description = :description,
             category = :category,
             drawing_date = :drawing_date
         WHERE id = :id AND user_id = :user_id'
    );
    $statement->execute([
        'title' => $titulo,
        'description' => $descripcion,
        'category' => $categoria,
        'drawing_date' => $fechaDibujo,
        'id' => $id,
        'user_id' => $userId
    ]);

    responderJson(['message' => 'La información del dibujo se actualizó correctamente.']);
}

if ($accion === 'image') {
    exigirMetodo('GET');
    $userId = exigirUsuario();
    $id = filter_var($_GET['id'] ?? null, FILTER_VALIDATE_INT);
    if (!$id || $id < 1) {
        errorApi('El dibujo solicitado no existe.', 404);
    }

    $statement = $pdo->prepare(
        'SELECT mime_type, image_data FROM drawings
         WHERE id = :id AND user_id = :user_id'
    );
    $statement->execute(['id' => $id, 'user_id' => $userId]);
    $dibujo = $statement->fetch();
    if (!$dibujo) {
        errorApi('El dibujo solicitado no existe.', 404);
    }

    header('Content-Type: ' . $dibujo['mime_type']);
    header('Content-Disposition: inline');
    echo is_resource($dibujo['image_data'])
        ? stream_get_contents($dibujo['image_data'])
        : $dibujo['image_data'];
    exit;
}

if ($accion === 'upload') {
    exigirMetodo('POST');
    exigirTokenCsrf();
    $userId = exigirUsuario();

    $archivo = $_FILES['drawing'] ?? null;
    if (is_array($archivo) &&
        in_array($archivo['error'] ?? null, [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true)) {
        errorApi('Cada imagen debe pesar como máximo 5 MB.', 413);
    }
    if (!is_array($archivo) ||
        ($archivo['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK ||
        !isset($archivo['tmp_name']) || !is_string($archivo['tmp_name']) ||
        !is_uploaded_file($archivo['tmp_name'])) {
        errorApi('Selecciona una imagen válida para guardar.', 422);
    }
    if (!isset($archivo['size']) || !is_int($archivo['size']) ||
        $archivo['size'] > 5 * 1024 * 1024) {
        errorApi('Cada imagen debe pesar como máximo 5 MB.', 413);
    }

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mimeType = $finfo->file($archivo['tmp_name']);
    $tiposPermitidos = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp'
    ];
    $infoImagen = getimagesize($archivo['tmp_name']);
    if (!in_array($mimeType, $tiposPermitidos, true) ||
        $infoImagen === false || $infoImagen['mime'] !== $mimeType) {
        errorApi('El archivo debe ser una imagen JPEG, PNG, GIF o WebP válida.', 422);
    }

    $titulo = $_POST['title'] ?? '';
    if (!is_string($titulo)) {
        errorApi('El nombre del dibujo no es válido.', 422);
    }
    $titulo = trim($titulo);
    $longitudTitulo = preg_match_all('/./us', $titulo);
    if ($longitudTitulo === false || $longitudTitulo < 1 || $longitudTitulo > 100) {
        errorApi('El nombre debe tener entre 1 y 100 caracteres.', 422);
    }

    $categoria = $_POST['category'] ?? 'sin_categoria';
    if (!is_string($categoria)) {
        errorApi('La categoría seleccionada no es válida.', 422);
    }
    if (!validarCategoria($pdo, $categoria)) {
        errorApi('La categoría seleccionada no es válida.', 422);
    }

    $descripcion = $_POST['description'] ?? '';
    if (!is_string($descripcion)) {
        errorApi('La descripción no es válida.', 422);
    }
    $longitudDescripcion = preg_match_all('/./us', $descripcion);
    if ($longitudDescripcion === false || $longitudDescripcion > 2000) {
        errorApi('La descripción no puede superar los 2000 caracteres.', 422);
    }

    $fechaDibujo = $_POST['drawing_date'] ?? '';
    if (!is_string($fechaDibujo) ||
        !preg_match('/^\d{4}-\d{2}-\d{2}$/', $fechaDibujo)) {
        errorApi('Selecciona una fecha válida para el dibujo.', 422);
    }
    [$anio, $mes, $dia] = array_map('intval', explode('-', $fechaDibujo));
    if (!checkdate($mes, $dia, $anio)) {
        errorApi('Selecciona una fecha válida para el dibujo.', 422);
    }

    $sessionDuration = null;
    $sessionImageCount = null;
    $sessionCategory = null;
    $sessionStartedAt = null;
    if (isset($_POST['session'])) {
        if (!is_string($_POST['session'])) {
            errorApi('La información de la sesión no es válida.', 422);
        }
        $session = json_decode($_POST['session'], true);
        if (!is_array($session)) {
            errorApi('La información de la sesión no es válida.', 422);
        }

        $duration = $session['durationSeconds'] ?? null;
        $imageCount = $session['imageCount'] ?? null;
        $sessionCategoryValue = $session['category'] ?? null;
        $startedAt = $session['startedAt'] ?? null;
        $freeMode = $session['freeMode'] ?? false;
        $durationValid = $freeMode === true
            ? $duration === null
            : is_int($duration) && in_array($duration, [30, 60, 120, 300], true);
        if (!is_bool($freeMode) || !$durationValid ||
            !is_int($imageCount) || $imageCount < 1 || $imageCount > 10000 ||
            !is_string($sessionCategoryValue) ||
            ($sessionCategoryValue !== 'todas' &&
                !validarCategoria($pdo, $sessionCategoryValue)) ||
            !is_string($startedAt)) {
            errorApi('La información de la sesión no es válida.', 422);
        }

        // JavaScript genera fechas ISO 8601 con milisegundos (.sssZ).
        // Se aceptan tanto esas fechas como las que no tienen fracción.
        if (!preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/', $startedAt)) {
            errorApi('La fecha de la sesión no es válida.', 422);
        }
        $tieneMilisegundos = str_contains($startedAt, '.');
        $formatoFecha = $tieneMilisegundos
            ? '!Y-m-d\TH:i:s.v\Z'
            : '!Y-m-d\TH:i:s\Z';
        $formatoComprobacion = $tieneMilisegundos
            ? 'Y-m-d\TH:i:s.v\Z'
            : 'Y-m-d\TH:i:s\Z';
        $fechaSesion = DateTimeImmutable::createFromFormat(
            $formatoFecha,
            $startedAt,
            new DateTimeZone('UTC')
        );
        $erroresFecha = DateTimeImmutable::getLastErrors();
        if (!$fechaSesion ||
            ($erroresFecha !== false &&
                ($erroresFecha['warning_count'] > 0 || $erroresFecha['error_count'] > 0)) ||
            $fechaSesion->format($formatoComprobacion) !== $startedAt) {
            errorApi('La fecha de la sesión no es válida.', 422);
        }

        $sessionDuration = $duration;
        $sessionImageCount = $imageCount;
        $sessionCategory = $sessionCategoryValue;
        $sessionStartedAt = $fechaSesion->format('Y-m-d H:i:s');
    }

    $imageData = file_get_contents($archivo['tmp_name']);
    if ($imageData === false) {
        errorApi('No se pudo leer el archivo de imagen.', 500);
    }

    $statement = $pdo->prepare(
        'INSERT INTO drawings (
            user_id, title, description, category, drawing_date,
            session_duration_seconds, session_image_count, session_category,
            session_started_at, mime_type, image_data
         ) VALUES (
            :user_id, :title, :description, :category, :drawing_date,
            :session_duration, :session_image_count, :session_category,
            :session_started_at, :mime_type, :image_data
         )'
    );
    $statement->bindValue(':user_id', $userId, PDO::PARAM_INT);
    $statement->bindValue(':title', $titulo);
    $statement->bindValue(':description', $descripcion);
    $statement->bindValue(':category', $categoria);
    $statement->bindValue(':drawing_date', $fechaDibujo);
    $statement->bindValue(
        ':session_duration',
        $sessionDuration,
        $sessionDuration === null ? PDO::PARAM_NULL : PDO::PARAM_INT
    );
    $statement->bindValue(
        ':session_image_count',
        $sessionImageCount,
        $sessionImageCount === null ? PDO::PARAM_NULL : PDO::PARAM_INT
    );
    $statement->bindValue(
        ':session_category',
        $sessionCategory,
        $sessionCategory === null ? PDO::PARAM_NULL : PDO::PARAM_STR
    );
    $statement->bindValue(
        ':session_started_at',
        $sessionStartedAt,
        $sessionStartedAt === null ? PDO::PARAM_NULL : PDO::PARAM_STR
    );
    $statement->bindValue(':mime_type', $mimeType);
    $statement->bindValue(':image_data', $imageData, PDO::PARAM_LOB);
    $statement->execute();

    responderJson(['message' => 'Dibujo guardado en tu galería.'], 201);
}

if ($accion === 'delete') {
    exigirMetodo('POST');
    exigirTokenCsrf();
    $userId = exigirUsuario();
    $datos = leerJson();
    $id = filter_var($datos['id'] ?? null, FILTER_VALIDATE_INT);
    if (!$id || $id < 1) {
        errorApi('El dibujo solicitado no existe.', 404);
    }

    $statement = $pdo->prepare(
        'DELETE FROM drawings WHERE id = :id AND user_id = :user_id'
    );
    $statement->execute(['id' => $id, 'user_id' => $userId]);
    if ($statement->rowCount() === 0) {
        errorApi('El dibujo solicitado no existe.', 404);
    }

    responderJson(['message' => 'Dibujo eliminado de tu galería.']);
}

if ($accion === 'admin-categories') {
    exigirMetodo('GET');
    exigirAdministrador($pdo);
    responderJson(['categories' => categoriasDisponibles($pdo)]);
}

if ($accion === 'admin-category-create' || $accion === 'admin-category-update') {
    exigirMetodo('POST');
    exigirTokenCsrf();
    exigirAdministrador($pdo);
    $datos = leerJson();
    $slug = $datos['slug'] ?? null;
    $label = $datos['label'] ?? null;
    if (!is_string($slug) || !preg_match('/^[a-z0-9_]{2,24}$/', $slug) ||
        !is_string($label)) {
        errorApi('Los datos de la categoría no son válidos.', 422);
    }
    $label = trim($label);
    $longitudLabel = preg_match_all('/./us', $label);
    if ($longitudLabel === false || $longitudLabel < 1 || $longitudLabel > 40) {
        errorApi('El nombre debe tener entre 1 y 40 caracteres.', 422);
    }

    if ($accion === 'admin-category-create') {
        if (in_array($slug, ['sin_categoria', 'todas'], true)) {
            errorApi('Ese identificador está reservado.', 422);
        }
        $statement = $pdo->prepare(
            'INSERT INTO categories (slug, label) VALUES (:slug, :label)'
        );
        try {
            $statement->execute(['slug' => $slug, 'label' => $label]);
        } catch (PDOException $error) {
            if ($error->getCode() === '23000') {
                errorApi('Ya existe una categoría con ese nombre o identificador.', 409);
            }
            throw $error;
        }
        responderJson(['message' => 'Categoría creada correctamente.'], 201);
    }

    $statement = $pdo->prepare(
        'UPDATE categories SET label = :label WHERE slug = :slug'
    );
    try {
        $statement->execute(['label' => $label, 'slug' => $slug]);
    } catch (PDOException $error) {
        if ($error->getCode() === '23000') {
            errorApi('Ya existe una categoría con ese nombre.', 409);
        }
        throw $error;
    }
    if ($statement->rowCount() === 0) {
        $existe = $pdo->prepare('SELECT 1 FROM categories WHERE slug = :slug');
        $existe->execute(['slug' => $slug]);
        if (!$existe->fetchColumn()) {
            errorApi('La categoría solicitada no existe.', 404);
        }
    }
    responderJson(['message' => 'Categoría actualizada correctamente.']);
}

if ($accion === 'admin-category-delete') {
    exigirMetodo('POST');
    exigirTokenCsrf();
    exigirAdministrador($pdo);
    $datos = leerJson();
    $slug = $datos['slug'] ?? null;
    if (!is_string($slug)) {
        errorApi('La categoría solicitada no existe.', 404);
    }
    $statement = $pdo->prepare(
        'SELECT is_system FROM categories WHERE slug = :slug'
    );
    $statement->execute(['slug' => $slug]);
    $categoria = $statement->fetch();
    if (!$categoria) {
        errorApi('La categoría solicitada no existe.', 404);
    }
    if ((bool) $categoria['is_system']) {
        errorApi('Las categorías predeterminadas no se pueden eliminar.', 409);
    }

    $referencias = $pdo->prepare(
        'SELECT COUNT(*) FROM drawings
         WHERE category = :category OR session_category = :session_category'
    );
    $referencias->execute([
        'category' => $slug,
        'session_category' => $slug
    ]);
    if ((int) $referencias->fetchColumn() > 0) {
        errorApi('No se puede eliminar una categoría que ya está en uso.', 409);
    }
    $statement = $pdo->prepare('DELETE FROM categories WHERE slug = :slug');
    $statement->execute(['slug' => $slug]);
    responderJson(['message' => 'Categoría eliminada correctamente.']);
}

if ($accion === 'admin-drawings') {
    exigirMetodo('GET');
    exigirAdministrador($pdo);
    $dibujos = $pdo->query(
        'SELECT drawings.id, drawings.title, drawings.category,
                drawings.drawing_date, users.email
         FROM drawings
         INNER JOIN users ON users.id = drawings.user_id
         ORDER BY drawings.created_at DESC, drawings.id DESC'
    )->fetchAll();
    responderJson(['drawings' => $dibujos]);
}

if ($accion === 'admin-image') {
    exigirMetodo('GET');
    exigirAdministrador($pdo);
    $id = filter_var($_GET['id'] ?? null, FILTER_VALIDATE_INT);
    if (!$id || $id < 1) {
        errorApi('El dibujo solicitado no existe.', 404);
    }
    $statement = $pdo->prepare(
        'SELECT mime_type, image_data FROM drawings WHERE id = :id'
    );
    $statement->execute(['id' => $id]);
    $dibujo = $statement->fetch();
    if (!$dibujo) {
        errorApi('El dibujo solicitado no existe.', 404);
    }
    header('Content-Type: ' . $dibujo['mime_type']);
    header('Content-Disposition: inline');
    echo is_resource($dibujo['image_data'])
        ? stream_get_contents($dibujo['image_data'])
        : $dibujo['image_data'];
    exit;
}

if ($accion === 'admin-drawing-delete') {
    exigirMetodo('POST');
    exigirTokenCsrf();
    exigirAdministrador($pdo);
    $datos = leerJson();
    $id = filter_var($datos['id'] ?? null, FILTER_VALIDATE_INT);
    if (!$id || $id < 1) {
        errorApi('El dibujo solicitado no existe.', 404);
    }
    $statement = $pdo->prepare('DELETE FROM drawings WHERE id = :id');
    $statement->execute(['id' => $id]);
    if ($statement->rowCount() === 0) {
        errorApi('El dibujo solicitado no existe.', 404);
    }
    responderJson(['message' => 'Dibujo eliminado correctamente.']);
}

if ($accion === 'admin-users') {
    exigirMetodo('GET');
    exigirAdministrador($pdo);
    $usuarios = $pdo->query(
        'SELECT users.id, users.email, users.is_admin, users.created_at,
                COUNT(drawings.id) AS drawing_count
         FROM users
         LEFT JOIN drawings ON drawings.user_id = users.id
         GROUP BY users.id, users.email, users.is_admin, users.created_at
         ORDER BY users.created_at DESC, users.id DESC'
    )->fetchAll();
    responderJson(['users' => $usuarios]);
}

if ($accion === 'admin-user-role') {
    exigirMetodo('POST');
    exigirTokenCsrf();
    $adminId = exigirAdministrador($pdo);
    $datos = leerJson();
    $userId = filter_var($datos['user_id'] ?? null, FILTER_VALIDATE_INT);
    $isAdmin = $datos['is_admin'] ?? null;
    if (!$userId || $userId < 1 || !is_bool($isAdmin)) {
        errorApi('Los datos de permisos no son válidos.', 422);
    }
    if ($userId === $adminId && !$isAdmin) {
        errorApi('No puedes retirar tu propio permiso de administrador.', 409);
    }
    $statement = $pdo->prepare(
        'SELECT is_admin FROM users WHERE id = :id'
    );
    $statement->execute(['id' => $userId]);
    $usuario = $statement->fetch();
    if (!$usuario) {
        errorApi('El usuario solicitado no existe.', 404);
    }
    $pdo->beginTransaction();
    try {
        $administradores = $pdo->query(
            'SELECT id FROM users WHERE is_admin = 1 FOR UPDATE'
        )->fetchAll(PDO::FETCH_COLUMN);
        $statement = $pdo->prepare(
            'SELECT is_admin FROM users WHERE id = :id'
        );
        $statement->execute(['id' => $userId]);
        $usuario = $statement->fetch();
        if (!$usuario) {
            $pdo->rollBack();
            errorApi('El usuario solicitado no existe.', 404);
        }
        if ((bool) $usuario['is_admin'] && !$isAdmin &&
            count($administradores) <= 1) {
            $pdo->rollBack();
            errorApi('El sistema debe conservar al menos un administrador.', 409);
        }
        $statement = $pdo->prepare(
            'UPDATE users SET is_admin = :is_admin WHERE id = :id'
        );
        $statement->execute(['is_admin' => $isAdmin ? 1 : 0, 'id' => $userId]);
        $pdo->commit();
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $error;
    }
    responderJson(['message' => 'Permisos actualizados correctamente.']);
}

if ($accion === 'admin-settings') {
    exigirMetodo('GET');
    exigirAdministrador($pdo);
    responderJson(['settings' => configuracionAplicacion($pdo)]);
}

if ($accion === 'admin-settings-update') {
    exigirMetodo('POST');
    exigirTokenCsrf();
    exigirAdministrador($pdo);
    $datos = leerJson();
    $titulo = $datos['app_title'] ?? null;
    $bienvenida = $datos['welcome_message'] ?? null;
    $duracion = $datos['default_duration_seconds'] ?? null;
    if (!is_string($titulo) || !is_string($bienvenida) ||
        !is_int($duracion) || !in_array($duracion, [30, 60, 120, 300], true)) {
        errorApi('La configuración enviada no es válida.', 422);
    }
    $titulo = trim($titulo);
    $bienvenida = trim($bienvenida);
    $longitudTitulo = preg_match_all('/./us', $titulo);
    $longitudBienvenida = preg_match_all('/./us', $bienvenida);
    if ($longitudTitulo === false || $longitudTitulo < 1 || $longitudTitulo > 100 ||
        $longitudBienvenida === false || $longitudBienvenida < 1 ||
        $longitudBienvenida > 160) {
        errorApi('El título o mensaje de bienvenida supera la longitud permitida.', 422);
    }

    $statement = $pdo->prepare(
        'INSERT INTO app_settings (setting_key, setting_value)
         VALUES (:setting_key, :setting_value)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)'
    );
    foreach ([
        'app_title' => $titulo,
        'welcome_message' => $bienvenida,
        'default_duration_seconds' => (string) $duracion
    ] as $key => $value) {
        $statement->execute([
            'setting_key' => $key,
            'setting_value' => $value
        ]);
    }
    responderJson([
        'message' => 'Configuración guardada correctamente.',
        'settings' => configuracionAplicacion($pdo)
    ]);
}

errorApi('La acción solicitada no existe.', 404);
} catch (PDOException $error) {
    error_log('Error de base de datos en la galería: ' . $error->getMessage());
    errorApi('No se pudo completar la operación. Inténtalo más tarde.', 500);
}
