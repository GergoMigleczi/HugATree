<?php
declare(strict_types=1);

namespace App\Application\UseCase;

use App\Application\Ports\WildlifeSpeciesRepository;

final class GetWildlifeSpecies
{
    public function __construct(private WildlifeSpeciesRepository $wildlifeSpecies) {}

    public function execute(): array
    {
        return ['items' => $this->wildlifeSpecies->list()];
    }
}
