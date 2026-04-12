<?php
declare(strict_types=1);

namespace App\Application\UseCase;

use App\Application\Ports\DbTransaction;
use App\Application\Ports\HealthRepository;

final class CreateHealth
{
    public function __construct(
        private DbTransaction $tx,
        private AddObservation $addObservation,
        private HealthRepository $health,
    ) {}

    /** @return array{healthId:int, observationId:int} */
    public function execute(int $treeId, int $userId, array $input): array
    {
        return $this->tx->run(function () use ($treeId, $userId, $input) {
            $obs = $input['observation'] ?? [];
            if (!is_array($obs)) {
                throw new \InvalidArgumentException("'observation' must be an object.");
            }

            $observationResult = $this->addObservation->executeInsideTransaction($treeId, $userId, $obs);
            $observationId = $observationResult['observationId'];

            $healthId = $this->health->insertHealth([
                'tree_id'        => $treeId,
                'observation_id' => $observationId,
                'health_status'  => $input['healthStatus'] ?? null,
                'risk_level'     => $input['riskLevel'] ?? null,
            ]);

            foreach ($input['issues'] ?? [] as $issue) {
                if (!is_array($issue)) continue;
                $this->health->insertIssue([
                    'tree_health_history_id' => $healthId,
                    'issue_type'             => $issue['issueType'] ?? null,
                    'issue_name'             => $issue['issueName'] ?? null,
                    'affected_part'          => $issue['affectedPart'] ?? null,
                    'severity'               => $issue['severity'] ?? null,
                ]);
            }

            return ['healthId' => $healthId, 'observationId' => $observationId];
        });
    }
}
