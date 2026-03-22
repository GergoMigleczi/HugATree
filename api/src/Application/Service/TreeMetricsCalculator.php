<?php

declare(strict_types=1);

namespace App\Application\Service;

final class TreeMetricsCalculator
{
    private const CARBON_FRACTION = 0.50;
    private const CO2_PER_CARBON = 3.67;
    private const CO2_PER_BIOMASS = self::CARBON_FRACTION * self::CO2_PER_CARBON; // 1.835

    /**
     * Carbon metrics derived from a tree detail snapshot.
     *
     * Expected detail keys:
     * - trunkDiameterCm ?float
     * - heightM ?float
     * - recordedAt string|\DateTimeInterface|null
     *
     * Expected previousDetail keys (optional):
     * - trunkDiameterCm ?float
     * - heightM ?float
     * - recordedAt string|\DateTimeInterface|null
     *
     * Return:
     * [
     *   'estimated_co2_stored_kg' => ?float,
     *   'estimated_co2_sequestered_year_kg' => ?float,
     * ]
     */
    public function calculateCarbonMetrics(
        array $tree,
        array $detail,
        ?array $previousDetail = null
    ): array {
        $dbhCm = $this->toNullableFloat($detail['trunkDiameterCm'] ?? null);
        $heightM = $this->toNullableFloat($detail['heightM'] ?? null);

        if ($dbhCm === null || $dbhCm <= 0) {
            return [
                'estimated_co2_stored_kg' => null,
                'estimated_co2_sequestered_year_kg' => null,
            ];
        }

        $currentBiomassKg = $this->estimateBiomassKg($dbhCm, $heightM);
        $currentCo2StoredKg = $this->round2($currentBiomassKg * self::CO2_PER_BIOMASS);

        $annualCo2Kg = $this->estimateAnnualCo2FromPreviousOrFallback(
            $detail,
            $currentBiomassKg,
            $previousDetail
        );

        return [
            'estimated_co2_stored_kg' => $currentCo2StoredKg,
            'estimated_co2_sequestered_year_kg' => $annualCo2Kg !== null ? $this->round2($annualCo2Kg) : null,
        ];
    }

    /**
     * Water metrics from canopy area and summed ET0 over the last 12 months.
     *
     * Expected detail keys:
     * - canopyDiameterM ?float
     * - canopyDensity ?string  // sparse, medium, dense, unknown
     *
     * Expected weatherSummary keys:
     * - et0SumMm float|int|string|null      // sum of daily ET0 over period in mm
     * - periodStart string|null             // YYYY-MM-DD
     * - periodEnd string|null               // YYYY-MM-DD
     * - source string|null
     *
     * Return:
     * [
     *   'estimated_water_use_year_l' => ?float,
     *   'weather_period_start' => ?string,
     *   'weather_period_end' => ?string,
     *   'weather_source' => ?string,
     * ]
     */
    public function calculateWaterMetrics(
        array $tree,
        array $detail,
        array $weatherSummary
    ): array {
        $canopyDiameterM = $this->toNullableFloat($detail['canopyDiameterM'] ?? null);
        $et0SumMm = $this->toNullableFloat($weatherSummary['et0SumMm'] ?? null);

        if ($canopyDiameterM === null || $canopyDiameterM <= 0 || $et0SumMm === null || $et0SumMm <= 0) {
            return [
                'estimated_water_use_year_l' => null,
                'weather_period_start' => $weatherSummary['periodStart'] ?? null,
                'weather_period_end' => $weatherSummary['periodEnd'] ?? null,
                'weather_source' => $weatherSummary['source'] ?? null,
            ];
        }

        $canopyAreaM2 = $this->calculateCanopyAreaM2($canopyDiameterM);
        $densityFactor = $this->getCanopyDensityFactor($detail['canopyDensity'] ?? null);

        // 1 mm over 1 m² = 1 liter
        $annualWaterUseL = $et0SumMm * $canopyAreaM2 * $densityFactor;

        return [
            'estimated_water_use_year_l' => $this->round2($annualWaterUseL),
            'weather_period_start' => $weatherSummary['periodStart'] ?? null,
            'weather_period_end' => $weatherSummary['periodEnd'] ?? null,
            'weather_source' => $weatherSummary['source'] ?? null,
        ];
    }

    /**
     * Convenience wrapper if you want both together.
     */
    public function calculateAll(
        array $tree,
        array $detail,
        ?array $previousDetail,
        array $weatherSummary
    ): array {
        $carbon = $this->calculateCarbonMetrics($tree, $detail, $previousDetail);
        $water = $this->calculateWaterMetrics($tree, $detail, $weatherSummary);

        return array_merge(
            $carbon,
            $water,
            [
                'calculated_at' => gmdate('Y-m-d H:i:s'),
            ]
        );
    }

