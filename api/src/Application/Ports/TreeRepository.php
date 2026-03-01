<?php

namespace App\Application\Ports;

interface TreeRepository
{
    public function insert(array $tree): int;

    /**
     * Returns approved trees within a bounding box (map viewport).
     * Items should include species common name for display.
     *
     * @return array<int, array{
     *   id:int,
     *   speciesId:?int,
     *   speciesCommonName:?string,
     *   lat:float,
     *   lng:float
     * }>
     */
    public function findApprovedInBbox(
        float $minLat,
        float $minLng,
        float $maxLat,
        float $maxLng,
        int $limit
    ): array;
}