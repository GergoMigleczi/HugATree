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

    public function latestByTreeId(int $treeId): ?array
    {
        $sql = "
            SELECT
                d.id,
                d.observation_id,
                d.probable_age_years,
                d.age_basis,
                d.height_m,
                d.height_method,
                d.trunk_diameter_cm,
                d.diameter_height_cm,
                d.diameter_method,
                d.canopy_diameter_m,
                d.canopy_density,
                d.recorded_at,
                u.display_name AS recorded_by_name
            FROM tree_detail_history d
            LEFT JOIN users u ON u.id = d.recorded_by_user_id
            WHERE d.tree_id = :tree_id
            ORDER BY d.recorded_at DESC, d.id DESC
            LIMIT 1
        ";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([':tree_id' => $treeId]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$row) return null;

        return [
            'id'               => (int)$row['id'],
            'observationId'    => (int)$row['observation_id'],
            'probableAgeYears' => $row['probable_age_years'] !== null ? (int)$row['probable_age_years'] : null,
            'ageBasis'         => $row['age_basis'],
            'heightM'          => $row['height_m'] !== null ? (float)$row['height_m'] : null,
            'heightMethod'     => $row['height_method'],
            'trunkDiameterCm'  => $row['trunk_diameter_cm'] !== null ? (float)$row['trunk_diameter_cm'] : null,
            'diameterHeightCm' => $row['diameter_height_cm'] !== null ? (float)$row['diameter_height_cm'] : null,
            'diameterMethod'   => $row['diameter_method'],
            'canopyDiameterM'  => $row['canopy_diameter_m'] !== null ? (float)$row['canopy_diameter_m'] : null,
            'canopyDensity'    => $row['canopy_density'],
            'recordedAt'       => $row['recorded_at'],
            'recordedByName'   => $row['recorded_by_name'],
        ];
    }
}