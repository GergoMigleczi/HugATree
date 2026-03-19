<?php

namespace App\Application\UseCase;

use App\Application\Ports\DbTransaction;
use App\Application\Ports\TreeRepository;
use App\Application\Ports\ObservationRepository;
use App\Application\Ports\TreeDetailHistoryRepository;
use App\Application\Ports\ObservationPhotoRepository;

final class CreateTree
{
    public function __construct(
        private DbTransaction $tx,
        private TreeRepository $trees,
        private ObservationRepository $observations,
        private TreeDetailHistoryRepository $treeDetails,
        private ObservationPhotoRepository $photos,
    ) {}

    /**
     * @param int $userId authenticated user id
     * @param array $input decoded JSON body
     * @return array{treeId:int, observationId:int}
     */
    public function execute(int $userId, array $input): array
    {
        $tree = $input['tree'] ?? null;
        $obs  = $input['observation'] ?? null;

        if (!is_array($tree) || !is_array($obs)) {
            throw new \InvalidArgumentException("Missing 'tree' or 'observation' object.");
        }

        // Minimal validation (expand later)
        foreach (['locationLat','locationLng'] as $k) {
            if (!isset($tree[$k]) || !is_numeric($tree[$k])) {
                throw new \InvalidArgumentException("tree.$k is required and must be a number.");
            }
        }

        return $this->tx->run(function () use ($userId, $tree, $obs) {
            $treeId = $this->trees->insert([
                'species_id' => $tree['speciesId'] ?? null,
                'planted_at' => $tree['plantedAt'] ?? null,
                'planted_by' => $tree['plantedBy'] ?? null,
                'location_lat' => (float)$tree['locationLat'],
                'location_lng' => (float)$tree['locationLng'],
                'address_text' => $tree['addressText'] ?? null,
                'created_by_user_id' => $userId,
            ]);

            $observationId = $this->observations->insert([
                'tree_id' => $treeId,
                'created_by_user_id' => $userId,
                'title' => $obs['title'] ?? null,
                'note_text' => $obs['noteText'] ?? null,
            ]);

            // Optional details -> tree_detail_history
            if (isset($obs['details']) && is_array($obs['details'])) {
                $d = $obs['details'];
                $this->treeDetails->insert([
                    'tree_id' => $treeId,
                    'observation_id' => $observationId,
                    'recorded_by_user_id' => $userId,
                    'probable_age_years' => $d['probableAgeYears'] ?? null,
                    'age_basis' => $d['ageBasis'] ?? null,
                    'height_m' => $d['heightM'] ?? null,
                    'height_method' => $d['heightMethod'] ?? null,
                    'trunk_diameter_cm' => $d['trunkDiameterCm'] ?? null,
                    'diameter_height_cm' => $d['diameterHeightCm'] ?? null,
                    'diameter_method' => $d['diameterMethod'] ?? null,
                    'canopy_diameter_m' => $d['canopyDiameterM'] ?? null,
                    'canopy_density' => $d['canopyDensity'] ?? null,
                ]);
            }

            // Optional photos -> observation_photos
            if (isset($obs['photos']) && is_array($obs['photos'])) {
                foreach ($obs['photos'] as $p) {
                    if (!is_array($p) || empty($p['storageKey'])) continue;
                    $this->photos->insert([
                        'observation_id' => $observationId,
                        'uploaded_by_user_id' => $userId,
                        'storage_key' => $p['storageKey'],
                    ]);
                }
            }

            return ['treeId' => $treeId, 'observationId' => $observationId];
        });
    }
}