<?php
declare(strict_types=1);

namespace App\Application\UseCase;

use App\Application\Ports\UserRepository;

final class GetUser {
  public function __construct(private UserRepository $users) {}

  public function execute(int $userId): array {
    $user = $this->users->findById($userId);
    if (!$user) {
      throw new \RuntimeException("User not found", 404);
    }
    return $user;
  }
}
