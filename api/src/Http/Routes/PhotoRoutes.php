<?php
declare(strict_types=1);

namespace App\Http\Routes;

use App\Application\UseCase\UploadPhoto;
use App\Application\Ports\FileStorageService;
use App\Http\Json;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Psr7\Stream;

final class PhotoRoutes
{
    /**
     * Protected routes (JWT required) — registered inside the auth group.
     */
    public static function registerProtected($routes, UploadPhoto $uploadPhoto): void
    {
        // POST /photos/upload
        // Accepts multipart/form-data with a single field named "photo".
        // Returns { storageKey: string } on success.
        $routes->post('/photos/upload', function (Request $req, Response $res) use ($uploadPhoto) {
            $files = $req->getUploadedFiles();
            $file  = $files['photo'] ?? null;

            if ($file === null) {
                return Json::ok($res, ['error' => 'Expected a file field named "photo".'], 422);
            }

            try {
                $result = $uploadPhoto->execute($file);
                return Json::ok($res, $result, 201);
            } catch (\InvalidArgumentException $e) {
                return Json::ok($res, ['error' => $e->getMessage()], 422);
            }
        });
    }

    /**
     * Public routes — no auth required to view photos.
     */
    public static function registerPublic($routes, FileStorageService $storage): void
    {
        // GET /photos/{filename}
        // Streams the stored image back to the client.
        // The {filename} segment is the UUID + extension (e.g. "abc123.jpg").
        $routes->get('/photos/{filename}', function (Request $req, Response $res, array $args) use ($storage) {
            $storageKey = 'photos/' . $args['filename'];
            $filePath   = $storage->resolve($storageKey);

            if (!file_exists($filePath)) {
                return Json::ok($res, ['error' => 'Not found.'], 404);
            }

            $mimeType = mime_content_type($filePath) ?: 'application/octet-stream';
            $stream   = new Stream(fopen($filePath, 'rb'));

            return $res
                ->withHeader('Content-Type', $mimeType)
                ->withHeader('Content-Length', (string) filesize($filePath))
                ->withHeader('Cache-Control', 'public, max-age=31536000, immutable')
                ->withBody($stream);
        });
    }
}
