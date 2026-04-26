<?php
declare(strict_types=1);

namespace App\Application\UseCase;

use App\Application\Ports\ObservationRepository;
use App\Application\Ports\ObservationPhotoRepository;

final class RejectObservation
{
    private ObservationRepository $observationRepository;
    private ObservationPhotoRepository $observationPhotoRepository;

    public function __construct(ObservationRepository $observationRepository, ObservationPhotoRepository $observationPhotoRepository)
    {
        $this->observationRepository = $observationRepository;
        $this->observationPhotoRepository = $observationPhotoRepository;
    }

    /**
     * Reject an observation by its ID
     *
     * @param int $observationId
     * @return void
     */
    public function execute(int $observationId): void
    {
        // In future, you could add:
        // - Validation (does tree exist?)
        // - Authorization (is admin?)
        // - Domain rules (already approved?)

        $this->observationRepository->rejectObservation($observationId);
        $this->observationPhotoRepository->rejectPhotosForObservation($observationId);
    }
}