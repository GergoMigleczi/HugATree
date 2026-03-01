<?php

namespace App\Application\Ports;

interface TreeRepository
{
    public function insert(array $tree): int;

    /**
     * Retrieves approved trees within a bounding box.
     *
     * Delegates to TreeRepository and returns:
     *  - items: limited result set
     *  - count: total number of matching rows (ignores limit)
     *  - limit: applied limit
     *
     * @return array{
     *   items: array<int, array{
     *     id:int,
     *     speciesId:?int,
     *     speciesCommonName:?string,
     *     lat:float,
     *     lng:float
     *   }>,
     *   count: int,
     *   limit: int
     * }
     */
    public function findApprovedInBbox(
        float $minLat,
        float $minLng,
        float $maxLat,
        float $maxLng,
        int $limit
    ): array;
}