<?php

namespace App\Application\Ports;

interface ObservationRepository
{
    public function insert(array $observation): int;

    /** @return list<array{id:int,title:?string,noteText:?string,observedAt:?string,createdAt:string,authorName:?string,photoKey:?string}> */
    public function listByTreeId(int $treeId): array;

    /**
     * Update a observation's approval status to 'approved'
     *
     * @param int $observationId
     * @return void
     */
    public function approveObservation(int $observationId): void;

    /**
     * Update all observation's approval status to 'approved' for a Tree
     *
     * @param int $treeId
     * @return void
     */
    public function approveObservationsForTree(int $treeId): void;

    /**
     * Update a observation's approval status to 'rejected'
     *
     * @param int $observationId
     * @return void
     */
    public function rejectObservation(int $observationId): void;

    /**
     * Update all observation's approval status to 'rejected' for a Tree
     *
     * @param int $treeId
     * @return void
     */
    public function rejectObservationsForTree(int $treeId): void;

    
}