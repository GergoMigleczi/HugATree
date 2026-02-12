<?php
declare(strict_types=1);

namespace App\Infrastructure\Persistence;

use PDO;

final class DbConnection {
  public static function make(): PDO {
    $host = $_ENV['DB_HOST'];
    $port = $_ENV['DB_PORT'];
    $name = $_ENV['DB_NAME'];
    $user = $_ENV['DB_USER'];
    $pass = $_ENV['DB_PASS'];

    $dsn = "pgsql:host={$host};port={$port};dbname={$name}";
    return new PDO($dsn, $user, $pass, [
      PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
      PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
  }
}