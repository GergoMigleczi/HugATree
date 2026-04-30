<?php
declare(strict_types=1);

namespace App\Http\Routes;

use App\Application\UseCase\CreateTree;
use App\Application\UseCase\GetTreesInBbox;
use App\Application\UseCase\GetSpecies;
use App\Application\UseCase\GetTreeObservations;
use App\Application\UseCase\AddObservation;
use App\Application\UseCase\GetLatestTreeDetails;
use App\Application\UseCase\GetTreeDetails;
use App\Application\UseCase\GetTree;
use App\Application\UseCase\GetWildlifeSpecies;
use App\Application\UseCase\GetTreeWildlife;
use App\Application\UseCase\CreateWildlife;
use App\Application\UseCase\GetTreeHealth;
use App\Application\UseCase\CreateHealth;
use App\Application\UseCase\ApproveTree;
use App\Application\UseCase\ApproveEverythingForTree;
use App\Application\UseCase\ApproveObservation;
use App\Application\UseCase\ApproveTreeDetail;
use App\Application\UseCase\RejectTree;
use App\Application\UseCase\RejectEverythingForTree;
use App\Application\UseCase\RejectObservation;
use App\Application\UseCase\RejectTreeDetail;
use App\Http\Json;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

// NOTE: We accept $routes as "any route collector" (Slim\App or RouteCollectorProxy)
// so this works both for $app and for $app->group(...) $group.
final class TreesRoutes
{
    public static function registerWildlifeSpeciesPublic($routes, GetWildlifeSpecies $getWildlifeSpecies): void
    {
        // GET /trees/wildlife-species (public)
        $routes->get('/trees/wildlife-species', function (Request $req, Response $res) use ($getWildlifeSpecies) {
            try {
                $result = $getWildlifeSpecies->execute();
                return Json::ok($res, $result, 200);
            } catch (\Throwable $e) {
                error_log('[GET /trees/wildlife-species] ' . $e->getMessage());
                return Json::ok($res, ['error' => 'Unexpected server error'], 500);
            }
        });
    }

