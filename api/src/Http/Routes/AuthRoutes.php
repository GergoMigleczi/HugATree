<?php
declare(strict_types=1);

namespace App\Http\Routes;

use App\Application\UseCase\LoginUser;
use App\Application\UseCase\LogoutSession;
use App\Application\UseCase\RefreshSession;
use App\Application\UseCase\RegisterUser;
use App\Http\Json;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\App;
use Slim\Psr7\Response;

final class AuthRoutes {
  public static function register(
    App $app,
    RegisterUser $registerUser,
    LoginUser $loginUser,
    RefreshSession $refreshSession,
    LogoutSession $logoutSession
  ): void {

    $app->post("/auth/register", function (Request $req, Response $res) use ($registerUser) {
      try {
        $body = (array)$req->getParsedBody();
        $email = (string)($body["email"] ?? "");
        $password = (string)($body["password"] ?? "");
        $displayName = isset($body["display_name"]) ? trim((string)$body["display_name"]) : null;

        $user = $registerUser->execute($email, $password, $displayName);
        return Json::ok($res, ["user" => $user], 201);
      } catch (\InvalidArgumentException $e) {
        return Json::ok($res, ["error" => $e->getMessage()], 400);
      } catch (\RuntimeException $e) {
        $code = $e->getCode();
        $status = ($code >= 400 && $code <= 599) ? $code : 500;
        return Json::ok($res, ["error" => $e->getMessage()], $status);
      } catch (\Throwable $e) {
        return Json::ok($res, ["error" => "Server error"], 500);
      }
    });

    $app->post("/auth/login", function (Request $req, Response $res) use ($loginUser) {
      try {
        $body = (array)$req->getParsedBody();
        $email = (string)($body["email"] ?? "");
        $password = (string)($body["password"] ?? "");
        $deviceLabel = isset($body["device_label"]) ? trim((string)$body["device_label"]) : null;

        $userAgent = $req->getHeaderLine("User-Agent") ?: null;
        $ip = $req->getServerParams()["REMOTE_ADDR"] ?? null;

        $result = $loginUser->execute($email, $password, $deviceLabel, $userAgent, $ip);
        return Json::ok($res, $result, 200);
      } catch (\InvalidArgumentException $e) {
        return Json::ok($res, ["error" => $e->getMessage()], 400);
      } catch (\RuntimeException $e) {
        $code = $e->getCode();
        $status = ($code >= 400 && $code <= 599) ? $code : 500;
        return Json::ok($res, ["error" => $e->getMessage()], $status);
      } catch (\Throwable $e) {
        return Json::ok($res, ["error" => "Server error"], 500);
      }
    });

    $app->post("/auth/refresh", function (Request $req, Response $res) use ($refreshSession) {
      try {
        $body = (array)$req->getParsedBody();
        $refreshToken = (string)($body["refreshToken"] ?? "");

        $result = $refreshSession->execute($refreshToken);
        return Json::ok($res, $result, 200);
      } catch (\InvalidArgumentException $e) {
        return Json::ok($res, ["error" => $e->getMessage()], 400);
      } catch (\RuntimeException $e) {
        $code = $e->getCode();
        $status = ($code >= 400 && $code <= 599) ? $code : 500;
        return Json::ok($res, ["error" => $e->getMessage()], $status);
      } catch (\Throwable $e) {
        return Json::ok($res, ["error" => "Server error"], 500);
      }
    });

    $app->post("/auth/logout", function (Request $req, Response $res) use ($logoutSession) {
      try {
        $body = (array)$req->getParsedBody();
        $refreshToken = (string)($body["refreshToken"] ?? "");

        $logoutSession->execute($refreshToken);
        return Json::ok($res, ["ok" => true], 200);
      } catch (\InvalidArgumentException $e) {
        return Json::ok($res, ["error" => $e->getMessage()], 400);
      } catch (\RuntimeException $e) {
        $code = $e->getCode();
        $status = ($code >= 400 && $code <= 599) ? $code : 500;
        return Json::ok($res, ["error" => $e->getMessage()], $status);
      } catch (\Throwable $e) {
        return Json::ok($res, ["error" => "Server error"], 500);
      }
    });
  }
}