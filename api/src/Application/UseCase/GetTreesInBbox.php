<?php
declare(strict_types=1);

namespace App\Application\UseCase;

use App\Application\Ports\TreeRepository;

final class GetTreesInBbox
{
    public function __construct(private TreeRepository $trees) {}

    /**
     * Retrieves approved trees within a bounding box.
     *
     * Delegates to TreeRepository and returns:
     *  - items: limited result set
     *  - count: total number of matching rows (ignores limit)
     *  - limit: applied limit
     *
     * @return array{
     *   items: array<int, array{
     *     id:int,
     *     speciesId:?int,
     *     speciesCommonName:?string,
     *     lat:float,
     *     lng:float
     *   }>,
     *   count: int,
     *   limit: int
     * }
     */
    public function execute(array $query): array
    {
        $minLat = $this->requireFloat($query, 'minLat');
        $minLng = $this->requireFloat($query, 'minLng');
        $maxLat = $this->requireFloat($query, 'maxLat');
        $maxLng = $this->requireFloat($query, 'maxLng');

        $this->assertRange($minLat, -90.0, 90.0, 'minLat');
        $this->assertRange($maxLat, -90.0, 90.0, 'maxLat');
        $this->assertRange($minLng, -180.0, 180.0, 'minLng');
        $this->assertRange($maxLng, -180.0, 180.0, 'maxLng');

        if ($minLat > $maxLat) {
            throw new \InvalidArgumentException('minLat must be <= maxLat');
        }
        if ($minLng > $maxLng) {
            throw new \InvalidArgumentException('minLng must be <= maxLng');
        }

        $limit = $this->optionalInt($query, 'limit', 5000);
        if ($limit < 1) $limit = 1;

        $filter = [];
        if (isset($query['filter'])) {
            $filter = json_decode($query['filter'], true);
            if (!is_array($filter)) {
                throw new \InvalidArgumentException('filter must be a valid JSON object');
            }
        }
        $approvalStatus = [];
        if($filter && isset($filter['approvalStatus']) && is_array($filter['approvalStatus'])) {
            $allowedStatuses = ['approved', 'pending', 'rejected'];
            foreach ($filter['approvalStatus'] as $status) {
                if (in_array($status, $allowedStatuses, true)) {
                    $approvalStatus[] = $status;
                }
            }
        }

        $hasPending = false;
        if ($filter && isset($filter['hasPending'])) {
            $hasPending = $filter['hasPending'] === true;
        }

        return $this->trees->findTreesInBbox(
                    $minLat,
                    $minLng,
                    $maxLat,
                    $maxLng,
                    $limit,
                    $approvalStatus,
                    $hasPending
                );
    }

    private function requireFloat(array $query, string $key): float
    {
        if (!array_key_exists($key, $query)) {
            throw new \InvalidArgumentException("Missing query param: $key");
        }
        $v = $query[$key];

        // Slim query params come in as strings
        if ($v === '' || $v === null || !is_numeric($v)) {
            throw new \InvalidArgumentException("Query param $key must be a number");
        }
        return (float)$v;
    }

    private function optionalInt(array $query, string $key, int $default): int
    {
        if (!array_key_exists($key, $query) || $query[$key] === '' || $query[$key] === null) {
            return $default;
        }
        $v = $query[$key];
        if (!is_numeric($v)) {
            throw new \InvalidArgumentException("Query param $key must be an integer");
        }
        return (int)$v;
    }

    private function assertRange(float $value, float $min, float $max, string $key): void
    {
        if ($value < $min || $value > $max) {
            throw new \InvalidArgumentException("Query param $key must be between $min and $max");
        }
    }
}