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

    public function findApprovedInBbox(
    float $minLat,
    float $minLng,
    float $maxLat,
    float $maxLng,
    int $limit
    ): array {
        // Use envelope in SRID 4326. Note: MakeEnvelope expects (minX, minY, maxX, maxY) = (minLng, minLat, maxLng, maxLat)
        $sql = "
          SELECT
            t.id,
            t.species_id,
            s.common_name AS species_common_name,
            t.location_lat,
            t.location_lng
          FROM trees t
          LEFT JOIN species s ON s.id = t.species_id
          WHERE t.approval_status = 'approved'
            AND t.location && ST_MakeEnvelope(:minLng, :minLat, :maxLng, :maxLat, 4326)
            AND ST_Intersects(t.location, ST_MakeEnvelope(:minLng, :minLat, :maxLng, :maxLat, 4326))
          ORDER BY t.id
          LIMIT :limit
        ";

        $stmt = $this->pdo->prepare($sql);

        // IMPORTANT: bindValue for LIMIT so it stays an integer
        $stmt->bindValue(':minLat', $minLat);
        $stmt->bindValue(':minLng', $minLng);
        $stmt->bindValue(':maxLat', $maxLat);
        $stmt->bindValue(':maxLng', $maxLng);
        $stmt->bindValue(':limit', $limit, \PDO::PARAM_INT);

        $stmt->execute();

        $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        // Map to the response-friendly keys we agreed
        return array_map(static function (array $r): array {
            return [
                'id' => (int)$r['id'],
                'speciesId' => $r['species_id'] !== null ? (int)$r['species_id'] : null,
                'speciesCommonName' => $r['species_common_name'],
                'lat' => (float)$r['location_lat'],
                'lng' => (float)$r['location_lng'],
            ];
        }, $rows);
    }
}