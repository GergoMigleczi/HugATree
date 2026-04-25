<?php
declare(strict_types=1);

namespace App\Http\Routes;

use App\Application\UseCase\DeactivateUser;
use App\Application\UseCase\GetAdminUsers;
use App\Application\Ports\UserRepository;
use App\Http\Json;
use App\Http\Middleware\AdminMiddleware;
use App\Http\Middleware\AuthMiddleware;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\App;
use Slim\Psr7\Response;

final class AdminRoutes {
  public static function register(
    App $app,
    GetAdminUsers $getAdminUsers,
    DeactivateUser $deactivateUser,
    UserRepository $userRepo
  ): void {
    $adminMiddleware = new AdminMiddleware($userRepo);

    $app->group("/admin", function ($group) use ($getAdminUsers, $deactivateUser) {
      $group->get("/users", function (Request $req, Response $res) use ($getAdminUsers) {
        try {
          $users = $getAdminUsers->execute();
          return Json::ok($res, ["users" => $users], 200);
        } catch (\RuntimeException $e) {
          $code = $e->getCode();
          $status = ($code >= 400 && $code <= 599) ? $code : 500;
          return Json::ok($res, ["error" => $e->getMessage()], $status);
        } catch (\Throwable) {
          return Json::ok($res, ["error" => "Server error"], 500);
        }
      });

      $group->delete("/users/{id}", function (Request $req, Response $res, array $args) use ($deactivateUser) {
        try {
          $auth = (array)$req->getAttribute("auth");
          $requesterId = (int)($auth["sub"] ?? 0);
          $targetId = (int)$args["id"];

          $deactivateUser->execute($targetId, $requesterId);
          return Json::ok($res, ["ok" => true], 200);
        } catch (\RuntimeException $e) {
          $code = $e->getCode();
          $status = ($code >= 400 && $code <= 599) ? $code : 500;
          return Json::ok($res, ["error" => $e->getMessage()], $status);
        } catch (\Throwable) {
          return Json::ok($res, ["error" => "Server error"], 500);
        }
      });
    })
    ->add($adminMiddleware)
    ->add(new AuthMiddleware());
  }
}
