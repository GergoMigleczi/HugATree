<?php
declare(strict_types=1);

namespace App\Application\UseCase;

use App\Application\Ports\SessionRepository;

final class LogoutSession {
  public function __construct(private SessionRepository $sessions) {}

  public function execute(string $refreshToken): void {
    if ($refreshToken === "") throw new \InvalidArgumentException("Missing refreshToken");
    $hash = Tokens::hash($refreshToken);
    $this->sessions->revokeByRefreshTokenHash($hash);
  }
}