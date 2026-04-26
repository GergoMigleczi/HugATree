<?php
declare(strict_types=1);

namespace App\Application\UseCase;

use App\Application\Ports\TreeDetailHistoryRepository;

final class RejectTreeDetail
{
    private TreeDetailHistoryRepository $treeDetailHistoryRepository;

    public function __construct(TreeDetailHistoryRepository $treeDetailHistoryRepository)
    {
        $this->treeDetailHistoryRepository = $treeDetailHistoryRepository;
    }

    /**
     * Reject a tree detail by its ID
     *
     * @param int $treeDetailId
     * @return void
     */
    public function execute(int $treeDetailId): void
    {
        // In future, you could add:
        // - Validation (does tree exist?)
        // - Authorization (is admin?)
        // - Domain rules (already approved?)

        $this->treeDetailHistoryRepository->rejectTreeDetail($treeDetailId);
    }
}