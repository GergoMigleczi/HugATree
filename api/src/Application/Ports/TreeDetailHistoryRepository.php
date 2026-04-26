<?php

namespace App\Application\Ports;

interface TreeDetailHistoryRepository
{
    public function insert(array $detail): int;

    /** Returns the most recent detail record for a tree, or null if none exists. */
    public function latestByTreeId(int $treeId): ?array;

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