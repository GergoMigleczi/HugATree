<?php
declare(strict_types=1);

namespace App\Application\Ports;

use App\Domain\UserRole;

interface TokenService {
  public function issueAccessToken(int $userId, string $email, UserRole $role): string;
}