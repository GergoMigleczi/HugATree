<?php

namespace App\Infrastructure\Persistence;

use App\Application\Ports\TreeDetailHistoryRepository;
use PDO;

final class PdoTreeDetailHistoryRepository implements TreeDetailHistoryRepository
{
    public function __construct(private PDO $pdo) {}

    public function insert(array $d): int
    {
        $sql = "
          INSERT INTO tree_detail_history (
            tree_id, observation_id,
            probable_age_years, age_basis,
            height_m, height_method,
            trunk_diameter_cm, diameter_height_cm, diameter_method,
            canopy_diameter_m, canopy_density,
            recorded_by_user_id, recorded_at
          ) VALUES (
            :tree_id, :observation_id,
            :probable_age_years, :age_basis,
            :height_m, :height_method,
            :trunk_diameter_cm, :diameter_height_cm, :diameter_method,
            :canopy_diameter_m, :canopy_density,
            :recorded_by_user_id,
            COALESCE(:recorded_at::timestamptz, NOW())
          )
          RETURNING id
        ";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            ':tree_id' => $d['tree_id'],
            ':observation_id' => $d['observation_id'],
            ':probable_age_years' => $d['probable_age_years'],
            ':age_basis' => $d['age_basis'],
            ':height_m' => $d['height_m'],
            ':height_method' => $d['height_method'],
            ':trunk_diameter_cm' => $d['trunk_diameter_cm'],
            ':diameter_height_cm' => $d['diameter_height_cm'],
            ':diameter_method' => $d['diameter_method'],
            ':canopy_diameter_m' => $d['canopy_diameter_m'],
            ':canopy_density' => $d['canopy_density'],
            ':recorded_by_user_id' => $d['recorded_by_user_id'],
            ':recorded_at' => $d['recorded_at'],
        ]);

        return (int)$stmt->fetchColumn();
    }
}