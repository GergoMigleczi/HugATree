<?php
declare(strict_types=1);

namespace App\Infrastructure\Persistence;

use App\Application\Ports\HealthRepository;
use PDO;

final class PdoHealthRepository implements HealthRepository
{
    public function __construct(private PDO $pdo) {}

    public function insertHealth(array $h): int
    {
        $sql = "
            INSERT INTO tree_health_history (
                tree_id, observation_id, health_status, risk_level
            ) VALUES (
                :tree_id, :observation_id, :health_status, :risk_level
            )
            RETURNING id
        ";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            ':tree_id'        => $h['tree_id'],
            ':observation_id' => $h['observation_id'],
            ':health_status'  => $h['health_status'] ?? null,
            ':risk_level'     => $h['risk_level'] ?? null,
        ]);

        return (int)$stmt->fetchColumn();
    }

    public function insertIssue(array $issue): void
    {
        $sql = "
            INSERT INTO tree_health_issues (
                tree_health_history_id, issue_type, issue_name, affected_part, severity
            ) VALUES (
                :tree_health_history_id, :issue_type, :issue_name, :affected_part, :severity
            )
        ";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            ':tree_health_history_id' => $issue['tree_health_history_id'],
            ':issue_type'             => $issue['issue_type'] ?? null,
            ':issue_name'             => $issue['issue_name'] ?? null,
            ':affected_part'          => $issue['affected_part'] ?? null,
            ':severity'               => $issue['severity'] ?? null,
        ]);
    }

    public function listByTreeId(int $treeId): array
    {
        $sql = "
            SELECT
                hh.id,
                hh.health_status,
                hh.risk_level,
                o.id           AS observation_id,
                o.title,
                o.note_text,
                o.observed_at,
                o.created_at,
                u.display_name AS author_name,
                (SELECT op.storage_key
                 FROM observation_photos op
                 WHERE op.observation_id = o.id
                 ORDER BY op.id ASC LIMIT 1) AS photo_key
            FROM tree_health_history hh
            JOIN observations o ON o.id = hh.observation_id
            LEFT JOIN users u ON u.id = o.created_by_user_id
            WHERE hh.tree_id = :tree_id
            ORDER BY o.created_at DESC
        ";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([':tree_id' => $treeId]);
        $healthRows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (empty($healthRows)) {
            return [];
        }

        // Fetch all issues for these health records in one query
        $healthIds = array_map(fn($r) => (int)$r['id'], $healthRows);
        $placeholders = implode(',', array_fill(0, count($healthIds), '?'));

        $issueStmt = $this->pdo->prepare("
            SELECT tree_health_history_id, issue_type, issue_name, affected_part, severity
            FROM tree_health_issues
            WHERE tree_health_history_id IN ($placeholders)
            ORDER BY id ASC
        ");
        $issueStmt->execute($healthIds);
        $issueRows = $issueStmt->fetchAll(PDO::FETCH_ASSOC);

        // Group issues by health id
        $issuesByHealthId = [];
        foreach ($issueRows as $ir) {
            $issuesByHealthId[(int)$ir['tree_health_history_id']][] = [
                'issueType'    => $ir['issue_type'],
                'issueName'    => $ir['issue_name'],
                'affectedPart' => $ir['affected_part'],
                'severity'     => $ir['severity'],
            ];
        }

        return array_values(array_map(fn($r) => [
            'id'            => (int)$r['id'],
            'healthStatus'  => $r['health_status'],
            'riskLevel'     => $r['risk_level'],
            'issues'        => $issuesByHealthId[(int)$r['id']] ?? [],
            'observationId' => (int)$r['observation_id'],
            'title'         => $r['title'],
            'noteText'      => $r['note_text'],
            'observedAt'    => $r['observed_at'],
            'createdAt'     => $r['created_at'],
            'authorName'    => $r['author_name'],
            'photoKey'      => $r['photo_key'],
        ], $healthRows));
    }
}
