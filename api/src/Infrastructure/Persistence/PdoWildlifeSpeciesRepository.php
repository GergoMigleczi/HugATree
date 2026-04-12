<?php
declare(strict_types=1);

namespace App\Infrastructure\Persistence;

use App\Application\Ports\WildlifeSpeciesRepository;
use PDO;

final class PdoWildlifeSpeciesRepository implements WildlifeSpeciesRepository
{
    public function __construct(private PDO $pdo) {}

    public function list(): array
    {
        $stmt = $this->pdo->query("
            SELECT id, common_name, scientific_name, taxon_key
            FROM wildlife_species
            ORDER BY common_name ASC
        ");

        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return array_values(array_map(fn($r) => [
            'id'              => (int)$r['id'],
            'common_name'     => $r['common_name'],
            'scientific_name' => $r['scientific_name'],
            'taxon_key'       => $r['taxon_key'] !== null ? (int)$r['taxon_key'] : null,
        ], $rows));
    }
}
