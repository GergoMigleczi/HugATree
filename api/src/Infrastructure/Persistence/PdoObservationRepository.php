<?php

namespace App\Infrastructure\Persistence;

use App\Application\Ports\ObservationRepository;
use PDO;

final class PdoObservationRepository implements ObservationRepository
{
    public function __construct(private PDO $pdo) {}

    public function insert(array $o): int
    {
        $sql = "
          INSERT INTO observations (
            tree_id, created_by_user_id,
            title, note_text, observed_at
          ) VALUES (
            :tree_id, :created_by_user_id,
            :title, :note_text, :observed_at
          )
          RETURNING id
        ";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            ':tree_id' => $o['tree_id'],
            ':created_by_user_id' => $o['created_by_user_id'],
            ':title' => $o['title'],
            ':note_text' => $o['note_text'],
            ':observed_at' => $o['observed_at'] ?? null,
        ]);

        return (int)$stmt->fetchColumn();
    }

    public function listByTreeId(int $treeId,
        array $approvalStatus = ['approved']): array
    {
        $sql = "
            SELECT
                o.id,
                o.title,
                o.note_text,
                o.observed_at,
                o.created_at,
                u.display_name AS author_name,
                (SELECT op.storage_key
                 FROM observation_photos op
                 WHERE op.observation_id = o.id
                 ORDER BY op.id ASC LIMIT 1) AS photo_key,
                o.approval_status
            FROM observations o
            LEFT JOIN users u ON u.id = o.created_by_user_id
            WHERE o.tree_id = :tree_id
            AND o.approval_status IN ('" . implode("', '", $approvalStatus) . "')
            ORDER BY o.created_at ASC
        ";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([':tree_id' => $treeId]);
        $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        return array_values(array_map(fn($r) => [
            'id'         => (int)$r['id'],
            'title'      => $r['title'],
            'noteText'   => $r['note_text'],
            'observedAt' => $r['observed_at'],
            'createdAt'  => $r['created_at'],
            'authorName' => $r['author_name'],
            'photoKey'   => $r['photo_key'],
            'approvalStatus' => $r['approval_status']
        ], $rows));
    }

    /**
     * Update a observation's approval status to 'approved'
     *
     * @param int $observationId
     * @return void
     */
    public function approveObservation(int $observationId): void {
        $sql = "UPDATE observations SET approval_status = 'approved' WHERE id = :observationId";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':observationId', $observationId, \PDO::PARAM_INT);
        $stmt->execute();
    }

    /**
     * Update all observation's approval status to 'approved' for a Tree
     *
     * @param int $treeId
     * @return void
     */
    public function approveObservationsForTree(int $treeId): void {
        $sql = "UPDATE observations SET approval_status = 'approved' WHERE tree_id = :treeId AND approval_status = 'pending'";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':treeId', $treeId, \PDO::PARAM_INT);
        $stmt->execute();
    }

    /**
     * Update a observation's approval status to 'rejected'
     *
     * @param int $observationId
     * @return void
     */
    public function rejectObservation(int $observationId): void {
        $sql = "UPDATE observations SET approval_status = 'rejected' WHERE id = :observationId";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':observationId', $observationId, \PDO::PARAM_INT);
        $stmt->execute();
    }
    /**
     * Update all observation's approval status to 'rejected' for a Tree
     *
     * @param int $treeId
     * @return void
     */
    public function rejectObservationsForTree(int $treeId): void {
        $sql = "UPDATE observations SET approval_status = 'rejected' WHERE tree_id = :treeId AND approval_status = 'pending'";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':treeId', $treeId, \PDO::PARAM_INT);
        $stmt->execute();
    }
}