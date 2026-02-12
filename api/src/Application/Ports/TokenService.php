<?php
declare(strict_types=1);

namespace App\Application\Ports;

interface TokenService {
  public function issueAccessToken(int $userId, string $email): string;
}