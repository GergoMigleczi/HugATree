<?php

namespace App\Application\Ports;

interface TreeDetailHistoryRepository
{
    public function insert(array $detail): int;

    /** Returns the most recent detail record for a tree, or null if none exists. */
    public function latestByTreeId(int $treeId): ?array;
}