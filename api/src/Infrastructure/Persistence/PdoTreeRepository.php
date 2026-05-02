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
            species_id, custom_species_name,
            planted_at, planted_by,
            location_lat, location_lng, address_text,
            created_by_user_id
          ) VALUES (
            :species_id, :custom_species_name,
            :planted_at, :planted_by,
            :location_lat, :location_lng, :address_text,
            :created_by_user_id
          )
          RETURNING id
        ";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            ':species_id' => $t['species_id'],
            ':custom_species_name' => $t['custom_species_name'] ?? null,
            ':planted_at' => $t['planted_at'],
            ':planted_by' => $t['planted_by'],
            ':location_lat' => $t['location_lat'],
            ':location_lng' => $t['location_lng'],
            ':address_text' => $t['address_text'],
            ':created_by_user_id' => $t['created_by_user_id'],
        ]);

        return (int)$stmt->fetchColumn();
    }

  /**
   * Finds approved trees inside a bounding box.
   *
   * Returns a limited set of matching trees together with the total number
   * of matches ignoring the limit.
   *
   * @param float $minLat Minimum latitude of bbox
   * @param float $minLng Minimum longitude of bbox
   * @param float $maxLat Maximum latitude of bbox
   * @param float $maxLng Maximum longitude of bbox
   * @param int   $limit  Maximum number of items to return
   *
   * @return array{
   *   items: array<int, array{
   *     id:int,
   *     speciesId:?int,
   *     speciesCommonName:?string,
   *     lat:float,
   *     lng:float
   *   }>,
   *   count: int,   // total number of matching rows (ignores limit)
   *   limit: int
   * }
   */
  public function findTreesInBbox(
  float $minLat,
  float $minLng,
  float $maxLat,
  float $maxLng,
  int $limit,
  array $approvalStatus = ['approved'],
  bool $includePending = false
  ): array {
      $limit = max(1, min(5000, $limit));

      // Shared envelope SQL so both queries are guaranteed to match.
      // MakeEnvelope expects (minX, minY, maxX, maxY) = (minLng, minLat, maxLng, maxLat)
      $envelopeSql = "ST_MakeEnvelope(:minLng, :minLat, :maxLng, :maxLat, 4326)";

      $whereSql = "
        t.location && $envelopeSql
        AND ST_Intersects(t.location, $envelopeSql)
      ";

      $pendingCondition = "
        (
          t.approval_status = 'pending'
          OR EXISTS (
            SELECT 1
            FROM observations o
            WHERE o.tree_id = t.id
              AND o.approval_status = 'pending'
          )
          OR EXISTS (
            SELECT 1
            FROM tree_detail_history tdh
            WHERE tdh.tree_id = t.id
              AND tdh.approval_status = 'pending'
          )
        )
      ";

      if ($includePending) {
        $whereSql .= "
          AND $pendingCondition
        ";
    } elseif ($approvalStatus !== []) {
        $whereSql .= "
          AND t.approval_status IN ('" . implode("', '", $approvalStatus) . "')
        ";
    }

      // 1) Total count (ignores limit)
      $countSql = "
        SELECT COUNT(*)::int AS total
        FROM trees t
        WHERE $whereSql
      ";

      $countStmt = $this->pdo->prepare($countSql);
      $countStmt->bindValue(':minLat', $minLat);
      $countStmt->bindValue(':minLng', $minLng);
      $countStmt->bindValue(':maxLat', $maxLat);
      $countStmt->bindValue(':maxLng', $maxLng);
      $countStmt->execute();

      $total = (int)$countStmt->fetchColumn();

      // 2) Items (limited)
      $itemsSql = "
        SELECT
          t.id,
          t.species_id,
          COALESCE(s.common_name, t.custom_species_name) AS species_common_name,
          t.location_lat,
          t.location_lng,
          t.approval_status
        FROM trees t
        LEFT JOIN species s ON s.id = t.species_id
        WHERE $whereSql
        ORDER BY t.id
        LIMIT :limit
      ";

      $itemsStmt = $this->pdo->prepare($itemsSql);
      $itemsStmt->bindValue(':minLat', $minLat);
      $itemsStmt->bindValue(':minLng', $minLng);
      $itemsStmt->bindValue(':maxLat', $maxLat);
      $itemsStmt->bindValue(':maxLng', $maxLng);
      $itemsStmt->bindValue(':limit', $limit, \PDO::PARAM_INT);
      $itemsStmt->execute();

      /** @var array<int, array<string, mixed>> $rows */
      $rows = $itemsStmt->fetchAll(\PDO::FETCH_ASSOC);

      $items = array_map(static function (array $r): array {
          return [
              'id' => (int)$r['id'],
              'speciesId' => $r['species_id'] !== null ? (int)$r['species_id'] : null,
              'speciesCommonName' => $r['species_common_name'] !== null ? (string)$r['species_common_name'] : null,
              'lat' => (float)$r['location_lat'],
              'lng' => (float)$r['location_lng'],
              'approvalStatus' => $r['approval_status'],
          ];
      }, $rows);

      return [
          'items' => $items,
          'count' => $total, // total matches in bbox (ignores limit)
          'limit' => $limit, // optional but useful client-side
      ];
  }

  /**
   * Get a Particular tree
   *
   * Returns a limited set of matching trees together with the total number
   * of matches ignoring the limit.
   * @param int   $treeId 
   *
   * @return array{
   *     id:int,
   *     speciesCommonName:?string,
   *     lat:float,
   *     lng:float,
   *     plantedAt: date,
   *     plantedBy: varchar,
   *     addressText: varchar,
   *     adoptedBy: varchar,
   *     approvalStatus: string,
   * }
   */
  public function getATree(
  int $treeId, $approvalStatus = ['approved']
  ): array {
      
    $sql = "
      SELECT
        t.id,
        COALESCE(s.common_name, t.custom_species_name) AS species_common_name,
        t.location_lat,
        t.location_lng,
        t.planted_at,
        t.planted_by,
        t.address_text,
        t.approval_status,
        (SELECT u.display_name FROM users u WHERE u.id = t.adopted_by_user_id) AS adopted_by
      FROM trees t
      LEFT JOIN species s ON s.id = t.species_id
      WHERE t.id = :treeId
      AND t.approval_status IN ('" . implode("', '", $approvalStatus) . "')
      ";
      
      $treeStmt = $this->pdo->prepare($sql);
      $treeStmt->bindValue(':treeId', $treeId, \PDO::PARAM_INT);
      $treeStmt->execute();

      $rows = $treeStmt->fetchAll(\PDO::FETCH_ASSOC);

      return [
        'id' => (int)$rows[0]['id'],
        'speciesCommonName' => $rows[0]['species_common_name'] !== null ? (string)$rows[0]['species_common_name'] : null,
        'lat' => (float)$rows[0]['location_lat'],
        'lng' => (float)$rows[0]['location_lng'],
        'plantedAt' => $rows[0]['planted_at'],
        'plantedBy' => $rows[0]['planted_by'],
        'addressText' => $rows[0]['address_text'],
        'adoptedBy' => $rows[0]['adopted_by'],
        'approvalStatus' => $rows[0]['approval_status']
      ];
  }

  /**
     * Update a tree's approval status to 'approved'
     *
     * @param int $treeId
     * @return void
     */
  public function approveTree(int $treeId): void {
    $sql = "UPDATE trees SET approval_status = 'approved' WHERE id = :treeId";
    $stmt = $this->pdo->prepare($sql);
    $stmt->bindValue(':treeId', $treeId, \PDO::PARAM_INT);
    $stmt->execute();
  }

  /**
     * Update a tree's approval status to 'rejected'
     *
     * @param int $treeId
     * @return void
     */
  public function rejectTree(int $treeId): void {
    $sql = "UPDATE trees SET approval_status = 'rejected' WHERE id = :treeId";
    $stmt = $this->pdo->prepare($sql);
    $stmt->bindValue(':treeId', $treeId, \PDO::PARAM_INT);
    $stmt->execute();
  }

}