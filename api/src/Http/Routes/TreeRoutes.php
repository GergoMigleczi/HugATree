<?php
declare(strict_types=1);

namespace App\Http\Routes;

use App\Application\UseCase\CreateTree;
use App\Http\Json;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\App;

final class TreesRoutes
{
    public static function register(App $app, CreateTree $createTree): void
    {
        $app->post('/trees', function (Request $req, Response $res) use ($createTree) {

            // AuthMiddleware puts JWT claims into request attribute "auth"
            $claims = $req->getAttribute('auth');

            if (!is_array($claims) || empty($claims['sub'])) {
                return Json::ok($res, ['error' => 'Unauthenticated'], 401);
            }

            $userId = (int)$claims['sub'];

            $body = $req->getParsedBody();
            if (!is_array($body)) {
                return Json::ok($res, ['error' => 'Invalid JSON body'], 400);
            }

            try {
                $result = $createTree->execute($userId, $body);
                return Json::ok($res, $result, 201);

            } catch (\InvalidArgumentException $e) {
                return Json::ok($res, ['error' => $e->getMessage()], 422);

            } catch (\Throwable $e) {
                // In real app log $e
                return Json::ok($res, ['error' => 'Unexpected server error'], 500);
            }
        });
    }
}