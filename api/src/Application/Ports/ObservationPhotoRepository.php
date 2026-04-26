<?php

namespace App\Application\Ports;

interface ObservationPhotoRepository
{
    public function insert(array $photo): int;

    /**
     * Update all photos' approval status to 'approved' for a Tree
     *
     * @param int $treeId
     * @return void
     */
    public function approvePhotosForTree(int $treeId): void;

    /**
     * Update all photos' approval status to 'approved' for an observation
     *
     * @param int $observationId
     * @return void
     */
    public function approvePhotosForObservation(int $observationId): void;

    /**
     * Update all photos' approval status to 'rejected' for a Tree
     *
     * @param int $treeId
     * @return void
     */
    public function rejectPhotosForTree(int $treeId): void;

    /**
     * Update all photos' approval status to 'rejected' for an observation
     *
     * @param int $observationId
     * @return void
     */
    public function rejectPhotosForObservation(int $observationId): void;
}