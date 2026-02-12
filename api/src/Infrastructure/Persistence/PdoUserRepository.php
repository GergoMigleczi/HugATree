<?php
declare(strict_types=1);

namespace App\Infrastructure\Persistence;

use App\Application\Ports\UserRepository;
use PDO;

final class PdoUserRepository implements UserRepository {
  public function __construct(private PDO $pdo) {}

  public function findByEmail(string $email): ?array {
    $stmt = $this->pdo->prepare("SELECT * FROM users WHERE email = :email LIMIT 1");
    $stmt->execute(["email" => $email]);
    $row = $stmt->fetch();
    return $row ?: null;
  }

  public function findById(int $id): ?array {
    $stmt = $this->pdo->prepare("SELECT id, email, display_name, is_active, created_at, updated_at FROM users WHERE id = :id LIMIT 1");
    $stmt->execute(["id" => $id]);
    $row = $stmt->fetch();
    return $row ?: null;
  }

  public function create(string $email, string $passwordHash, ?string $displayName): array {
    $stmt = $this->pdo->prepare("
      INSERT INTO users (email, password_hash, display_name)
      VALUES (:email, :hash, :display_name)
      RETURNING id, email, display_name, is_active, created_at, updated_at
    ");
    $stmt->execute([
      "email" => $email,
      "hash" => $passwordHash,
      "display_name" => $displayName,
    ]);
    return $stmt->fetch();
  }
}