<?php
declare(strict_types=1);

namespace App\Http;

use Slim\Psr7\Response;

final class Json {
  public static function ok(Response $res, array $data, int $status = 200): Response {
    $res = $res->withStatus($status)->withHeader("Content-Type", "application/json");
    $res->getBody()->write(json_encode($data, JSON_UNESCAPED_SLASHES));
    return $res;
  }
}