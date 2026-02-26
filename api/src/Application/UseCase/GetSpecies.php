<?php
declare(strict_types=1);

namespace App\Application\UseCase;

use App\Application\Ports\SpeciesRepository;

final class GetSpecies
{
    public function __construct(private SpeciesRepository $speciesRepo) {}

    /** @return array<int, array{ id:int, common_name:string, scientific_name:?string, gbif_taxon_key:?int }> */
    public function execute(?string $q, int $limit, int $offset): array
    {
        return $this->speciesRepo->list($q, $limit, $offset);
    }
}