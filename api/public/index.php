<?php
declare(strict_types=1);

use App\Http\Json;
use App\Http\Routes\AuthRoutes;
use App\Http\Routes\AdminRoutes;
use App\Http\Routes\MeRoutes;
use App\Http\Routes\PhotoRoutes;
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
use App\Infrastructure\Persistence\PdoWildlifeSpeciesRepository;
use App\Infrastructure\Persistence\PdoWildlifeRepository;
use App\Infrastructure\Persistence\PdoHealthRepository;

use App\Infrastructure\Security\JwtTokenService;
use App\Infrastructure\Security\PhpPasswordHasher;
use App\Infrastructure\Storage\LocalFileStorageService;

use App\Application\Service\TreeMetricsCalculator;
use App\Application\Service\WeatherSummaryService;

use App\Application\UseCase\GetMe;
use App\Application\UseCase\GetUser;
use App\Application\UseCase\LoginUser;
use App\Application\UseCase\UploadPhoto;
use App\Application\UseCase\LogoutSession;
use App\Application\UseCase\RefreshSession;
use App\Application\UseCase\RegisterUser;
use App\Application\UseCase\CreateTree;
use App\Application\UseCase\GetTreesInBbox;
use App\Application\UseCase\GetSpecies;
use App\Application\UseCase\GetTreeObservations;
use App\Application\UseCase\AddObservation;
use App\Application\UseCase\GetTreeDetails;
use App\Application\UseCase\GetTree;
use App\Application\UseCase\GetWildlifeSpecies;
use App\Application\UseCase\GetTreeWildlife;
use App\Application\UseCase\CreateWildlife;
use App\Application\UseCase\GetTreeHealth;
use App\Application\UseCase\CreateHealth;
use App\Application\UseCase\SetTreeApprovalStatus;
use App\Application\UseCase\SetUserRole;
use App\Application\UseCase\DeactivateUser;
use App\Application\UseCase\AssignTreeGuardian;

use Dotenv\Dotenv;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Factory\AppFactory;
use Slim\Psr7\Response;

require_once __DIR__ . '/../vendor/autoload.php';

$dotenv = Dotenv::createImmutable(__DIR__ . "/..");
$dotenv->safeLoad();

$app = AppFactory::create();

// CORS
$app->options('/{routes:.+}', function (Request $request, Response $response) {
    return $response;
});

$app->add(function (Request $request, $handler): Response {
    if ($request->getMethod() === 'OPTIONS') {
        $response = new Response();
    } else {
        $response = $handler->handle($request);
    }

    return $response
        ->withHeader('Access-Control-Allow-Origin', '*')
        ->withHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
});

$app->addBodyParsingMiddleware();

// DEV error settings (do NOT enable in prod)
ini_set('display_errors', '0');
ini_set('display_startup_errors', '0');
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
$wildlifeSpeciesRepo = new PdoWildlifeSpeciesRepository($pdo);
$wildlifeRepo = new PdoWildlifeRepository($pdo);
$healthRepo = new PdoHealthRepository($pdo);

// --- file storage ---
$fileStorage = new LocalFileStorageService($_ENV['UPLOADS_PATH'] ?? '/var/uploads');
$uploadPhoto = new UploadPhoto($fileStorage);

// --- services ---
$metricsCalculator = new TreeMetricsCalculator();
$weatherSummaryService = new WeatherSummaryService();

// --- use cases ---
$registerUser = new RegisterUser($userRepo, $passwordHasher);
$loginUser = new LoginUser($userRepo, $sessionRepo, $passwordHasher, $tokenService);
$refreshSession = new RefreshSession($sessionRepo, $tokenService);
$logoutSession = new LogoutSession($sessionRepo);
$getMe = new GetMe($userRepo);
$getUser = new GetUser($userRepo);
$setUserRole = new SetUserRole($userRepo);
$deactivateUser = new DeactivateUser($userRepo);
$getTreesInBbox = new GetTreesInBbox($treeRepo);
$getSpecies = new GetSpecies($speciesRepo);
$getTreeObservations = new GetTreeObservations($observationRepo);
$addObservation = new AddObservation($tx, $observationRepo, $photoRepo, $treeDetailRepo, $treeRepo, $metricsCalculator, $weatherSummaryService);
$getTreeDetails = new GetTreeDetails($treeDetailRepo);
$getTree = new GetTree($treeRepo, $treeDetailRepo);
$setTreeApprovalStatus = new SetTreeApprovalStatus($treeRepo);
$assignTreeGuardian = new AssignTreeGuardian($treeRepo, $userRepo);

// --- trees use case ---
$createTree = new CreateTree(
  $tx,
  $treeRepo,
  $addObservation,
  $photoRepo
);
$getWildlifeSpecies = new GetWildlifeSpecies($wildlifeSpeciesRepo);
$getTreeWildlife = new GetTreeWildlife($wildlifeRepo);
$createWildlife = new CreateWildlife($tx, $addObservation, $wildlifeRepo);
$getTreeHealth = new GetTreeHealth($healthRepo);
$createHealth = new CreateHealth($tx, $addObservation, $healthRepo);

// --- routes ---
$app->get("/health", function (Request $req, Response $res) use ($pdo) {
  $pdo->query("SELECT 1");
  return Json::ok($res, ["ok" => true], 200);
});

// Public trees endpoints
AuthRoutes::register($app, $registerUser, $loginUser, $refreshSession, $logoutSession);
MeRoutes::register($app, $getMe);
AdminRoutes::register($app, $getUser, $setUserRole, $deactivateUser, $setTreeApprovalStatus, $assignTreeGuardian);

TreesRoutes::registerWildlifeSpeciesPublic($app, $getWildlifeSpecies);
TreesRoutes::registerPublic($app, $getTreesInBbox, $getSpecies, $getTree);
PhotoRoutes::registerPublic($app, $fileStorage);

// Protected endpoints (JWT required)
$app->group('', function ($group) use ($createTree, $treeRepo, $getTreeObservations, $addObservation, $getTreeDetails, $uploadPhoto, $getTreeWildlife, $createWildlife, $getTreeHealth, $createHealth) {
  TreesRoutes::registerProtected($group, $createTree, $treeRepo, $getTreeObservations, $addObservation, $getTreeDetails);
  TreesRoutes::registerWildlifeHealthProtected($group, $getTreeWildlife, $createWildlife, $getTreeHealth, $createHealth);
  PhotoRoutes::registerProtected($group, $uploadPhoto);
})->add(new AuthMiddleware());

$routeCollector = $app->getRouteCollector();
$routes = $routeCollector->getRoutes();

$app->run();