<?php
declare(strict_types=1);

namespace App\Application\UseCase;

use App\Application\Ports\UserRepository;

final class SetUserActive {
  public function __construct(private UserRepository $users) {}

  public function execute(int $targetId, int $requesterId, bool $active): void {
    if ($targetId === $requesterId) {
      throw new \RuntimeException("Cannot deactivate your own account", 400);
    }
    $user = $this->users->findById($targetId);
    if (!$user) {
      throw new \RuntimeException("User not found", 404);
    }
    $this->users->setActive($targetId, $active);
  }
}
