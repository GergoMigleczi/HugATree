<?php
declare(strict_types=1);

namespace App\Application\Ports;

interface SpeciesRepository
{
    /**
     * @return array<int, array{
     *   id:int,
     *   common_name:string,
     *   scientific_name:?string,
     *   gbif_taxon_key:?int
     * }>
     */
    public function list(?string $q, int $limit, int $offset): array;
}