<?php

namespace App\Infrastructure\Persistence;

use App\Application\Ports\TreeRepository;
use PDO;

final class PdoTreeRepository implements TreeRepository
{
    public function __construct(private PDO $pdo) {}

    public function insert(array $t): int
    {
        $sql = "
          INSERT INTO trees (
            species_id, planted_at, planted_by,
            location_lat, location_lng, address_text,
            created_by_user_id
          ) VALUES (
            :species_id, :planted_at, :planted_by,
            :location_lat, :location_lng, :address_text,
            :created_by_user_id
          )
          RETURNING id
        ";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            ':species_id' => $t['species_id'],
            ':planted_at' => $t['planted_at'],
            ':planted_by' => $t['planted_by'],
            ':location_lat' => $t['location_lat'],
            ':location_lng' => $t['location_lng'],
            ':address_text' => $t['address_text'],
            ':created_by_user_id' => $t['created_by_user_id'],
        ]);

        return (int)$stmt->fetchColumn();
    }
}