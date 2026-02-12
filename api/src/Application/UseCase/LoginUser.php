<?php
declare(strict_types=1);

namespace App\Application\UseCase;

use App\Application\Ports\PasswordHasher;
use App\Application\Ports\SessionRepository;
use App\Application\Ports\TokenService;
use App\Application\Ports\UserRepository;

final class LoginUser {
  public function __construct(
    private UserRepository $users,
    private SessionRepository $sessions,
    private PasswordHasher $hasher,
    private TokenService $tokens
  ) {}

  public function execute(string $email, string $password, ?string $deviceLabel, ?string $userAgent, ?string $ip): array {
    $email = strtolower(trim($email));
    $user = $this->users->findByEmail($email);

    if (!$user || !$user["is_active"] || !$this->hasher->verify($password, $user["password_hash"])) {
      throw new \RuntimeException("Invalid credentials", 401);
    }

    $accessToken = $this->tokens->issueAccessToken((int)$user["id"], (string)$user["email"]);

    $refreshToken = Tokens::newRefreshToken();
    $refreshHash = Tokens::hash($refreshToken);

    $days = (int)($_ENV["REFRESH_TTL_DAYS"] ?? 30);
    $expiresAt = (new \DateTimeImmutable("now", new \DateTimeZone("UTC")))
      ->modify("+{$days} days")
      ->format("Y-m-d H:i:sP");

    $this->sessions->create((int)$user["id"], $refreshHash, $expiresAt, $deviceLabel, $userAgent, $ip);

    return [
      "accessToken" => $accessToken,
      "refreshToken" => $refreshToken,
      "user" => [
        "id" => (int)$user["id"],
        "email" => (string)$user["email"],
        "display_name" => $user["display_name"],
      ],
    ];
  }
}