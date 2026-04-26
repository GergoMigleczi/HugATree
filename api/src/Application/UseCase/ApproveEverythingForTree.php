<?php
declare(strict_types=1);

namespace App\Application\UseCase;

use App\Application\Ports\TreeRepository;
use App\Application\Ports\ObservationRepository;
use App\Application\Ports\ObservationPhotoRepository;
use App\Application\Ports\TreeDetailsRepository;

final class ApproveEverythingForTree
{
    public function __construct(
        private TreeRepository $treeRepository,
        private ObservationRepository $observationRepository,
        private ObservationPhotoRepository $observationPhotoRepository,
        private TreeDetailsRepository $treeDetailsRepository,
    ) {}

    /**
     * Approve a tree and all its pending observations
     *
     * @param int $treeId
     * @return void
     */
    public function execute(int $treeId): void
    {
        // Optional (recommended later):
        // - Validate tree exists
        // - Wrap in transaction (important)

        // 1. Approve the tree itself
        $this->treeRepository->approveTree($treeId);

        // 2. Approve all pending observations for this tree
        $this->observationRepository->approveObservationsForTree($treeId);

        // 3. Approve all pending photos for this tree
        $this->observationPhotoRepository->approvePhotosForTree($treeId);
        
        // 4. Approve all pending tree detail records for this tree
        $this->treeDetailsRepository->approveTreeDetailsForTree($treeId);
    }
}