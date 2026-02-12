<?php
declare(strict_types=1);

namespace App\Application\Ports;

interface UserRepository {
  public function findByEmail(string $email): ?array; // returns user row
  public function findById(int $id): ?array;
  public function create(string $email, string $passwordHash, ?string $displayName): array;
}