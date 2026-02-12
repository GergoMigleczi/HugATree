<?php
declare(strict_types=1);

namespace App\Http\Middleware;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface as Handler;
use Slim\Psr7\Response as SlimResponse;

final class AuthMiddleware implements MiddlewareInterface {
  public function process(Request $request, Handler $handler): Response {
    $auth = $request->getHeaderLine("Authorization");
    if (!preg_match('/^Bearer\s+(.+)$/i', $auth, $m)) {
      return $this->unauthorized("Missing Bearer token");
    }

    try {
      $jwt = $m[1];
      $decoded = JWT::decode($jwt, new Key($_ENV['JWT_SECRET'], "HS256"));
      $claims = (array)$decoded;

      $request = $request->withAttribute("auth", $claims);
      return $handler->handle($request);
    } catch (\Throwable $e) {
      return $this->unauthorized("Invalid or expired token");
    }
  }

  private function unauthorized(string $msg): Response {
    $res = new SlimResponse(401);
    $res->getBody()->write(json_encode(["error" => $msg], JSON_UNESCAPED_SLASHES));
    return $res->withHeader("Content-Type", "application/json");
  }
}