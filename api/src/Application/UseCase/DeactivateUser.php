<?php
declare(strict_types=1);

namespace App\Application\UseCase;

use App\Application\Ports\UserRepository;

final class DeactivateUser {
  public function __construct(private UserRepository $users) {}

  public function execute(int $targetId, int $requesterId): void {
    if ($targetId === $requesterId) {
      throw new \RuntimeException("Cannot deactivate your own account", 422);
    }

    $user = $this->users->findById($targetId);
    if (!$user) {
      throw new \RuntimeException("User not found", 404);
    }

    $this->users->setActive($targetId, false);
  }
}
