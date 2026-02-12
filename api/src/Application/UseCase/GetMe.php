<?php
declare(strict_types=1);

namespace App\Application\UseCase;

use App\Application\Ports\UserRepository;

final class GetMe {
  public function __construct(private UserRepository $users) {}

  public function execute(int $userId): array {
    $user = $this->users->findById($userId);
    if (!$user) throw new \RuntimeException("Not found", 404);
    return $user;
  }
}