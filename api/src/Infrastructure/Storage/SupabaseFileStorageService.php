<?php
declare(strict_types=1);

namespace App\Infrastructure\Storage;

use App\Application\Ports\FileStorageService;

final class SupabaseFileStorageService implements FileStorageService
{
    public function store(string $tmpPath, string $ext): string
    {
        $supabaseUrl = rtrim($_ENV['SUPABASE_URL'], '/');
        $bucket = $_ENV['SUPABASE_STORAGE_BUCKET'];
        $serviceKey = $_ENV['SUPABASE_SERVICE_ROLE_KEY'];

        $filename = bin2hex(random_bytes(16)) . '.' . $ext;
        $storageKey = 'photos/' . $filename;

        $uploadUrl = "{$supabaseUrl}/storage/v1/object/{$bucket}/{$storageKey}";

        $mimeType = mime_content_type($tmpPath) ?: 'application/octet-stream';

        $ch = curl_init($uploadUrl);

        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => file_get_contents($tmpPath),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                "Authorization: Bearer {$serviceKey}",
                "apikey: {$serviceKey}",
                "Content-Type: {$mimeType}",
            ],
        ]);

        $body = curl_exec($ch);
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        if ($body === false || $status < 200 || $status >= 300) {
            $error = curl_error($ch);
            curl_close($ch);
            throw new \RuntimeException("Supabase upload failed: HTTP {$status} {$error} {$body}");
        }

        curl_close($ch);

        @unlink($tmpPath);

        return $storageKey;
    }

    public function resolve(string $storageKey): string
    {
        $supabaseUrl = rtrim($_ENV['SUPABASE_URL'], '/');
        $bucket = $_ENV['SUPABASE_STORAGE_BUCKET'];

        return "{$supabaseUrl}/storage/v1/object/public/{$bucket}/{$storageKey}";
    }
}