<?php
declare(strict_types=1);

namespace App\Application\Ports;

use App\Domain\UserRole;

interface UserRepository {
  public function findByEmail(string $email): ?array; // returns user row
  public function findById(int $id): ?array;
  public function create(string $email, string $passwordHash, ?string $displayName, UserRole $role = UserRole::USER): array;
  public function setRole(int $userId, UserRole $role): void;
  public function setActive(int $userId, bool $isActive): void;
}