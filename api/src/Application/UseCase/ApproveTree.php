<?php
declare(strict_types=1);

namespace App\Application\UseCase;

use App\Application\Ports\TreeRepository;

final class ApproveTree
{
    private TreeRepository $treeRepository;

    public function __construct(TreeRepository $treeRepository)
    {
        $this->treeRepository = $treeRepository;
    }

    /**
     * Approve a tree by its ID
     *
     * @param int $treeId
     * @return void
     */
    public function execute(int $treeId): void
    {
        // In future, you could add:
        // - Validation (does tree exist?)
        // - Authorization (is admin?)
        // - Domain rules (already approved?)

        $this->treeRepository->approveTree($treeId);
    }
}