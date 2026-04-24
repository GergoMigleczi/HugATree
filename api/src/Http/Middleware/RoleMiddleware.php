<?php
declare(strict_types=1);

namespace App\Http\Middleware;

use App\Domain\UserRole;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface as Handler;
use Slim\Psr7\Response as SlimResponse;

final class RoleMiddleware implements MiddlewareInterface {
    /** @param UserRole[] $allowedRoles */
    public function __construct(private array $allowedRoles) {}

    public function process(Request $request, Handler $handler): Response {
        $claims = $request->getAttribute("auth");
        if (!$claims || !isset($claims['role'])) {
            return $this->forbidden("Missing role claim");
        }

        $role = UserRole::tryFrom((string)$claims['role']);
        if (!$role || !in_array($role, $this->allowedRoles, true)) {
            return $this->forbidden("Insufficient permissions");
        }

        return $handler->handle($request);
    }

    private function forbidden(string $msg): Response {
        $res = new SlimResponse(403);
        $res->getBody()->write(json_encode(["error" => $msg], JSON_UNESCAPED_SLASHES));
        return $res->withHeader("Content-Type", "application/json");
    }
}
