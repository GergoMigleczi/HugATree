<?php
declare(strict_types=1);

namespace App\Application\UseCase;

use App\Application\Ports\UserRepository;

final class DeactivateUser {
  public function __construct(private UserRepository $users) {}

  public function execute(int $userId): void {
    $this->users->findById($userId) ?? throw new \RuntimeException("User not found", 404);
    $this->users->setActive($userId, false);
  }
}
