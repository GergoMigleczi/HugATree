<?php
declare(strict_types=1);

namespace App\Http\Routes;

use App\Application\UseCase\AssignTreeGuardian;
use App\Application\UseCase\DeactivateUser;
use App\Application\UseCase\GetUser;
use App\Application\UseCase\SetTreeApprovalStatus;
use App\Application\UseCase\SetUserRole;
use App\Domain\UserRole;
use App\Http\Json;
use App\Http\Middleware\AuthMiddleware;
use App\Http\Middleware\RoleMiddleware;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\App;

final class AdminRoutes {
  public static function register(
    App $app,
    GetUser $getUser,
    SetUserRole $setUserRole,
    DeactivateUser $deactivateUser,
    SetTreeApprovalStatus $setTreeApprovalStatus,
    AssignTreeGuardian $assignGuardian
  ): void {
    $adminOnly = new RoleMiddleware([UserRole::ADMIN]);

    // GET /admin/users/{id}
    $app->get('/admin/users/{id}', function (Request $req, Response $res, array $args) use ($getUser) {
      $userId = (int)($args['id'] ?? 0);
      if ($userId <= 0) {
        return Json::ok($res, ['error' => 'Invalid user id'], 400);
      }

      try {
        $user = $getUser->execute($userId);
        return Json::ok($res, ['user' => $user], 200);
      } catch (\RuntimeException $e) {
        $code = $e->getCode();
        $status = ($code >= 400 && $code <= 599) ? $code : 500;
        return Json::ok($res, ['error' => $e->getMessage()], $status);
      } catch (\Throwable $e) {
        return Json::ok($res, ['error' => 'Unexpected server error'], 500);
      }
    })->add($adminOnly)->add(new AuthMiddleware());

    // POST /admin/users/{id}/role
    $app->post('/admin/users/{id}/role', function (Request $req, Response $res, array $args) use ($setUserRole) {
      $userId = (int)($args['id'] ?? 0);
      $body = (array)$req->getParsedBody();
      $role = isset($body['role']) ? (string)$body['role'] : '';

      if ($userId <= 0) {
        return Json::ok($res, ['error' => 'Invalid user id'], 400);
      }

      try {
        $setUserRole->execute($userId, $role);
        return Json::ok($res, ['ok' => true], 200);
      } catch (\InvalidArgumentException $e) {
        return Json::ok($res, ['error' => $e->getMessage()], 422);
      } catch (\RuntimeException $e) {
        $code = $e->getCode();
        $status = ($code >= 400 && $code <= 599) ? $code : 500;
        return Json::ok($res, ['error' => $e->getMessage()], $status);
      } catch (\Throwable $e) {
        return Json::ok($res, ['error' => 'Unexpected server error'], 500);
      }
    })->add($adminOnly)->add(new AuthMiddleware());

    // DELETE /admin/users/{id}
    $app->delete('/admin/users/{id}', function (Request $req, Response $res, array $args) use ($deactivateUser) {
      $userId = (int)($args['id'] ?? 0);
      if ($userId <= 0) {
        return Json::ok($res, ['error' => 'Invalid user id'], 400);
      }

      try {
        $deactivateUser->execute($userId);
        return Json::ok($res, ['ok' => true], 200);
      } catch (\RuntimeException $e) {
        $code = $e->getCode();
        $status = ($code >= 400 && $code <= 599) ? $code : 500;
        return Json::ok($res, ['error' => $e->getMessage()], $status);
      } catch (\Throwable $e) {
        return Json::ok($res, ['error' => 'Unexpected server error'], 500);
      }
    })->add($adminOnly)->add(new AuthMiddleware());

    // POST /admin/trees/{id}/approval
    $app->post('/admin/trees/{id}/approval', function (Request $req, Response $res, array $args) use ($setTreeApprovalStatus) {
      $treeId = (int)($args['id'] ?? 0);
      $body = (array)$req->getParsedBody();
      $status = isset($body['status']) ? (string)$body['status'] : '';

      if ($treeId <= 0) {
        return Json::ok($res, ['error' => 'Invalid tree id'], 400);
      }

      try {
        $setTreeApprovalStatus->execute($treeId, $status);
        return Json::ok($res, ['ok' => true], 200);
      } catch (\InvalidArgumentException $e) {
        return Json::ok($res, ['error' => $e->getMessage()], 422);
      } catch (\RuntimeException $e) {
        $code = $e->getCode();
        $status = ($code >= 400 && $code <= 599) ? $code : 500;
        return Json::ok($res, ['error' => $e->getMessage()], $status);
      } catch (\Throwable $e) {
        return Json::ok($res, ['error' => 'Unexpected server error'], 500);
      }
    })->add($adminOnly)->add(new AuthMiddleware());

    // POST /admin/trees/{id}/guardian
    $app->post('/admin/trees/{id}/guardian', function (Request $req, Response $res, array $args) use ($assignGuardian) {
      $treeId = (int)($args['id'] ?? 0);
      $body = (array)$req->getParsedBody();
      $userId = isset($body['userId']) ? (int)$body['userId'] : 0;

      if ($treeId <= 0 || $userId <= 0) {
        return Json::ok($res, ['error' => 'Invalid tree or user id'], 400);
      }

      try {
        $assignGuardian->execute($treeId, $userId);
        return Json::ok($res, ['ok' => true], 200);
      } catch (\RuntimeException $e) {
        $code = $e->getCode();
        $status = ($code >= 400 && $code <= 599) ? $code : 500;
        return Json::ok($res, ['error' => $e->getMessage()], $status);
      } catch (\Throwable $e) {
        return Json::ok($res, ['error' => 'Unexpected server error'], 500);
      }
    })->add($adminOnly)->add(new AuthMiddleware());
  }
}
