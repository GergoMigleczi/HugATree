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

        $q = $q !== null ? trim($q) : null;
        $hasQuery = $q !== null && $q !== '';

        // WHERE clause shared by both queries
        $whereSql = $hasQuery
            ? "WHERE common_name ILIKE :q OR scientific_name ILIKE :q"
            : "";

        // 1) Total count (ignores limit/offset)
        $countSql = "
            SELECT COUNT(*)::int AS total
            FROM species
            $whereSql
        ";

        $countStmt = $this->pdo->prepare($countSql);

        if ($hasQuery) {
            $countStmt->bindValue(':q', '%' . $q . '%', PDO::PARAM_STR);
        }

        $countStmt->execute();
        $total = (int)$countStmt->fetchColumn();

        // 2) Items (paged)
        $itemsSql = "
            SELECT id, common_name, scientific_name, gbif_taxon_key
            FROM species
            $whereSql
            ORDER BY common_name ASC
            LIMIT :limit OFFSET :offset
        ";

        $itemsStmt = $this->pdo->prepare($itemsSql);

        if ($hasQuery) {
            $itemsStmt->bindValue(':q', '%' . $q . '%', PDO::PARAM_STR);
        }

        $itemsStmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $itemsStmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $itemsStmt->execute();

        /** @var array<int, array<string, mixed>> $rows */
        $rows = $itemsStmt->fetchAll(PDO::FETCH_ASSOC);

        $items = array_map(static function (array $r): array {
            return [
                'id' => (int)$r['id'],
                'common_name' => (string)$r['common_name'],
                'scientific_name' => $r['scientific_name'] !== null ? (string)$r['scientific_name'] : null,
                'gbif_taxon_key' => $r['gbif_taxon_key'] !== null ? (int)$r['gbif_taxon_key'] : null,
            ];
        }, $rows);

        return [
            'items' => $items,
            'count' => $total,
            'limit' => $limit,
            'offset' => $offset,
            'hasMore' => ($offset + count($items)) < $total,
        ];
    }
}