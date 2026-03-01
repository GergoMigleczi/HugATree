<?php
declare(strict_types=1);

namespace App\Application\UseCase;

use App\Application\Ports\SpeciesRepository;

final class GetSpecies
{
    public function __construct(private SpeciesRepository $speciesRepo) {}

    /**
     * @return array{
     *   items: array<int, array{
     *     id:int,
     *     common_name:string,
     *     scientific_name:?string,
     *     gbif_taxon_key:?int
     *   }>,
     *   count: int,
     *   limit: int,
     *   offset: int,
     *   hasMore: bool
     * }
     */
    public function execute(?string $q, int $limit, int $offset): array
    {
        return $this->speciesRepo->list($q, $limit, $offset);
    }
}