    /**
     * Simple MVP biomass estimate.
     *
     * This is intentionally generic and should be treated as an estimate.
     * It uses DBH as the primary driver, with a light height adjustment
     * when height is available.
     */
    private function estimateBiomassKg(float $dbhCm, ?float $heightM): float
    {
        // Base generic equation:
        // biomass_kg = 0.25 * dbh_cm^2.3
        $biomassKg = 0.25 * pow($dbhCm, 2.3);

        // Light height adjustment so height can refine the estimate a bit
        // without dominating it.
        if ($heightM !== null && $heightM > 0) {
            if ($heightM < 5) {
                $biomassKg *= 0.90;
            } elseif ($heightM > 20) {
                $biomassKg *= 1.10;
            }
        }

        return max(0.0, $biomassKg);
    }

    /**
     * If we have a usable previous approved detail, annualize observed growth.
     * Otherwise use a fallback size-based annual growth rate.
     */
    private function estimateAnnualCo2FromPreviousOrFallback(
        array $detail,
        float $currentBiomassKg,
        ?array $previousDetail
    ): ?float {
        if ($previousDetail !== null) {
            $previousDbhCm = $this->toNullableFloat($previousDetail['trunkDiameterCm'] ?? null);
            $previousHeightM = $this->toNullableFloat($previousDetail['heightM'] ?? null);

            if ($previousDbhCm !== null && $previousDbhCm > 0) {
                $previousBiomassKg = $this->estimateBiomassKg($previousDbhCm, $previousHeightM);

                $yearsBetween = $this->calculateYearsBetween(
                    $previousDetail['recordedAt'] ?? null,
                    $detail['recordedAt'] ?? null
                );

                // Guard against tiny intervals and bad dates
                if ($yearsBetween !== null && $yearsBetween >= 0.25) {
                    $biomassGainPerYearKg = ($currentBiomassKg - $previousBiomassKg) / $yearsBetween;

                    // Clamp negative values to zero for MVP to avoid odd public stats
                    $biomassGainPerYearKg = max(0.0, $biomassGainPerYearKg);

                    return $biomassGainPerYearKg * self::CO2_PER_BIOMASS;
                }
            }
        }

        return $this->estimateAnnualCo2FromSize($detail, $currentBiomassKg);
    }

    /**
     * Fallback annual sequestration estimate for first record or unusable previous.
     */
    private function estimateAnnualCo2FromSize(array $detail, float $biomassKg): float
    {
        $dbhCm = $this->toNullableFloat($detail['trunkDiameterCm'] ?? null);

        if ($dbhCm === null || $dbhCm <= 0) {
            return 0.0;
        }

        // Very simple size-band growth assumptions for MVP.
        if ($dbhCm < 15) {
            $growthRate = 0.06; // 6%
        } elseif ($dbhCm <= 40) {
            $growthRate = 0.04; // 4%
        } else {
            $growthRate = 0.02; // 2%
        }

        $annualBiomassGainKg = $biomassKg * $growthRate;

        return $annualBiomassGainKg * self::CO2_PER_BIOMASS;
    }

    private function calculateCanopyAreaM2(float $canopyDiameterM): float
    {
        $radiusM = $canopyDiameterM / 2.0;
        return M_PI * $radiusM * $radiusM;
    }

    private function getCanopyDensityFactor(mixed $canopyDensity): float
    {
        $density = is_string($canopyDensity) ? strtolower(trim($canopyDensity)) : 'unknown';

        return match ($density) {
            'open' => 0.90,
            'full' => 1.10,
            'partial' => 1.00,
            default => 1.00,
        };
    }

    private function calculateYearsBetween(mixed $from, mixed $to): ?float
    {
        $fromDt = $this->toDateTime($from);
        $toDt = $this->toDateTime($to);

        if ($fromDt === null || $toDt === null) {
            return null;
        }

        $seconds = $toDt->getTimestamp() - $fromDt->getTimestamp();
        if ($seconds <= 0) {
            return null;
        }

        return $seconds / (365.25 * 24 * 60 * 60);
    }

    private function toDateTime(mixed $value): ?\DateTimeImmutable
    {
        if ($value instanceof \DateTimeImmutable) {
            return $value;
        }

        if ($value instanceof \DateTimeInterface) {
            return \DateTimeImmutable::createFromInterface($value);
        }

        if (!is_string($value) || trim($value) === '') {
            return null;
        }

        try {
            return new \DateTimeImmutable($value);
        } catch (\Throwable) {
            return null;
        }
    }

    private function toNullableFloat(mixed $value): ?float
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (!is_numeric($value)) {
            return null;
        }

        return (float)$value;
    }

    private function round2(float $value): float
    {
        return round($value, 2);
    }
}