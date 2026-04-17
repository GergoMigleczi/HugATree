<?php
declare(strict_types=1);

namespace App\Application\UseCase;

use App\Application\Ports\WildlifeRepository;

final class GetTreeWildlife
{
    public function __construct(private WildlifeRepository $wildlife) {}

    public function execute(int $treeId): array
    {
        return $this->wildlife->listByTreeId($treeId);
    }
}
