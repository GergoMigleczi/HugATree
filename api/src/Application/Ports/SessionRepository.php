<?php
declare(strict_types=1);

namespace App\Application\Ports;

interface SessionRepository {
  public function create(int $userId, string $refreshTokenHash, string $expiresAt, ?string $deviceLabel, ?string $userAgent, ?string $ip): void;

  public function findByRefreshTokenHash(string $hash): ?array;

  public function revokeById(int $id): void;

  public function revokeByRefreshTokenHash(string $hash): void;
}