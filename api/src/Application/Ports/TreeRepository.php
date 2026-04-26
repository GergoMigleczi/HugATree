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
    public function findTreesInBbox(
        float $minLat,
        float $minLng,
        float $maxLat,
        float $maxLng,
        int $limit,
        array $approvalStatuses = ['approved']
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

    /**
     * Update a tree's approval status to 'approved'
     *
     * @param int $treeId
     * @return void
     */
    public function approveTree(int $treeId): void;

    /**
     * Update a tree's approval status to 'rejected'
     *
     * @param int $treeId
     * @return void
     */
    public function rejectTree(int $treeId): void;
}