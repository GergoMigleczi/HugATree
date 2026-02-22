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
}