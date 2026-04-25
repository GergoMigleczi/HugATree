<?php
declare(strict_types=1);

namespace App\Application\UseCase;

use App\Application\Ports\TreeRepository;
use App\Application\Ports\ObservationRepository;

final class RejectEverythingForTree
{
    public function __construct(
        private TreeRepository $treeRepository,
        private ObservationRepository $observationRepository,
    ) {}

    /**
     * Reject a tree and all its pending observations
     *
     * @param int $treeId
     * @return void
     */
    public function execute(int $treeId): void
    {
        // Optional (recommended later):
        // - Validate tree exists
        // - Wrap in transaction (important)

        // 1. Reject the tree itself
        $this->treeRepository->rejectTree($treeId);

        // 2. Reject all pending observations for this tree
        $this->observationRepository->rejectObservationsForTree($treeId);
        
        // 3. Reject all pending health records for this tree
    }
}