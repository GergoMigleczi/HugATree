<?php
declare(strict_types=1);

namespace App\Http\Routes;

use App\Application\UseCase\CreateTree;
use App\Application\UseCase\GetTreesInBbox;
use App\Http\Json;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

// NOTE: We accept $routes as "any route collector" (Slim\App or RouteCollectorProxy)
// so this works both for $app and for $app->group(...) $group.
final class TreesRoutes
{
    public static function registerPublic($routes, GetTreesInBbox $getTreesInBbox): void
    {
        // GET /trees (public) - bbox viewport query
        $routes->get('/trees', function (Request $req, Response $res) use ($getTreesInBbox) {
            $query = $req->getQueryParams();

            try {
                $result = $getTreesInBbox->execute($query);
                return Json::ok($res, $result, 200);
            } catch (\InvalidArgumentException $e) {
                return Json::ok($res, ['error' => $e->getMessage()], 422);
            } catch (\Throwable $e) {
                return Json::ok($res, ['error' => 'Unexpected server error'], 500);
            }
        });
    }

    public static function registerProtected($routes, CreateTree $createTree): void
    {
        // POST /trees (JWT required)
        $routes->post('/trees', function (Request $req, Response $res) use ($createTree) {
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
                return Json::ok($res, ['error' => 'Unexpected server error'], 500);
            }
        });
    }
}