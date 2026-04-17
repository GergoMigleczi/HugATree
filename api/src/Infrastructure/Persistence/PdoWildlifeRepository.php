<?php
declare(strict_types=1);

namespace App\Infrastructure\Persistence;

use App\Application\Ports\WildlifeRepository;
use PDO;

final class PdoWildlifeRepository implements WildlifeRepository
{
    public function __construct(private PDO $pdo) {}

    public function insert(array $w): int
    {
        $sql = "
            INSERT INTO tree_wildlife_history (
                tree_id, observation_id, wildlife_species_id,
                life_stage, count, evidence_type, behaviour
            ) VALUES (
                :tree_id, :observation_id, :wildlife_species_id,
                :life_stage, :count, :evidence_type, :behaviour
            )
            RETURNING id
        ";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            ':tree_id'             => $w['tree_id'],
            ':observation_id'      => $w['observation_id'],
            ':wildlife_species_id' => $w['wildlife_species_id'] ?? null,
            ':life_stage'          => $w['life_stage'] ?? null,
            ':count'               => $w['count'] ?? null,
            ':evidence_type'       => $w['evidence_type'] ?? null,
            ':behaviour'           => $w['behaviour'] ?? null,
        ]);

        return (int)$stmt->fetchColumn();
    }

    public function listByTreeId(int $treeId): array
    {
        $sql = "
            SELECT
                wh.id,
                wh.wildlife_species_id,
                ws.common_name        AS wildlife_species_name,
                wh.life_stage,
                wh.count,
                wh.evidence_type,
                wh.behaviour,
                o.id                  AS observation_id,
                o.title,
                o.note_text,
                o.observed_at,
                o.created_at,
                u.display_name        AS author_name,
                (SELECT op.storage_key
                 FROM observation_photos op
                 WHERE op.observation_id = o.id
                 ORDER BY op.id ASC LIMIT 1) AS photo_key
            FROM tree_wildlife_history wh
            JOIN observations o ON o.id = wh.observation_id
            LEFT JOIN wildlife_species ws ON ws.id = wh.wildlife_species_id
            LEFT JOIN users u ON u.id = o.created_by_user_id
            WHERE wh.tree_id = :tree_id
            ORDER BY o.created_at DESC
        ";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([':tree_id' => $treeId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return array_values(array_map(fn($r) => [
            'id'                 => (int)$r['id'],
            'wildlifeSpeciesId'  => $r['wildlife_species_id'] !== null ? (int)$r['wildlife_species_id'] : null,
            'wildlifeSpeciesName'=> $r['wildlife_species_name'],
            'lifeStage'          => $r['life_stage'],
            'count'              => $r['count'] !== null ? (int)$r['count'] : null,
            'evidenceType'       => $r['evidence_type'],
            'behaviour'          => $r['behaviour'],
            'observationId'      => (int)$r['observation_id'],
            'title'              => $r['title'],
            'noteText'           => $r['note_text'],
            'observedAt'         => $r['observed_at'],
            'createdAt'          => $r['created_at'],
            'authorName'         => $r['author_name'],
            'photoKey'           => $r['photo_key'],
        ], $rows));
    }
}
