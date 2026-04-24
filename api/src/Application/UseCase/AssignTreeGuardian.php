<?php
declare(strict_types=1);

namespace App\Application\UseCase;

use App\Application\Ports\TreeRepository;
use App\Application\Ports\UserRepository;
use App\Domain\UserRole;

final class AssignTreeGuardian {
  public function __construct(
    private TreeRepository $trees,
    private UserRepository $users
  ) {}

  public function execute(int $treeId, int $userId): void {
    $this->trees->findById($treeId) ?? throw new \RuntimeException("Tree not found", 404);
    $user = $this->users->findById($userId) ?? throw new \RuntimeException("User not found", 404);

    $this->trees->setGuardian($treeId, $userId);

    $currentRole = UserRole::tryFrom((string)($user['role'] ?? '')) ?? UserRole::USER;
    if ($currentRole !== UserRole::ADMIN) {
      $this->users->setRole($userId, UserRole::GUARDIAN);
    }
  }
}