    public static function registerWildlifeHealthProtected(
        $routes,
        GetTreeWildlife $getTreeWildlife,
        CreateWildlife $createWildlife,
        GetTreeHealth $getTreeHealth,
        CreateHealth $createHealth
    ): void
    {
        // GET /trees/:id/wildlife (JWT required)
        $routes->get('/trees/{id}/wildlife', function (Request $req, Response $res, array $args) use ($getTreeWildlife) {
            $treeId = (int)($args['id'] ?? 0);
            if ($treeId <= 0) {
                return Json::ok($res, ['error' => 'Invalid tree id'], 400);
            }
            try {
                $items = $getTreeWildlife->execute($treeId);
                return Json::ok($res, $items, 200);
            } catch (\Throwable $e) {
                error_log('[GET /trees/' . $treeId . '/wildlife] ' . $e->getMessage());
                return Json::ok($res, ['error' => 'Unexpected server error'], 500);
            }
        });

        // POST /trees/:id/wildlife (JWT required)
        $routes->post('/trees/{id}/wildlife', function (Request $req, Response $res, array $args) use ($createWildlife) {
            $claims = $req->getAttribute('auth');
            if (!is_array($claims) || empty($claims['sub'])) {
                return Json::ok($res, ['error' => 'Unauthenticated'], 401);
            }

            $treeId = (int)($args['id'] ?? 0);
            if ($treeId <= 0) {
                return Json::ok($res, ['error' => 'Invalid tree id'], 400);
            }

            $body = $req->getParsedBody();
            if (!is_array($body)) {
                return Json::ok($res, ['error' => 'Invalid JSON body'], 400);
            }

            try {
                $result = $createWildlife->execute($treeId, (int)$claims['sub'], $body);
                return Json::ok($res, $result, 201);
            } catch (\InvalidArgumentException $e) {
                return Json::ok($res, ['error' => $e->getMessage()], 422);
            } catch (\Throwable $e) {
                error_log('[POST /trees/' . $treeId . '/wildlife] ' . $e->getMessage());
                return Json::ok($res, ['error' => 'Unexpected server error'], 500);
            }
        });

        // GET /trees/:id/health (JWT required)
        $routes->get('/trees/{id}/health', function (Request $req, Response $res, array $args) use ($getTreeHealth) {
            $treeId = (int)($args['id'] ?? 0);
            if ($treeId <= 0) {
                return Json::ok($res, ['error' => 'Invalid tree id'], 400);
            }
            try {
                $items = $getTreeHealth->execute($treeId);
                return Json::ok($res, $items, 200);
            } catch (\Throwable $e) {
                error_log('[GET /trees/' . $treeId . '/health] ' . $e->getMessage());
                return Json::ok($res, ['error' => 'Unexpected server error'], 500);
            }
        });

        // POST /trees/:id/health (JWT required)
        $routes->post('/trees/{id}/health', function (Request $req, Response $res, array $args) use ($createHealth) {
            $claims = $req->getAttribute('auth');
            if (!is_array($claims) || empty($claims['sub'])) {
                return Json::ok($res, ['error' => 'Unauthenticated'], 401);
            }

            $treeId = (int)($args['id'] ?? 0);
            if ($treeId <= 0) {
                return Json::ok($res, ['error' => 'Invalid tree id'], 400);
            }

            $body = $req->getParsedBody();
            if (!is_array($body)) {
                return Json::ok($res, ['error' => 'Invalid JSON body'], 400);
            }

            try {
                $result = $createHealth->execute($treeId, (int)$claims['sub'], $body);
                return Json::ok($res, $result, 201);
            } catch (\InvalidArgumentException $e) {
                return Json::ok($res, ['error' => $e->getMessage()], 422);
            } catch (\Throwable $e) {
                error_log('[POST /trees/' . $treeId . '/health] ' . $e->getMessage());
                return Json::ok($res, ['error' => 'Unexpected server error'], 500);
            }
        });
   
    }

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
        GetLatestTreeDetails $getLatestTreeDetails,
        GetTreeDetails $getTreeDetails,
    ): void
    {
        // GET /trees/:id/latest-details (JWT required)
        $routes->get('/trees/{id}/latest-details', function (Request $req, Response $res, array $args) use ($getLatestTreeDetails) {
            $treeId = (int)($args['id'] ?? 0);
            if ($treeId <= 0) {
                return Json::ok($res, ['error' => 'Invalid tree id'], 400);
            }
            try {
                $result = $getLatestTreeDetails->execute($treeId);
                return Json::ok($res, $result ?? [], 200);
            } catch (\Throwable $e) {
                error_log('[GET /trees/' . $treeId . '/latest-details] ' . $e->getMessage());
                return Json::ok($res, ['error' => 'Unexpected server error'], 500);
            }
        });

        // GET /trees/:id/details (JWT required)
        $routes->get('/trees/{id}/details', function (Request $req, Response $res, array $args) use ($getTreeDetails) {
            $treeId = (int)($args['id'] ?? 0);
            if ($treeId <= 0) {
                return Json::ok($res, ['error' => 'Invalid tree id'], 400);
            }

            $query = $req->getQueryParams();
            
            try {
                $result = $getTreeDetails->execute($treeId, $query);
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

            $query = $req->getQueryParams();

            try {
                $items = $getTreeObservations->execute($treeId, $query);
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
                error_log('[POST /trees] ' . $e->getMessage());
                return Json::ok($res, ['error' => 'Unexpected server error'], 500);
            }
        });
    }

    public static function registerAdmin($routes,
        ApproveTree $approveTree,
        ApproveEverythingForTree $approveEverythingForTree,
        ApproveObservation $approveObservation,
        ApproveTreeDetail $approveTreeDetail,
        RejectTree $rejectTree,
        RejectEverythingForTree $rejectEverythingForTree,
        RejectObservation $rejectObservation,
        RejectTreeDetail $rejectTreeDetail
    ): void
    {
        // POST /trees/:id/approve (JWT required)
        $routes->post('/trees/{id}/approve', function (Request $req, Response $res, array $args) use ($approveTree) {
            $claims = $req->getAttribute('auth');
            if (!is_array($claims) || empty($claims['sub'])) {
                return Json::ok($res, ['error' => 'Unauthenticated'], 401);
            }

            $treeId = (int)($args['id'] ?? 0);
            if ($treeId <= 0) {
                return Json::ok($res, ['error' => 'Invalid tree id'], 400);
            }
            try {
                $approveTree->execute($treeId);
                return Json::ok($res, ['ok' => true], 200);
            } catch (\InvalidArgumentException $e) {
                return Json::ok($res, ['error' => $e->getMessage()], 422);
            } catch (\Throwable $e) {
                error_log('[POST /trees/' . $treeId . '/approve] ' . $e->getMessage());
                return Json::ok($res, ['error' => 'Unexpected server error'], 500);
            }
        });

        // POST /trees/:id/approve-everything (JWT required)
        $routes->post('/trees/{id}/approve-everything', function (Request $req, Response $res, array $args) use ($approveEverythingForTree) {
            $claims = $req->getAttribute('auth');
            if (!is_array($claims) || empty($claims['sub'])) {
                return Json::ok($res, ['error' => 'Unauthenticated'], 401);
            }

            $treeId = (int)($args['id'] ?? 0);
            if ($treeId <= 0) {
                return Json::ok($res, ['error' => 'Invalid tree id'], 400);
            }
            try {
                $approveEverythingForTree->execute($treeId);
                return Json::ok($res, ['ok' => true], 200);
            } catch (\InvalidArgumentException $e) {
                return Json::ok($res, ['error' => $e->getMessage()], 422);
            } catch (\Throwable $e) {
                error_log('[POST /trees/' . $treeId . '/approveEverything] ' . $e->getMessage());
                return Json::ok($res, ['error' => 'Unexpected server error'], 500);
            }
        });

        //POST /trees/:id/observations/:id/approve (JWT required)
        $routes->post('/trees/{treeId}/observations/{observationId}/approve', function (Request $req, Response $res, array $args) use ($approveObservation) {
            $claims = $req->getAttribute('auth');
            if (!is_array($claims) || empty($claims['sub'])) {
                return Json::ok($res, ['error' => 'Unauthenticated'], 401);
            }   

            $treeId = (int)($args['treeId'] ?? 0);
            if ($treeId <= 0) {
                return Json::ok($res, ['error' => 'Invalid tree id'], 400);
            }

            $observationId = (int)($args['observationId'] ?? 0);
            if ($observationId <= 0) {
                return Json::ok($res, ['error' => 'Invalid observation id'], 400);
            }   
            try {                
                $approveObservation->execute($observationId);
                return Json::ok($res, ['ok' => true], 200);
            } catch (\InvalidArgumentException $e) {
                return Json::ok($res, ['error' => $e->getMessage()], 422);
            } catch (\Throwable $e) {
                error_log('[POST /trees/' . $treeId . '/observations/' . $observationId . '/approve] ' . $e->getMessage());
                return Json::ok($res, ['error' => 'Unexpected server error'], 500);
            }
        });

        // POST /trees/:id/details/:id/approve (JWT required)
        $routes->post('/trees/{treeId}/details/{detailId}/approve', function (Request $req, Response $res, array $args) use ($approveTreeDetail) {
            $claims = $req->getAttribute('auth');
            if (!is_array($claims) || empty($claims['sub'])) {
                return Json::ok($res, ['error' => 'Unauthenticated'], 401);
            }   

            $treeId = (int)($args['treeId'] ?? 0);
            if ($treeId <= 0) {
                return Json::ok($res, ['error' => 'Invalid tree id'], 400);
            }

            $detailId = (int)($args['detailId'] ?? 0);
            if ($detailId <= 0) {
                return Json::ok($res, ['error' => 'Invalid detail id'], 400);
            }   
            try {                
                $approveTreeDetail->execute($detailId);
                return Json::ok($res, ['ok' => true], 200);
            } catch (\InvalidArgumentException $e) {
                return Json::ok($res, ['error' => $e->getMessage()], 422);
            } catch (\Throwable $e) {
                error_log('[POST /trees/' . $treeId . '/details/' . $detailId . '/approve] ' . $e->getMessage());
                return Json::ok($res, ['error' => 'Unexpected server error'], 500);
            }
        });

        // POST /trees/:id/reject (JWT required)
        $routes->post('/trees/{id}/reject', function (Request $req, Response $res, array $args) use ($rejectTree) {
            $claims = $req->getAttribute('auth');
            if (!is_array($claims) || empty($claims['sub'])) {
                return Json::ok($res, ['error' => 'Unauthenticated'], 401);
            }

            $treeId = (int)($args['id'] ?? 0);
            if ($treeId <= 0) {
                return Json::ok($res, ['error' => 'Invalid tree id'], 400);
            }
            try {
                $rejectTree->execute($treeId);
                return Json::ok($res, ['ok' => true], 200);
            } catch (\InvalidArgumentException $e) {
                return Json::ok($res, ['error' => $e->getMessage()], 422);
            } catch (\Throwable $e) {
                error_log('[POST /trees/' . $treeId . '/reject] ' . $e->getMessage());
                return Json::ok($res, ['error' => 'Unexpected server error'], 500);
            }
        });

        // POST /trees/:id/reject-everything (JWT required)
        $routes->post('/trees/{id}/reject-everything', function (Request $req, Response $res, array $args) use ($rejectEverythingForTree) {
            $claims = $req->getAttribute('auth');
            if (!is_array($claims) || empty($claims['sub'])) {
                return Json::ok($res, ['error' => 'Unauthenticated'], 401);
            }
            $treeId = (int)($args['id'] ?? 0);
            if ($treeId <= 0) {
                return Json::ok($res, ['error' => 'Invalid tree id'], 400);
            }
            try {
                $rejectEverythingForTree->execute($treeId);
                return Json::ok($res, ['ok' => true], 200);
            } catch (\InvalidArgumentException $e) {
                return Json::ok($res, ['error' => $e->getMessage()], 422);
            } catch (\Throwable $e) {
                error_log('[POST /trees/' . $treeId . '/rejectEverything] ' . $e->getMessage());
                return Json::ok($res, ['error' => 'Unexpected server error'], 500);
            }
        });

        // POST /trees/:id/observations/:id/reject (JWT required)
        $routes->post('/trees/{treeId}/observations/{observationId}/reject', function (Request $req, Response $res, array $args) use ($rejectObservation) {
            $claims = $req->getAttribute('auth');
            if (!is_array($claims) || empty($claims['sub'])) {
                return Json::ok($res, ['error' => 'Unauthenticated'], 401);
            } 
            $treeId = (int)($args['treeId'] ?? 0);
            if ($treeId <= 0) {
                return Json::ok($res, ['error' => 'Invalid tree id'], 400);
            }
            $observationId = (int)($args['observationId'] ?? 0);
            if ($observationId <= 0) {
                return Json::ok($res, ['error' => 'Invalid observation id'], 400);
            }
            try {
                $rejectObservation->execute($observationId);
                return Json::ok($res, ['ok' => true], 200);
            } catch (\InvalidArgumentException $e) {
                return Json::ok($res, ['error' => $e->getMessage()], 422);
            } catch (\Throwable $e) {
                error_log('[POST /trees/' . $treeId . '/observations/' . $observationId . '/reject] ' . $e->getMessage());
                return Json::ok($res, ['error' => 'Unexpected server error'], 500);
            }
        });

        // POST /trees/:id/details/:id/reject (JWT required)
        $routes->post('/trees/{treeId}/details/{detailId}/reject', function (Request $req, Response $res, array $args) use ($rejectTreeDetail) {        
            $claims = $req->getAttribute('auth');
            if (!is_array($claims) || empty($claims['sub'])) {
                return Json::ok($res, ['error' => 'Unauthenticated'], 401);
            } 
            $treeId = (int)($args['treeId'] ?? 0);
            if ($treeId <= 0) {
                return Json::ok($res, ['error' => 'Invalid tree id'], 400);
            }
            $detailId = (int)($args['detailId'] ?? 0);
            if ($detailId <= 0) {
                return Json::ok($res, ['error' => 'Invalid detail id'], 400);
            }
            try {
                $rejectTreeDetail->execute($detailId);
                return Json::ok($res, ['ok' => true], 200);
            } catch (\InvalidArgumentException $e) {
                return Json::ok($res, ['error' => $e->getMessage()], 422);
            } catch (\Throwable $e) {
                error_log('[POST /trees/' . $treeId . '/details/' . $detailId . '/reject] ' . $e->getMessage());
                return Json::ok($res, ['error' => 'Unexpected server error'], 500);
            }
        });
    }
}