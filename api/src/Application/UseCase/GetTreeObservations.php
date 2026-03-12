<?php
declare(strict_types=1);

namespace App\Application\UseCase;

use App\Application\Ports\ObservationRepository;

final class GetTreeObservations
{
    public function __construct(private ObservationRepository $observations) {}

    public function execute(int $treeId): array
    {
        return $this->observations->listByTreeId($treeId);
    }
}
