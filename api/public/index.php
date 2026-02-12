<?php
declare(strict_types=1);

use App\Http\Json;
use App\Http\Routes\AuthRoutes;
use App\Http\Routes\MeRoutes;
use App\Infrastructure\Persistence\DbConnection;
use App\Infrastructure\Persistence\PdoSessionRepository;
use App\Infrastructure\Persistence\PdoUserRepository;
use App\Infrastructure\Security\JwtTokenService;
use App\Infrastructure\Security\PhpPasswordHasher;
use App\Application\UseCase\GetMe;
use App\Application\UseCase\LoginUser;
use App\Application\UseCase\LogoutSession;
use App\Application\UseCase\RefreshSession;
use App\Application\UseCase\RegisterUser;
use Dotenv\Dotenv;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Factory\AppFactory;
use Slim\Psr7\Response;

require_once __DIR__ . '/../vendor/autoload.php';

$dotenv = Dotenv::createImmutable(__DIR__ . "/..");
$dotenv->load();

$app = AppFactory::create();
$app->addBodyParsingMiddleware();

// --- infrastructure wiring ---
$pdo = DbConnection::make();

$userRepo = new PdoUserRepository($pdo);
$sessionRepo = new PdoSessionRepository($pdo);
$passwordHasher = new PhpPasswordHasher();
$tokenService = new JwtTokenService();

// --- use cases ---
$registerUser = new RegisterUser($userRepo, $passwordHasher);
$loginUser = new LoginUser($userRepo, $sessionRepo, $passwordHasher, $tokenService);
$refreshSession = new RefreshSession($sessionRepo, $tokenService);
$logoutSession = new LogoutSession($sessionRepo);
$getMe = new GetMe($userRepo);

// --- routes ---
$app->get("/health", function (Request $req, Response $res) use ($pdo) {
  $pdo->query("SELECT 1");
  return Json::ok($res, ["ok" => true], 200);
});

AuthRoutes::register($app, $registerUser, $loginUser, $refreshSession, $logoutSession);
MeRoutes::register($app, $getMe);

$app->run();