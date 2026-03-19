<?php
declare(strict_types=1);

namespace App\Application\UseCase;

use App\Application\Ports\DbTransaction;
use App\Application\Ports\ObservationRepository;
use App\Application\Ports\TreeDetailHistoryRepository;

final class AddObservation
{
    public function __construct(
        private DbTransaction $tx,
        private ObservationRepository $observations,
        private TreeDetailHistoryRepository $treeDetails,
    ) {}

    /** @return array{observationId: int} */
    public function execute(int $treeId, int $userId, array $input): array
    {
        return $this->tx->run(function () use ($treeId, $userId, $input) {
            $observationId = $this->observations->insert([
                'tree_id'             => $treeId,
                'created_by_user_id'  => $userId,
                'title'               => $input['title'] ?? null,
                'note_text'           => $input['noteText'] ?? null,
                'observed_at'         => $input['observedAt'] ?? null,
            ]);

            if (isset($input['details']) && is_array($input['details'])) {
                $d = $input['details'];
                $this->treeDetails->insert([
                    'tree_id'            => $treeId,
                    'observation_id'     => $observationId,
                    'recorded_by_user_id'=> $userId,
                    'probable_age_years' => $d['probableAgeYears'] ?? null,
                    'age_basis'          => $d['ageBasis'] ?? null,
                    'height_m'           => $d['heightM'] ?? null,
                    'height_method'      => $d['heightMethod'] ?? null,
                    'trunk_diameter_cm'  => $d['trunkDiameterCm'] ?? null,
                    'diameter_height_cm' => $d['diameterHeightCm'] ?? null,
                    'diameter_method'    => $d['diameterMethod'] ?? null,
                    'canopy_diameter_m'  => $d['canopyDiameterM'] ?? null,
                    'canopy_density'     => $d['canopyDensity'] ?? null,
                    'recorded_at'        => null,
                ]);
            }

            return ['observationId' => $observationId];
        });
    }
}
