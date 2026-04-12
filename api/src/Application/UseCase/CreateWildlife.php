<?php
declare(strict_types=1);

namespace App\Application\UseCase;

use App\Application\Ports\DbTransaction;
use App\Application\Ports\WildlifeRepository;

final class CreateWildlife
{
    public function __construct(
        private DbTransaction $tx,
        private AddObservation $addObservation,
        private WildlifeRepository $wildlife,
    ) {}

    /** @return array{wildlifeId:int, observationId:int} */
    public function execute(int $treeId, int $userId, array $input): array
    {
        return $this->tx->run(function () use ($treeId, $userId, $input) {
            $obs = $input['observation'] ?? [];
            if (!is_array($obs)) {
                throw new \InvalidArgumentException("'observation' must be an object.");
            }

            $observationResult = $this->addObservation->executeInsideTransaction($treeId, $userId, $obs);
            $observationId = $observationResult['observationId'];

            $wildlifeId = $this->wildlife->insert([
                'tree_id'             => $treeId,
                'observation_id'      => $observationId,
                'wildlife_species_id' => isset($input['wildlifeSpeciesId']) ? (int)$input['wildlifeSpeciesId'] : null,
                'life_stage'          => $input['lifeStage'] ?? null,
                'count'               => isset($input['count']) ? (int)$input['count'] : null,
                'evidence_type'       => $input['evidenceType'] ?? null,
                'behaviour'           => $input['behaviour'] ?? null,
            ]);

            return ['wildlifeId' => $wildlifeId, 'observationId' => $observationId];
        });
    }
}
