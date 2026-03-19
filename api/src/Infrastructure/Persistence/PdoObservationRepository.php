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

    public function listByTreeId(int $treeId): array
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
                 ORDER BY op.id ASC LIMIT 1) AS photo_key
            FROM observations o
            LEFT JOIN users u ON u.id = o.created_by_user_id
            WHERE o.tree_id = :tree_id
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
        ], $rows));
    }
}