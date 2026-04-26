<?php
declare(strict_types=1);

namespace App\Application\UseCase;

use App\Application\Ports\ObservationRepository;

final class GetTreeObservations
{
    public function __construct(private ObservationRepository $observations) {}

    public function execute(int $treeId, array $query): array
    {
        
        $filter = [];
        if (isset($query['filter'])) {
            $filter = json_decode($query['filter'], true);
            if (!is_array($filter)) {
                throw new \InvalidArgumentException('filter must be a valid JSON object');
            }
        }
        $approvalStatus = [];
        if($filter && isset($filter['approvalStatus']) && is_array($filter['approvalStatus'])) {
            $allowedStatuses = ['approved', 'pending', 'rejected'];
            foreach ($filter['approvalStatus'] as $status) {
                if (in_array($status, $allowedStatuses, true)) {
                    $approvalStatus[] = $status;
                }
            }
        }
        return $this->observations->listByTreeId($treeId, $approvalStatus);
    }
}
