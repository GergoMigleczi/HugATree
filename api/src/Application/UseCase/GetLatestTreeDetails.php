<?php
declare(strict_types=1);

namespace App\Application\UseCase;

use App\Application\Ports\TreeDetailHistoryRepository;

final class GetLatestTreeDetails
{
    public function __construct(private TreeDetailHistoryRepository $treeDetails) {}

    public function execute(int $treeId): ?array
    {
        return $this->treeDetails->latestByTreeId($treeId);
    }
}
