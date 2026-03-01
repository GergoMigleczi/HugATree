<?php
declare(strict_types=1);

use App\Http\Json;
use App\Http\Routes\AuthRoutes;
use App\Http\Routes\MeRoutes;
use App\Http\Routes\TreesRoutes;
use App\Http\Middleware\AuthMiddleware;

use App\Infrastructure\Persistence\DbConnection;
use App\Infrastructure\Persistence\PdoSessionRepository;
use App\Infrastructure\Persistence\PdoUserRepository;
use App\Infrastructure\Persistence\PdoDbTransaction;
use App\Infrastructure\Persistence\PdoTreeRepository;
use App\Infrastructure\Persistence\PdoObservationRepository;
use App\Infrastructure\Persistence\PdoTreeDetailHistoryRepository;
use App\Infrastructure\Persistence\PdoObservationPhotoRepository;
use App\Infrastructure\Persistence\PdoSpeciesRepository;

use App\Infrastructure\Security\JwtTokenService;
use App\Infrastructure\Security\PhpPasswordHasher;

use App\Application\UseCase\GetMe;
use App\Application\UseCase\LoginUser;
use App\Application\UseCase\LogoutSession;
use App\Application\UseCase\RefreshSession;
use App\Application\UseCase\RegisterUser;
use App\Application\UseCase\CreateTree;
use App\Application\UseCase\GetTreesInBbox;
use App\Application\UseCase\GetSpecies;

use Dotenv\Dotenv;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Factory\AppFactory;
use Slim\Psr7\Response;

require_once __DIR__ . '/../vendor/autoload.php';

$dotenv = Dotenv::createImmutable(__DIR__ . "/..");
$dotenv->load();

$app = AppFactory::create();
$app->addBodyParsingMiddleware();

// DEV error settings (do NOT enable in prod)
ini_set('display_errors', '1');
ini_set('display_startup_errors', '1');
error_reporting(E_ALL);

$displayErrorDetails = true; // set false in prod
$logErrors = true;
$logErrorDetails = true;

$app->addErrorMiddleware($displayErrorDetails, $logErrors, $logErrorDetails);

// --- infrastructure wiring ---
$pdo = DbConnection::make();

$userRepo = new PdoUserRepository($pdo);
$sessionRepo = new PdoSessionRepository($pdo);
$passwordHasher = new PhpPasswordHasher();
$tokenService = new JwtTokenService();

// --- trees infrastructure ---
$tx = new PdoDbTransaction($pdo);
$treeRepo = new PdoTreeRepository($pdo);
$observationRepo = new PdoObservationRepository($pdo);
$treeDetailRepo = new PdoTreeDetailHistoryRepository($pdo);
$photoRepo = new PdoObservationPhotoRepository($pdo);
$speciesRepo = new PdoSpeciesRepository($pdo);

// --- use cases ---
$registerUser = new RegisterUser($userRepo, $passwordHasher);
$loginUser = new LoginUser($userRepo, $sessionRepo, $passwordHasher, $tokenService);
$refreshSession = new RefreshSession($sessionRepo, $tokenService);
$logoutSession = new LogoutSession($sessionRepo);
$getMe = new GetMe($userRepo);
$getTreesInBbox = new GetTreesInBbox($treeRepo);
$getSpecies = new GetSpecies($speciesRepo);

// --- trees use case ---
$createTree = new CreateTree(
  $tx,
  $treeRepo,
  $observationRepo,
  $treeDetailRepo,
  $photoRepo
);

// --- routes ---
$app->get("/health", function (Request $req, Response $res) use ($pdo) {
  $pdo->query("SELECT 1");
  return Json::ok($res, ["ok" => true], 200);
});

// Public trees endpoints
AuthRoutes::register($app, $registerUser, $loginUser, $refreshSession, $logoutSession);
MeRoutes::register($app, $getMe);

TreesRoutes::registerPublic($app, $getTreesInBbox, $getSpecies);

// Protected trees endpoints (JWT required)
$app->group('', function ($group) use ($createTree) {
  TreesRoutes::registerProtected($group, $createTree);
})->add(new AuthMiddleware());

$app->run();