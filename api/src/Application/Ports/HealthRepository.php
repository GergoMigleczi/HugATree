<?php
declare(strict_types=1);

namespace App\Application\Ports;

interface HealthRepository
{
    public function insertHealth(array $health): int;

    public function insertIssue(array $issue): void;

    /** @return list<array{id:int,healthStatus:?string,riskLevel:?string,issues:list<array{issueType:?string,issueName:?string,affectedPart:?string,severity:?string}>,observationId:int,title:?string,noteText:?string,observedAt:?string,createdAt:string,authorName:?string,photoKey:?string}> */
    public function listByTreeId(int $treeId): array;
}
