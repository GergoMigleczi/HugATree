<?php
declare(strict_types=1);

namespace App\Http\Routes;

use App\Application\UseCase\CreateTree;
use App\Application\UseCase\GetTreesInBbox;
use App\Application\UseCase\GetSpecies;
use App\Application\UseCase\GetTreeObservations;
use App\Application\UseCase\AddObservation;
use App\Application\UseCase\GetTreeDetails;
use App\Application\UseCase\GetTree;
use App\Http\Json;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

// NOTE: We accept $routes as "any route collector" (Slim\App or RouteCollectorProxy)
// so this works both for $app and for $app->group(...) $group.
final class TreesRoutes
{
    public static function registerPublic($routes,
        GetTreesInBbox $getTreesInBbox,
        GetSpecies $getSpecies,
        GetTree $getTree
    ): void
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

        // GET /trees/species (public)
        $routes->get('/trees/species', function (Request $req, Response $res) use ($getSpecies) {
            $query = $req->getQueryParams();

            $q = isset($query['q']) ? trim((string)$query['q']) : null;

            $limit = isset($query['limit']) ? (int)$query['limit'] : 200;
            if ($limit <= 0) $limit = 200;
            if ($limit > 500) $limit = 500;

            $offset = isset($query['offset']) ? (int)$query['offset'] : 0;
            if ($offset < 0) $offset = 0;

            try {
                $result = $getSpecies->execute($q, $limit, $offset);
                return Json::ok($res, $result, 200);
            } catch (\Throwable $e) {
                error_log('[GET /trees/species] ' . $e->getMessage());
                error_log($e->getTraceAsString());
                return Json::ok($res, ['error' => 'Unexpected server error'], 500);
            }
        });

        // GET /trees/:id (public) 
        $routes->get('/trees/{id}', function (Request $req, Response $res, array $args) use ($getTree) {
            $treeId = (int)($args['id'] ?? 0);
            if ($treeId <= 0) {
                return Json::ok($res, ['error' => 'Invalid tree id'], 400);
            }
            try {
                $result = $getTree->execute($treeId);
                if (!$result) {
                    return Json::ok($res, ['error' => 'Tree not found'], 404);
                }
                return Json::ok($res, $result, 200);
            } catch (\Throwable $e) {
                error_log('[GET /trees/' . $treeId . '] ' . $e->getMessage());
                error_log($e->getTraceAsString());
                return Json::ok($res, ['error' => 'Unexpected server error'], 500);
            }
        }); 
    }

    public static function registerProtected(
        $routes,
        CreateTree $createTree,
        GetTreeObservations $getTreeObservations,
        AddObservation $addObservation,
        GetTreeDetails $getTreeDetails
    ): void
    {
        // GET /trees/:id/details (JWT required)
        $routes->get('/trees/{id}/details', function (Request $req, Response $res, array $args) use ($getTreeDetails) {
            $treeId = (int)($args['id'] ?? 0);
            if ($treeId <= 0) {
                return Json::ok($res, ['error' => 'Invalid tree id'], 400);
            }
            try {
                $result = $getTreeDetails->execute($treeId);
                return Json::ok($res, $result ?? [], 200);
            } catch (\Throwable $e) {
                error_log('[GET /trees/' . $treeId . '/details] ' . $e->getMessage());
                return Json::ok($res, ['error' => 'Unexpected server error'], 500);
            }
        });


        // GET /trees/:id/observations (JWT required)
        $routes->get('/trees/{id}/observations', function (Request $req, Response $res, array $args) use ($getTreeObservations) {
            $treeId = (int)($args['id'] ?? 0);
            if ($treeId <= 0) {
                return Json::ok($res, ['error' => 'Invalid tree id'], 400);
            }
            try {
                $items = $getTreeObservations->execute($treeId);
                return Json::ok($res, $items, 200);
            } catch (\Throwable $e) {
                error_log('[GET /trees/' . $treeId . '/observations] ' . $e->getMessage());
                return Json::ok($res, ['error' => 'Unexpected server error'], 500);
            }
        });

        // POST /trees/:id/observations (JWT required)
        $routes->post('/trees/{id}/observations', function (Request $req, Response $res, array $args) use ($addObservation) {
            $claims = $req->getAttribute('auth');
            if (!is_array($claims) || empty($claims['sub'])) {
                return Json::ok($res, ['error' => 'Unauthenticated'], 401);
            }

            $treeId = (int)($args['id'] ?? 0);
            if ($treeId <= 0) {
                return Json::ok($res, ['error' => 'Invalid tree id'], 400);
            }

            $userId = (int)$claims['sub'];
            $body   = $req->getParsedBody();
            if (!is_array($body)) {
                return Json::ok($res, ['error' => 'Invalid JSON body'], 400);
            }

            try {
                $result = $addObservation->execute($treeId, $userId, $body);
                return Json::ok($res, $result, 201);
            } catch (\InvalidArgumentException $e) {
                return Json::ok($res, ['error' => $e->getMessage()], 422);
            } catch (\Throwable $e) {
                error_log('[POST /trees/' . $treeId . '/observations] ' . $e->getMessage());
                return Json::ok($res, ['error' => 'Unexpected server error'], 500);
            }
        });

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