<?php
declare(strict_types=1);

namespace App\Http\Routes;

use App\Application\UseCase\GetAllUsers;
use App\Application\UseCase\SetUserActive;
use App\Http\Json;
use App\Http\Middleware\AdminMiddleware;
use App\Http\Middleware\AuthMiddleware;
use App\Application\Ports\UserRepository;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\App;
use Slim\Psr7\Response;

final class AdminRoutes {
  public static function register(
    App $app,
    GetAllUsers $getAllUsers,
    SetUserActive $setUserActive,
    UserRepository $userRepo
  ): void {
    $app->group('/admin', function ($group) use ($getAllUsers, $setUserActive) {
      $group->get('/users', function (Request $req, Response $res) use ($getAllUsers) {
        try {
          $users = $getAllUsers->execute();
          return Json::ok($res, ["users" => $users], 200);
        } catch (\Throwable $e) {
          return Json::ok($res, ["error" => "Server error"], 500);
        }
      });

      $group->patch('/users/{id}/active', function (Request $req, Response $res, array $args) use ($setUserActive) {
        try {
          $auth = (array)$req->getAttribute("auth");
          $requesterId = (int)($auth["sub"] ?? 0);
          $targetId = (int)($args["id"] ?? 0);
          if ($targetId <= 0) return Json::ok($res, ["error" => "Invalid user id"], 400);

          $body = (array)$req->getParsedBody();
          $active = (bool)($body["active"] ?? false);

          $setUserActive->execute($targetId, $requesterId, $active);
          return Json::ok($res, ["ok" => true], 200);
        } catch (\RuntimeException $e) {
          $code = $e->getCode();
          $status = ($code >= 400 && $code <= 599) ? $code : 500;
          return Json::ok($res, ["error" => $e->getMessage()], $status);
        } catch (\Throwable $e) {
          return Json::ok($res, ["error" => "Server error"], 500);
        }
      });
    })
    ->add(new AdminMiddleware($userRepo))
    ->add(new AuthMiddleware());
  }
}
