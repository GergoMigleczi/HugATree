<?php

declare(strict_types=1);

namespace App\Application\Service;

final class WeatherSummaryService
{
    private const API_BASE = 'https://archive-api.open-meteo.com/v1/archive';
    private const SOURCE = 'open-meteo';

    /**
     * Builds the weather summary needed by MetricsCalculator::calculateWaterMetrics().
     *
     * Return shape:
     * [
     *   'et0SumMm' => ?float,
     *   'periodStart' => string,
     *   'periodEnd' => string,
     *   'source' => string,
     * ]
     */
    public function getLast12MonthsSummary(float $lat, float $lng, ?\DateTimeImmutable $asOf = null): array
    {
        $asOf ??= new \DateTimeImmutable('today');

        // Use the 365 days ending yesterday so the period is complete.
        $periodEnd = $asOf->modify('-1 day');
        $periodStart = $periodEnd->modify('-364 days');

        $url = $this->buildUrl($lat, $lng, $periodStart, $periodEnd);
        $payload = $this->fetchJson($url);

        $et0SumMm = $this->extractEt0SumMm($payload);

        return [
            'et0SumMm' => $et0SumMm,
            'periodStart' => $periodStart->format('Y-m-d'),
            'periodEnd' => $periodEnd->format('Y-m-d'),
            'source' => self::SOURCE,
        ];
    }

    private function buildUrl(
        float $lat,
        float $lng,
        \DateTimeImmutable $periodStart,
        \DateTimeImmutable $periodEnd
    ): string {
        $query = http_build_query([
            'latitude' => $lat,
            'longitude' => $lng,
            'start_date' => $periodStart->format('Y-m-d'),
            'end_date' => $periodEnd->format('Y-m-d'),
            'daily' => 'et0_fao_evapotranspiration',
            'timezone' => 'GMT',
        ]);

        return self::API_BASE . '?' . $query;
    }

    /**
     * @return array<string, mixed>
     */
    private function fetchJson(string $url): array
    {
        $ch = curl_init($url);

        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_TIMEOUT => 20,
            CURLOPT_HTTPHEADER => [
                'Accept: application/json',
            ],
        ]);

        $body = curl_exec($ch);
        $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlErr = curl_error($ch);

        curl_close($ch);

        if ($body === false) {
            throw new \RuntimeException('Weather API request failed: ' . $curlErr);
        }

        if ($httpCode < 200 || $httpCode >= 300) {
            throw new \RuntimeException('Weather API returned HTTP ' . $httpCode);
        }

        /** @var mixed $decoded */
        $decoded = json_decode($body, true);

        if (!is_array($decoded)) {
            throw new \RuntimeException('Weather API returned invalid JSON');
        }

        return $decoded;
    }

    private function extractEt0SumMm(array $payload): ?float
    {
        $daily = $payload['daily'] ?? null;
        if (!is_array($daily)) {
            return null;
        }

        $values = $daily['et0_fao_evapotranspiration'] ?? null;
        if (!is_array($values) || $values === []) {
            return null;
        }

        $sum = 0.0;
        $found = false;

        foreach ($values as $value) {
            if ($value === null || $value === '') {
                continue;
            }

            if (!is_numeric($value)) {
                continue;
            }

            $sum += (float) $value;
            $found = true;
        }

        return $found ? round($sum, 2) : null;
    }
}