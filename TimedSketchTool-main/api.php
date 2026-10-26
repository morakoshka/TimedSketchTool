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

function usuarioActual(): ?array
{
    if (empty($_SESSION['user_id'])) {
        return null;
    }

    return [
        'id' => (int) $_SESSION['user_id'],
        'email' => (string) $_SESSION['user_email']
    ];
}

function validarCategoria(string $categoria): bool
{
    return in_array($categoria, [
        'sin_categoria',
        'poses',
        'rostros',
        'manos',
        'anatomia'
    ], true);
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
        'user' => usuarioActual(),
        'csrfToken' => $_SESSION['csrf_token']
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
        'user' => usuarioActual(),
        'csrfToken' => $_SESSION['csrf_token']
    ]);
}

if ($accion === 'logout') {
    exigirMetodo('POST');
    exigirTokenCsrf();
    $_SESSION = [];
    session_regenerate_id(true);
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    responderJson(['user' => null, 'csrfToken' => $_SESSION['csrf_token']]);
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
    if ($categoria !== 'todas' && !validarCategoria($categoria)) {
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

    if (!validarCategoria($categoria)) {
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
    if (!validarCategoria($categoria)) {
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
        if (!is_int($duration) || !in_array($duration, [30, 60, 120, 300], true) ||
            !is_int($imageCount) || $imageCount < 1 || $imageCount > 10000 ||
            !is_string($sessionCategoryValue) ||
            ($sessionCategoryValue !== 'todas' && !validarCategoria($sessionCategoryValue)) ||
            !is_string($startedAt)) {
            errorApi('La información de la sesión no es válida.', 422);
        }

        $fechaSesion = DateTimeImmutable::createFromFormat(
            '!Y-m-d\TH:i:s\Z',
            $startedAt,
            new DateTimeZone('UTC')
        );
        if (!$fechaSesion ||
            $fechaSesion->format('Y-m-d\TH:i:s\Z') !== $startedAt) {
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

errorApi('La acción solicitada no existe.', 404);
} catch (PDOException $error) {
    error_log('Error de base de datos en la galería: ' . $error->getMessage());
    errorApi('No se pudo completar la operación. Inténtalo más tarde.', 500);
}
