<?php
declare(strict_types=1);

namespace App\Http\Routes;

use App\Application\UseCase\GetMe;
use App\Http\Json;
use App\Http\Middleware\AuthMiddleware;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\App;
use Slim\Psr7\Response;

final class MeRoutes {
  public static function register(App $app, GetMe $getMe): void {
    $app->get("/me", function (Request $req, Response $res) use ($getMe) {
      try {
        $auth = (array)$req->getAttribute("auth");
        $userId = (int)($auth["sub"] ?? 0);
        if ($userId <= 0) return Json::ok($res, ["error" => "Invalid token"], 401);

        $user = $getMe->execute($userId);
        return Json::ok($res, ["user" => $user], 200);
      } catch (\RuntimeException $e) {
        $code = $e->getCode();
        $status = ($code >= 400 && $code <= 599) ? $code : 500;
        return Json::ok($res, ["error" => $e->getMessage()], $status);
      } catch (\Throwable $e) {
        return Json::ok($res, ["error" => "Server error"], 500);
      }
    })->add(new AuthMiddleware());
  }
}