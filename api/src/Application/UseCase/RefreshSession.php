<?php
declare(strict_types=1);

namespace App\Application\UseCase;

use App\Application\Ports\SessionRepository;
use App\Application\Ports\TokenService;

final class RefreshSession {
  public function __construct(
    private SessionRepository $sessions,
    private TokenService $tokens
  ) {}

  public function execute(string $refreshToken): array {
    if ($refreshToken === "") throw new \InvalidArgumentException("Missing refreshToken");

    $hash = Tokens::hash($refreshToken);
    $row = $this->sessions->findByRefreshTokenHash($hash);

    if (!$row || $row["revoked_at"] !== null || !$row["is_active"]) {
      throw new \RuntimeException("Invalid refresh token", 401);
    }

    $expiresAt = new \DateTimeImmutable((string)$row["expires_at"]);
    if ($expiresAt < new \DateTimeImmutable("now")) {
      throw new \RuntimeException("Refresh token expired", 401);
    }

    // rotate: revoke old, create new
    $this->sessions->revokeById((int)$row["id"]);

    $newRefresh = Tokens::newRefreshToken();
    $newHash = Tokens::hash($newRefresh);

    $days = (int)($_ENV["REFRESH_TTL_DAYS"] ?? 30);
    $newExpiresAt = (new \DateTimeImmutable("now", new \DateTimeZone("UTC")))
      ->modify("+{$days} days")
      ->format("Y-m-d H:i:sP");

    $this->sessions->create(
      (int)$row["user_id"],
      $newHash,
      $newExpiresAt,
      $row["device_label"] ?? null,
      $row["user_agent"] ?? null,
      $row["ip_address"] ?? null
    );

    $accessToken = $this->tokens->issueAccessToken((int)$row["user_id"], (string)$row["email"]);

    return [
      "accessToken" => $accessToken,
      "refreshToken" => $newRefresh,
    ];
  }
}