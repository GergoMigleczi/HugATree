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

    /**
   * Get a Particular tree
   *
   * Returns a limited set of matching trees together with the total number
   * of matches ignoring the limit.
   * @param int   $treeId 
   *
   * @return array{
   *     id:int,
   *     speciesCommonName:?string,
   *     lat:float,
   *     lng:float,
   *     plantedAt: date,
   *     plantedBy: varchar,
   *     addressText: varchar,
   *     adoptedBy: varchar,
   * }
   */
    public function getATree(int $treeId): ?array;
}
    public function setApprovalStatus(int $treeId, string $status): void;

    public function setGuardian(int $treeId, ?int $userId): void;
}
