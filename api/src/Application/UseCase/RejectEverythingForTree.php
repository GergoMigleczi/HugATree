<?php
declare(strict_types=1);

namespace App\Application\UseCase;

use App\Application\Ports\TreeRepository;
use App\Application\Ports\ObservationRepository;
use App\Application\Ports\ObservationPhotoRepository;
use App\Application\Ports\TreeDetailHistoryRepository;

final class RejectEverythingForTree
{
    public function __construct(
        private TreeRepository $treeRepository,
        private ObservationRepository $observationRepository,
        private ObservationPhotoRepository $observationPhotoRepository, 
        private TreeDetailHistoryRepository $treeDetailHistoryRepository,
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

        // 3. Reject all pending photos for this tree
        $this->observationPhotoRepository->rejectPhotosForTree($treeId);
        
        // 4. Reject all pending tree detail records for this tree
        $this->treeDetailHistoryRepository->rejectTreeDetailsForTree($treeId);
    }
}