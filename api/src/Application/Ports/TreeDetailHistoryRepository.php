<?php

namespace App\Application\Ports;

interface TreeDetailHistoryRepository
{
    public function insert(array $detail): int;

    /** Returns the most recent detail record for a tree, or null if none exists. */
    public function latestByTreeId(int $treeId): ?array;

    /**
     * Returns all detail records for a tree, optionally filtered by approval status (defaulting to 'approved').
      * The records are ordered by recorded_at DESC, then id DESC.
      * @param int $treeId
      * @param array $approvalStatus
      * @return array
     */
    public function listByTreeId(int $treeId, array $approvalStatus = ['approved']): array;

    /**
     * Update a treeDetail's approval status to 'approved'
     *
     * @param int $treeDetailId
     * @return void
     */
    public function approveTreeDetail(int $treeDetailId): void;

    /**
     * Update all treeDetails' approval status to 'approved' for a Tree
     *
     * @param int $treeId
     * @return void
     */
    public function approveTreeDetailsForTree(int $treeId): void;

    /**
     * Update a treeDetail's approval status to 'rejected'
     *
     * @param int $treeDetailId
     * @return void
     */
    public function rejectTreeDetail(int $treeDetailId): void;

    /**
     * Update all treeDetails' approval status to 'rejected' for a Tree
     *
     * @param int $treeId
     * @return void
     */
    public function rejectTreeDetailsForTree(int $treeId): void;
}