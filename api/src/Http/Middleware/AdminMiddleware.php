<?php
declare(strict_types=1);

namespace App\Http\Middleware;

use App\Application\Ports\UserRepository;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface as Handler;
use Slim\Psr7\Response as SlimResponse;

final class AdminMiddleware implements MiddlewareInterface {
  public function __construct(private UserRepository $users) {}

  public function process(Request $request, Handler $handler): Response {
    $auth = (array)$request->getAttribute("auth");
    $userId = (int)($auth["sub"] ?? 0);
    if ($userId <= 0) return $this->forbidden("Invalid token");

    $user = $this->users->findById($userId);
    if (!$user || !$user["admin_flag"]) return $this->forbidden("Admin access required");

    return $handler->handle($request);
  }

  private function forbidden(string $msg): Response {
    $res = new SlimResponse(403);
    $res->getBody()->write(json_encode(["error" => $msg], JSON_UNESCAPED_SLASHES));
    return $res->withHeader("Content-Type", "application/json");
  }
}
