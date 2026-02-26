<?php
declare(strict_types=1);

namespace App\Infrastructure\Persistence;

use App\Application\Ports\SpeciesRepository;
use PDO;

final class PdoSpeciesRepository implements SpeciesRepository
{
    public function __construct(private PDO $pdo) {}

    public function list(?string $q, int $limit, int $offset): array
    {
        $limit  = max(1, min(500, $limit));
        $offset = max(0, $offset);

        if ($q === null || trim($q) === '') {
            $stmt = $this->pdo->prepare(
                "SELECT id, common_name, scientific_name, gbif_taxon_key
                 FROM species
                 ORDER BY common_name ASC
                 LIMIT :limit OFFSET :offset"
            );
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();
        } else {
            $stmt = $this->pdo->prepare(
                "SELECT id, common_name, scientific_name, gbif_taxon_key
                 FROM species
                 WHERE common_name ILIKE :q OR scientific_name ILIKE :q
                 ORDER BY common_name ASC
                 LIMIT :limit OFFSET :offset"
            );
            $stmt->bindValue(':q', '%' . trim($q) . '%', PDO::PARAM_STR);
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();
        }

        /** @var array<int, array<string, mixed>> $rows */
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return array_map(static function (array $r): array {
            return [
                'id' => (int)$r['id'],
                'common_name' => (string)$r['common_name'],
                'scientific_name' => $r['scientific_name'] !== null ? (string)$r['scientific_name'] : null,
                'gbif_taxon_key' => $r['gbif_taxon_key'] !== null ? (int)$r['gbif_taxon_key'] : null,
            ];
        }, $rows);
    }
}