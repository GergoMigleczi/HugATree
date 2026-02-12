<?php
declare(strict_types=1);

namespace App\Infrastructure\Persistence;

use App\Application\Ports\SessionRepository;
use PDO;

final class PdoSessionRepository implements SessionRepository {
  public function __construct(private PDO $pdo) {}

  public function create(int $userId, string $refreshTokenHash, string $expiresAt, ?string $deviceLabel, ?string $userAgent, ?string $ip): void {
    $stmt = $this->pdo->prepare("
      INSERT INTO sessions (user_id, refresh_token_hash, expires_at, device_label, user_agent, ip_address)
      VALUES (:user_id, :hash, :expires_at, :device_label, :user_agent, :ip)
    ");
    $stmt->execute([
      "user_id" => $userId,
      "hash" => $refreshTokenHash,
      "expires_at" => $expiresAt,
      "device_label" => $deviceLabel,
      "user_agent" => $userAgent,
      "ip" => $ip,
    ]);
  }

  public function findByRefreshTokenHash(string $hash): ?array {
    $stmt = $this->pdo->prepare("
      SELECT s.*, u.email, u.is_active
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.refresh_token_hash = :hash
      LIMIT 1
    ");
    $stmt->execute(["hash" => $hash]);
    $row = $stmt->fetch();
    return $row ?: null;
  }

  public function revokeById(int $id): void {
    $this->pdo->prepare("UPDATE sessions SET revoked_at = NOW(), last_used_at = NOW() WHERE id = :id AND revoked_at IS NULL")
      ->execute(["id" => $id]);
  }

  public function revokeByRefreshTokenHash(string $hash): void {
    $this->pdo->prepare("UPDATE sessions SET revoked_at = NOW(), last_used_at = NOW() WHERE refresh_token_hash = :hash AND revoked_at IS NULL")
      ->execute(["hash" => $hash]);
  }
}