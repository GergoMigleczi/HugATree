<?php
declare(strict_types=1);

namespace App\Application\UseCase;

use App\Application\Ports\DbTransaction;
use App\Application\Ports\ObservationPhotoRepository;
use App\Application\Ports\ObservationRepository;
use App\Application\Ports\TreeDetailHistoryRepository;
use App\Application\Ports\TreeRepository;
use App\Application\Service\TreeMetricsCalculator;
use App\Application\Service\WeatherSummaryService;

final class AddObservation
{
    public function __construct(
        private DbTransaction $tx,
        private ObservationRepository $observations,
        private ObservationPhotoRepository $photos,
        private TreeDetailHistoryRepository $treeDetails,
        private TreeRepository $trees,
        private TreeMetricsCalculator $metricsCalculator,
        private WeatherSummaryService $weatherSummaryService,
    ) {}

    /** @return array{observationId: int} */
    public function execute(int $treeId, int $userId, array $input): array
    {
        return $this->tx->run(
            fn() => $this->executeInsideTransaction($treeId, $userId, $input)
        );
    }

    /** @return array{observationId: int} */
    public function executeInsideTransaction(int $treeId, int $userId, array $input): array
    {
        $observationId = $this->observations->insert([
            'tree_id' => $treeId,
            'created_by_user_id' => $userId,
            'title' => $input['title'] ?? null,
            'note_text' => $input['noteText'] ?? null,
            'observed_at' => $input['observedAt'] ?? null,
        ]);

        if (isset($input['details']) && is_array($input['details'])) {
            $d = $input['details'];

            $detailPayload = [
                'tree_id' => $treeId,
                'observation_id' => $observationId,
                'recorded_by_user_id' => $userId,
                'probable_age_years' => $d['probableAgeYears'] ?? null,
                'age_basis' => $d['ageBasis'] ?? null,
                'height_m' => $d['heightM'] ?? null,
                'height_method' => $d['heightMethod'] ?? null,
                'trunk_diameter_cm' => $d['trunkDiameterCm'] ?? null,
                'diameter_height_cm' => $d['diameterHeightCm'] ?? null,
                'diameter_method' => $d['diameterMethod'] ?? null,
                'canopy_diameter_m' => $d['canopyDiameterM'] ?? null,
                'canopy_density' => $d['canopyDensity'] ?? null,
                'recorded_at' => null,

                // default metric values
                'estimated_co2_stored_kg' => null,
                'estimated_co2_sequestered_year_kg' => null,
                'estimated_water_use_year_l' => null,
                'weather_period_start' => null,
                'weather_period_end' => null,
                'weather_source' => null,
                'calculation_method_version' => null,
                'calculated_at' => null,
            ];

            $tree = $this->trees->getATree($treeId);
            $previousDetail = $this->treeDetails->latestByTreeId($treeId);

            $detailForCalculator = [
                'trunkDiameterCm' => $d['trunkDiameterCm'] ?? null,
                'heightM' => $d['heightM'] ?? null,
                'canopyDiameterM' => $d['canopyDiameterM'] ?? null,
                'canopyDensity' => $d['canopyDensity'] ?? null,
                'recordedAt' => null,
            ];

            $hasCarbonInputs = $this->hasCarbonInputs($detailForCalculator);
            $hasWaterInputs = $this->hasWaterInputs($tree, $detailForCalculator);
            
            $metrics = [
                'estimated_co2_stored_kg' => null,
                'estimated_co2_sequestered_year_kg' => null,
                'estimated_water_use_year_l' => null,
                'weather_period_start' => null,
                'weather_period_end' => null,
                'weather_source' => null,
                'calculation_method_version' => null,
                'calculated_at' => null,
            ];

            if ($hasCarbonInputs || $hasWaterInputs) {
                if ($hasCarbonInputs) {
                    $carbonMetrics = $this->metricsCalculator->calculateCarbonMetrics(
                        $tree,
                        $detailForCalculator,
                        $previousDetail
                    );

                    $metrics['estimated_co2_stored_kg'] = $carbonMetrics['estimated_co2_stored_kg'];
                    $metrics['estimated_co2_sequestered_year_kg'] = $carbonMetrics['estimated_co2_sequestered_year_kg'];
                }

                if ($hasWaterInputs) {
                    try {
                        $weatherSummary = $this->weatherSummaryService->getLast12MonthsSummary(
                            (float)$tree['lat'],
                            (float)$tree['lng']
                        );

                        $waterMetrics = $this->metricsCalculator->calculateWaterMetrics(
                            $tree,
                            $detailForCalculator,
                            $weatherSummary
                        );

                        $metrics['estimated_water_use_year_l'] = $waterMetrics['estimated_water_use_year_l'];
                        $metrics['weather_period_start'] = $waterMetrics['weather_period_start'];
                        $metrics['weather_period_end'] = $waterMetrics['weather_period_end'];
                        $metrics['weather_source'] = $waterMetrics['weather_source'];
                    } catch (\Throwable $e) {
                        // Keep water metrics null if weather lookup fails.
                    }
                }

                if (
                    $metrics['estimated_co2_stored_kg'] !== null ||
                    $metrics['estimated_co2_sequestered_year_kg'] !== null ||
                    $metrics['estimated_water_use_year_l'] !== null
                ) {
                    $metrics['calculation_method_version'] = 'v1_simple';
                    $metrics['calculated_at'] = gmdate('Y-m-d H:i:s');
                }
            }

            $this->treeDetails->insert(array_merge($detailPayload, $metrics));
        }

        foreach ($input['photoKeys'] ?? [] as $storageKey) {
            $this->photos->insert([
                'observation_id'      => $observationId,
                'uploaded_by_user_id' => $userId,
                'storage_key'         => (string) $storageKey,
            ]);
        }

        return ['observationId' => $observationId];
    }

    private function hasCarbonInputs(array $detail): bool
    {
        $dbh = $detail['trunkDiameterCm'] ?? null;
        return is_numeric($dbh) && (float)$dbh > 0;
    }

    private function hasWaterInputs(array $tree, array $detail): bool
    {
        $canopyDiameter = $detail['canopyDiameterM'] ?? null;
        $lat = $tree['lat'] ?? null;
        $lng = $tree['lng'] ?? null;

        return is_numeric($canopyDiameter)
            && (float)$canopyDiameter > 0
            && is_numeric($lat)
            && is_numeric($lng);
    }
}