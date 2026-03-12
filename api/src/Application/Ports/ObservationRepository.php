<?php

namespace App\Application\Ports;

interface ObservationRepository
{
    public function insert(array $observation): int;

    /** @return list<array{id:int,title:?string,noteText:?string,observedAt:?string,createdAt:string,authorName:?string,photoKey:?string}> */
    public function listByTreeId(int $treeId): array;
}