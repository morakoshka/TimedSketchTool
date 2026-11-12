<?php
declare(strict_types=1);

function conectarBaseDatos(): PDO
{
    $host = getenv('TST_DB_HOST') ?: '127.0.0.1';
    $database = getenv('TST_DB_NAME') ?: 'timed_sketch_tool';
    $username = getenv('TST_DB_USER') ?: 'root';
    $password = getenv('TST_DB_PASSWORD');

    $dsn = 'mysql:host=' . $host . ';dbname=' . $database . ';charset=utf8mb4';

    return new PDO($dsn, $username, $password === false ? '' : $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false
    ]);
}
