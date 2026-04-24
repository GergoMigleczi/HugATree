<?php
declare(strict_types=1);

namespace App\Application\UseCase;

use App\Application\Ports\TreeRepository;

final class SetTreeApprovalStatus {
  public function __construct(private TreeRepository $trees) {}

  public function execute(int $treeId, string $status): void {
    if (!in_array($status, ['pending', 'approved', 'rejected'], true)) {
      throw new \InvalidArgumentException("Invalid status");
    }

    $this->trees->findById($treeId) ?? throw new \RuntimeException("Tree not found", 404);

    $this->trees->setApprovalStatus($treeId, $status);
  }
}
