<?php
declare(strict_types=1);

namespace App\Application\UseCase;

use App\Application\Ports\TreeDetailHistoryRepository;
use App\Application\Ports\TreeRepository;
use App\Application\Ports\ObservationPhotoRepository;

final class GetTree
{
    public function __construct(private TreeRepository $treeRepository,
    private TreeDetailHistoryRepository $treeDetailHistoryRepository,
    private ObservationPhotoRepository $observationPhotoRepository) {}

    public function execute(int $treeId): ?array
    {
        $tree = $this->treeRepository->getATree($treeId);
        if (!$tree) {
            return null;
        }

        $latestHistory = $this->treeDetailHistoryRepository->latestByTreeId($treeId);
        $photos = $this->observationPhotoRepository->listPhotosByTree($treeId, ['approved']);

        return [
            'tree' => $tree,
            'latestHistory' => $latestHistory,
            'photos' => $photos
        ];
    }
}
