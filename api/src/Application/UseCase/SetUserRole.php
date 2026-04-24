<?php
declare(strict_types=1);

namespace App\Application\UseCase;

use App\Application\Ports\UserRepository;
use App\Domain\UserRole;

final class SetUserRole {
  public function __construct(private UserRepository $users) {}

  public function execute(int $userId, string $role): void {
    $parsed = UserRole::tryFrom($role);
    if (!$parsed) {
      throw new \InvalidArgumentException("Invalid role");
    }

    // Ensure user exists
    $this->users->findById($userId) ?? throw new \RuntimeException("User not found", 404);
    $this->users->setRole($userId, $parsed);
  }
}
