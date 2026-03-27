<?php
declare(strict_types=1);

namespace App\Infrastructure\Storage;

use App\Application\Ports\FileStorageService;

final class LocalFileStorageService implements FileStorageService
{
    public function __construct(private string $uploadsPath) {}

    public function store(string $sourcePath, string $extension): string
    {
        $storageKey = 'photos/' . $this->uuid() . '.' . $extension;
        $dest = $this->resolve($storageKey);

        $dir = dirname($dest);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        // copy + unlink instead of rename: rename() fails across different
        // filesystem mount points (e.g. /tmp on the overlay fs vs the Docker volume).
        if (!copy($sourcePath, $dest)) {
            throw new \RuntimeException('Failed to store uploaded file.');
        }
        unlink($sourcePath);

        return $storageKey;
    }

    public function resolve(string $storageKey): string
    {
        return rtrim($this->uploadsPath, '/') . '/' . $storageKey;
    }

    private function uuid(): string
    {
        return sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );
    }
}
