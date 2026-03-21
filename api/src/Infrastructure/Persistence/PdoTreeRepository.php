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
  public function findApprovedInBbox(
  float $minLat,
  float $minLng,
  float $maxLat,
  float $maxLng,
  int $limit
  ): array {
      $limit = max(1, min(5000, $limit));

      // Shared envelope SQL so both queries are guaranteed to match.
      // MakeEnvelope expects (minX, minY, maxX, maxY) = (minLng, minLat, maxLng, maxLat)
      $envelopeSql = "ST_MakeEnvelope(:minLng, :minLat, :maxLng, :maxLat, 4326)";

      // 1) Total count (ignores limit)
      $countSql = "
        SELECT COUNT(*)::int AS total
        FROM trees t
        WHERE /*t.approval_status = 'approved'
          AND*/ t.location && $envelopeSql
          AND ST_Intersects(t.location, $envelopeSql)
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
          s.common_name AS species_common_name,
          t.location_lat,
          t.location_lng
        FROM trees t
        LEFT JOIN species s ON s.id = t.species_id
        WHERE /*t.approval_status = 'approved'
          AND*/ t.location && $envelopeSql
          AND ST_Intersects(t.location, $envelopeSql)
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
   * }
   */
  public function getATree(
  int $treeId
  ): array {
      
    $sql = "
      SELECT
        t.id,
        s.common_name AS species_common_name,
        t.location_lat,
        t.location_lng,
        t.planted_at,
        t.planted_by,
        t.address_text,
        (SELECT u.display_name FROM users u WHERE u.id = t.adopted_by_user_id) AS adopted_by
      FROM trees t
      LEFT JOIN species s ON s.id = t.species_id
      WHERE t.id = :treeId
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
        'adoptedBy' => $rows[0]['adopted_by']
      ];
  }

}