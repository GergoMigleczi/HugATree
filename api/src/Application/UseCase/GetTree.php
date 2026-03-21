<?php
declare(strict_types=1);

namespace App\Application\UseCase;

use App\Application\Ports\TreeDetailHistoryRepository;
use App\Application\Ports\TreeRepository;

final class GetTree
{
    public function __construct(private TreeRepository $treeRepository,
    private TreeDetailHistoryRepository $treeDetailHistoryRepository) {}

    public function execute(int $treeId): ?array
    {
        $tree = $this->treeRepository->getATree($treeId);
        if (!$tree) {
            return null;
        }

        $latestHistory = $this->treeDetailHistoryRepository->latestByTreeId($treeId);

        return [
            'tree' => $tree,
            'latestHistory' => $latestHistory
        ];
    }
}
