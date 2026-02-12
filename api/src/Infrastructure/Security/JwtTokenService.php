<?php
declare(strict_types=1);

namespace App\Infrastructure\Security;

use App\Application\Ports\TokenService;
use Firebase\JWT\JWT;

final class JwtTokenService implements TokenService {
  public function issueAccessToken(int $userId, string $email): string {
    $now = time();
    $ttl = ((int)($_ENV['ACCESS_TTL_MINUTES'] ?? 15)) * 60;

    $payload = [
      "iss" => $_ENV['JWT_ISSUER'] ?? "auth-demo",
      "iat" => $now,
      "exp" => $now + $ttl,
      "sub" => (string)$userId,
      "email" => $email,
    ];

    return JWT::encode($payload, $_ENV['JWT_SECRET'], "HS256");
  }
}