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
            recorded_by_user_id, recorded_at,
            estimated_co2_stored_kg,
            estimated_co2_sequestered_year_kg,
            estimated_water_use_year_l,
            weather_period_start,
            weather_period_end,
            weather_source,
            calculation_method_version,
            calculated_at
          ) VALUES (
            :tree_id, :observation_id,
            :probable_age_years, :age_basis,
            :height_m, :height_method,
            :trunk_diameter_cm, :diameter_height_cm, :diameter_method,
            :canopy_diameter_m, :canopy_density,
            :recorded_by_user_id,
            COALESCE(:recorded_at::timestamptz, NOW()),
            :estimated_co2_stored_kg,
            :estimated_co2_sequestered_year_kg,
            :estimated_water_use_year_l,
            :weather_period_start,
            :weather_period_end,
            :weather_source,
            :calculation_method_version,
            COALESCE(:calculated_at::timestamptz, NOW())
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
            ':recorded_at' => $d['recorded_at'] ?? null,

            ':estimated_co2_stored_kg' => $d['estimated_co2_stored_kg'] ?? null,
            ':estimated_co2_sequestered_year_kg' => $d['estimated_co2_sequestered_year_kg'] ?? null,
            ':estimated_water_use_year_l' => $d['estimated_water_use_year_l'] ?? null,
            ':weather_period_start' => $d['weather_period_start'] ?? null,
            ':weather_period_end' => $d['weather_period_end'] ?? null,
            ':weather_source' => $d['weather_source'] ?? null,
            ':calculation_method_version' => $d['calculation_method_version'] ?? null,
            ':calculated_at' => $d['calculated_at'] ?? null,
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
                d.estimated_co2_stored_kg,
                d.estimated_co2_sequestered_year_kg,
                d.estimated_water_use_year_l,
                d.weather_period_start,
                d.weather_period_end,
                d.weather_source,
                d.calculation_method_version,
                d.calculated_at,
                u.display_name AS recorded_by_name
            FROM tree_detail_history d
            LEFT JOIN users u ON u.id = d.recorded_by_user_id
            WHERE d.tree_id = :tree_id
            AND d.approval_status = 'approved'
            ORDER BY d.recorded_at DESC, d.id DESC
            LIMIT 1
        ";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([':tree_id' => $treeId]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$row) return null;

        return [
            'id' => (int)$row['id'],
            'observationId' => $row['observation_id'] !== null ? (int)$row['observation_id'] : null,
            'probableAgeYears' => $row['probable_age_years'] !== null ? (int)$row['probable_age_years'] : null,
            'ageBasis' => $row['age_basis'],
            'heightM' => $row['height_m'] !== null ? (float)$row['height_m'] : null,
            'heightMethod' => $row['height_method'],
            'trunkDiameterCm' => $row['trunk_diameter_cm'] !== null ? (float)$row['trunk_diameter_cm'] : null,
            'diameterHeightCm' => $row['diameter_height_cm'] !== null ? (float)$row['diameter_height_cm'] : null,
            'diameterMethod' => $row['diameter_method'],
            'canopyDiameterM' => $row['canopy_diameter_m'] !== null ? (float)$row['canopy_diameter_m'] : null,
            'canopyDensity' => $row['canopy_density'],
            'recordedAt' => $row['recorded_at'],
            'recordedByName' => $row['recorded_by_name'],

            'estimatedCo2StoredKg' => $row['estimated_co2_stored_kg'] !== null ? (float)$row['estimated_co2_stored_kg'] : null,
            'estimatedCo2SequesteredYearKg' => $row['estimated_co2_sequestered_year_kg'] !== null ? (float)$row['estimated_co2_sequestered_year_kg'] : null,
            'estimatedWaterUseYearL' => $row['estimated_water_use_year_l'] !== null ? (float)$row['estimated_water_use_year_l'] : null,
            'weatherPeriodStart' => $row['weather_period_start'],
            'weatherPeriodEnd' => $row['weather_period_end'],
            'weatherSource' => $row['weather_source'],
            'calculationMethodVersion' => $row['calculation_method_version'],
            'calculatedAt' => $row['calculated_at'],
        ];
    }

    public function listByTreeId(int $treeId,
        array $approvalStatus = ['approved']): array
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
                d.estimated_co2_stored_kg,
                d.estimated_co2_sequestered_year_kg,
                d.estimated_water_use_year_l,
                d.weather_period_start,
                d.weather_period_end,
                d.weather_source,
                d.calculation_method_version,
                d.calculated_at,
                u.display_name AS recorded_by_name,
                d.approval_status                
            FROM tree_detail_history d
            LEFT JOIN users u ON u.id = d.recorded_by_user_id
            WHERE d.tree_id = :tree_id
            and d.approval_status IN ('" . implode("', '", $approvalStatus) . "')
            ORDER BY d.recorded_at DESC, d.id DESC
        ";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([':tree_id' => $treeId]);

        /** @var array<int, array<string, mixed>> $rows */
        $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        if (!$rows) return [];

        return array_map(static function (array $r): array {
            return [
                'id' => (int)$r['id'],
                'observationId' => $r['observation_id'] !== null ? (int)$r['observation_id'] : null,
                'probableAgeYears' => $r['probable_age_years'] !== null ? (int)$r['probable_age_years'] : null,
                'ageBasis' => $r['age_basis'],
                'heightM' => $r['height_m'] !== null ? (float)$r['height_m'] : null,
                'heightMethod' => $r['height_method'],
                'trunkDiameterCm' => $r['trunk_diameter_cm'] !== null ? (float)$r['trunk_diameter_cm'] : null,
                'diameterHeightCm' => $r['diameter_height_cm'] !== null ? (float)$r['diameter_height_cm'] : null,
                'diameterMethod' => $r['diameter_method'],
                'canopyDiameterM' => $r['canopy_diameter_m'] !== null ? (float)$r['canopy_diameter_m'] : null,
                'canopyDensity' => $r['canopy_density'],
                'recordedAt' => $r['recorded_at'],
                'recordedByName' => $r['recorded_by_name'],

                'estimatedCo2StoredKg' => $r['estimated_co2_stored_kg'] !== null ? (float)$r['estimated_co2_stored_kg'] : null,
                'estimatedCo2SequesteredYearKg' => $r['estimated_co2_sequestered_year_kg'] !== null ? (float)$r['estimated_co2_sequestered_year_kg'] : null,
                'estimatedWaterUseYearL' => $r['estimated_water_use_year_l'] !== null ? (float)$r['estimated_water_use_year_l'] : null,
                'weatherPeriodStart' => $r['weather_period_start'],
                'weatherPeriodEnd' => $r['weather_period_end'],
                'weatherSource' => $r['weather_source'],
                'calculationMethodVersion' => $r['calculation_method_version'],
                'calculatedAt' => $r['calculated_at'],
                'approvalStatus' => $r['approval_status']
            ];
        }, $rows);
    }

    /**
     * Update a treeDetail's approval status to 'approved'
     *
     * @param int $treeDetailId
     * @return void
     */
    public function approveTreeDetail(int $treeDetailId): void {
        $sql = "UPDATE tree_detail_history SET approval_status = 'approved' WHERE id = :treeDetailId";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':treeDetailId', $treeDetailId, \PDO::PARAM_INT);
        $stmt->execute();
    }

    /**
     * Update all treeDetails' approval status to 'approved' for a Tree
     *
     * @param int $treeId
     * @return void
     */
    public function approveTreeDetailsForTree(int $treeId): void {
        $sql = "UPDATE tree_detail_history SET approval_status = 'approved' WHERE tree_id = :treeId AND approval_status = 'pending'";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':treeId', $treeId, \PDO::PARAM_INT);
        $stmt->execute();
    }

    /**
     * Update a treeDetail's approval status to 'rejected'
     *
     * @param int $treeDetailId
     * @return void
     */
    public function rejectTreeDetail(int $treeDetailId): void {
        $sql = "UPDATE tree_detail_history SET approval_status = 'rejected' WHERE id = :treeDetailId";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':treeDetailId', $treeDetailId, \PDO::PARAM_INT);
        $stmt->execute();
    }

    /**
     * Update all treeDetails' approval status to 'rejected' for a Tree
     *
     * @param int $treeId
     * @return void
     */
    public function rejectTreeDetailsForTree(int $treeId): void {
        $sql = "UPDATE tree_detail_history SET approval_status = 'rejected' WHERE tree_id = :treeId AND approval_status = 'pending'";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':treeId', $treeId, \PDO::PARAM_INT);
        $stmt->execute();
    }
}