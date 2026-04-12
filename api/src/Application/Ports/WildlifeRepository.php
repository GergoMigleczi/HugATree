<?php
declare(strict_types=1);

namespace App\Application\Ports;

interface WildlifeRepository
{
    public function insert(array $wildlife): int;

    /** @return list<array{id:int,wildlifeSpeciesId:?int,wildlifeSpeciesName:?string,lifeStage:?string,count:?int,evidenceType:?string,behaviour:?string,observationId:int,title:?string,noteText:?string,observedAt:?string,createdAt:string,authorName:?string,photoKey:?string}> */
    public function listByTreeId(int $treeId): array;
}
