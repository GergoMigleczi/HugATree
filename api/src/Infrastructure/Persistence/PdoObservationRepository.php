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
            ':observed_at' => $o['observed_at'],
        ]);

        return (int)$stmt->fetchColumn();
    }
}