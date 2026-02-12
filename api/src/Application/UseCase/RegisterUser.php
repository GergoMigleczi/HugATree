<?php
declare(strict_types=1);

namespace App\Application\UseCase;

use App\Application\Ports\PasswordHasher;
use App\Application\Ports\UserRepository;

final class RegisterUser {
  public function __construct(
    private UserRepository $users,
    private PasswordHasher $hasher
  ) {}

  public function execute(string $email, string $password, ?string $displayName): array {
    $email = strtolower(trim($email));

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
      throw new \InvalidArgumentException("Invalid email");
    }
    if (strlen($password) < 8) {
      throw new \InvalidArgumentException("Password must be at least 8 characters");
    }

    if ($this->users->findByEmail($email)) {
      throw new \RuntimeException("Email already in use", 409);
    }

    $hash = $this->hasher->hash($password);
    return $this->users->create($email, $hash, $displayName);
  }
}