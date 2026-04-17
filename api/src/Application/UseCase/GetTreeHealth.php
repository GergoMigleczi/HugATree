<?php
declare(strict_types=1);

namespace App\Application\UseCase;

use App\Application\Ports\HealthRepository;

final class GetTreeHealth
{
    public function __construct(private HealthRepository $health) {}

    public function execute(int $treeId): array
    {
        return $this->health->listByTreeId($treeId);
    }
}
