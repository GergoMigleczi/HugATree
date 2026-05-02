<?php

namespace App\Infrastructure\Persistence;

use App\Application\Ports\ObservationPhotoRepository;
use PDO;

final class PdoObservationPhotoRepository implements ObservationPhotoRepository
{
    public function __construct(private PDO $pdo) {}

    public function insert(array $p): int
    {
        $sql = "
          INSERT INTO observation_photos (
            observation_id, uploaded_by_user_id, storage_key
          ) VALUES (
            :observation_id, :uploaded_by_user_id, :storage_key
          )
          RETURNING id
        ";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            ':observation_id' => $p['observation_id'],
            ':uploaded_by_user_id' => $p['uploaded_by_user_id'],
            ':storage_key' => $p['storage_key'],
        ]);

        return (int)$stmt->fetchColumn();
    }

    /**
     * List all photos for a Tree
     *
     * @param int $treeId
     * @param array $approvalStatus
     * @return array<>
     */
    public function listPhotosByTree(int $treeId,
        array $approvalStatus = ['approved']): array
    {
        $sql = "
            SELECT
                op.id,
                op.storage_key,
                op.approval_status,
                o.id AS observation_id,
                o.title AS observation_title,
                o.observed_at AS observation_observed_at
            FROM observation_photos op
            JOIN observations o ON o.id = op.observation_id
            WHERE o.tree_id = :tree_id
            AND op.approval_status IN ('" . implode("', '", $approvalStatus) . "')
            ORDER BY op.id ASC
        ";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([':tree_id' => $treeId]);
        return $stmt->fetchAll();
    }

    /**
     * Update all photos' approval status to 'approved' for a Tree
     *
     * @param int $treeId
     * @return void
     */
    public function approvePhotosForTree(int $treeId): void {
        $sql = "UPDATE observation_photos op
            SET approval_status = 'approved'
            WHERE observation_id
            IN (SELECT id FROM observations WHERE tree_id = :treeId)
            AND approval_status = 'pending'";

        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':treeId', $treeId, \PDO::PARAM_INT);
        $stmt->execute();
    }

    /**
     * Update all photos' approval status to 'approved' for an observation
     *
     * @param int $observationId
     * @return void
     */
    public function approvePhotosForObservation(int $observationId): void {
        $sql = "UPDATE observation_photos op
            SET approval_status = 'approved'
            WHERE observation_id = :observationId
            AND approval_status = 'pending'";

        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':observationId', $observationId, \PDO::PARAM_INT);
        $stmt->execute();
    }

    /**
     * Update all photos' approval status to 'rejected' for a Tree
     *
     * @param int $treeId
     * @return void
     */
    public function rejectPhotosForTree(int $treeId): void {
        $sql = "UPDATE observation_photos
        SET approval_status = 'rejected'
        WHERE observation_id
        IN (SELECT id FROM observations WHERE tree_id = :treeId)
        AND approval_status = 'pending'";

        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':treeId', $treeId, \PDO::PARAM_INT);
        $stmt->execute();
    }

    /**
     * Update all photos' approval status to 'rejected' for an observation
     *
     * @param int $observationId
     * @return void
     */
    public function rejectPhotosForObservation(int $observationId): void {
        $sql = "UPDATE observation_photos op
            SET approval_status = 'rejected'
            WHERE observation_id = :observationId
            AND approval_status = 'pending'";

        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':observationId', $observationId, \PDO::PARAM_INT);
        $stmt->execute();
    }
}