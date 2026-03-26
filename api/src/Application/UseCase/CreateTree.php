<?php

namespace App\Application\UseCase;

use App\Application\Ports\DbTransaction;
use App\Application\Ports\TreeRepository;
use App\Application\Ports\ObservationPhotoRepository;

final class CreateTree
{
    public function __construct(
        private DbTransaction $tx,
        private TreeRepository $trees,
        private AddObservation $addObservation,
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

        foreach (['locationLat', 'locationLng'] as $k) {
            if (!isset($tree[$k]) || !is_numeric($tree[$k])) {
                throw new \InvalidArgumentException("tree.$k is required and must be a number.");
            }
        }

        return $this->tx->run(function () use ($userId, $tree, $obs) {
            $treeId = $this->trees->insert([
                'species_id' => $tree['speciesId'] ?? null,
                'custom_species_name' => $tree['customSpeciesName'] ?? null,
                'planted_at' => $tree['plantedAt'] ?? null,
                'planted_by' => $tree['plantedBy'] ?? null,
                'location_lat' => (float)$tree['locationLat'],
                'location_lng' => (float)$tree['locationLng'],
                'address_text' => $tree['addressText'] ?? null,
                'created_by_user_id' => $userId,
            ]);

            $observationResult = $this->addObservation->executeInsideTransaction($treeId, $userId, $obs);
            $observationId = $observationResult['observationId'];

            foreach ($obs['photoKeys'] ?? [] as $storageKey) {
                $this->photos->insert([
                    'observation_id'      => $observationId,
                    'uploaded_by_user_id' => $userId,
                    'storage_key'         => (string) $storageKey,
                ]);
            }

            return [
                'treeId' => $treeId,
                'observationId' => $observationId,
            ];
        });
    }
}