<?php
declare(strict_types=1);

namespace App\Infrastructure\Persistence;


use App\Application\Ports\UserRepository;
use App\Domain\UserRole;
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
    $stmt = $this->pdo->prepare("SELECT id, email, display_name, is_active, created_at, updated_at, role FROM users WHERE id = :id LIMIT 1");
    $stmt->execute(["id" => $id]);
    $row = $stmt->fetch();
    return $row ?: null;
  }

  public function create(string $email, string $passwordHash, ?string $displayName, UserRole $role = UserRole::USER): array {
    $stmt = $this->pdo->prepare("
      INSERT INTO users (email, password_hash, display_name, role)
      VALUES (:email, :hash, :display_name, :role)
      RETURNING id, email, display_name, is_active, created_at, updated_at, role
    ");
    $stmt->execute([
      "email" => $email,
      "hash" => $passwordHash,
      "display_name" => $displayName,
      "role" => $role->value,
    ]);
    return $stmt->fetch();
  }

  public function setRole(int $userId, UserRole $role): void {
    $stmt = $this->pdo->prepare("UPDATE users SET role = :role WHERE id = :id");
    $stmt->execute([
      "role" => $role->value,
      "id" => $userId,
    ]);
  }

  public function setActive(int $userId, bool $isActive): void {
    $stmt = $this->pdo->prepare("UPDATE users SET is_active = :is_active WHERE id = :id");
    $stmt->execute([
      "is_active" => $isActive,
      "id" => $userId,
    ]);
  }
}
