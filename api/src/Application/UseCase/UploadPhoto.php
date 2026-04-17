<?php
declare(strict_types=1);

namespace App\Application\UseCase;

use App\Application\Ports\FileStorageService;
use Psr\Http\Message\UploadedFileInterface;

final class UploadPhoto
{
    private const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
    private const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
    private const MIME_TO_EXT = [
        'image/jpeg' => 'jpg',
        'image/png'  => 'png',
        'image/webp' => 'webp',
    ];

    public function __construct(private FileStorageService $storage) {}

    /** @return array{storageKey: string} */
    public function execute(UploadedFileInterface $file): array
    {
        if ($file->getError() !== UPLOAD_ERR_OK) {
            throw new \InvalidArgumentException('Upload error — no file received.');
        }

        if ($file->getSize() > self::MAX_BYTES) {
            throw new \InvalidArgumentException('File exceeds the 10 MB limit.');
        }

        // Move to a temp path so we can inspect the MIME type from file contents
        $tmpPath = sys_get_temp_dir() . '/' . uniqid('hugatree_upload_', true);
        $file->moveTo($tmpPath);

        $mimeType = mime_content_type($tmpPath) ?: '';
        if (!in_array($mimeType, self::ALLOWED_MIME_TYPES, true)) {
            unlink($tmpPath);
            throw new \InvalidArgumentException('Only JPEG, PNG, and WebP images are accepted.');
        }

        $ext = self::MIME_TO_EXT[$mimeType];
        $storageKey = $this->storage->store($tmpPath, $ext);

        return ['storageKey' => $storageKey];
    }
}
