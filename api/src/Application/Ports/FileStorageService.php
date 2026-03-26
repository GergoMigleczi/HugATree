<?php
declare(strict_types=1);

namespace App\Application\Ports;

interface FileStorageService
{
    /**
     * Persists a file from $sourcePath and returns a stable storage key
     * (e.g. "photos/550e8400-e29b-41d4-a716-446655440000.jpg").
     */
    public function store(string $sourcePath, string $extension): string;

    /**
     * Resolves a storage key to its absolute filesystem path for streaming.
     */
    public function resolve(string $storageKey): string;
}
