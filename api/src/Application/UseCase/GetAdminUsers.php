<?php
declare(strict_types=1);

namespace App\Application\UseCase;

use App\Application\Ports\UserRepository;

final class GetAdminUsers {
  public function __construct(private UserRepository $users) {}

  public function execute(): array {
    return $this->users->listAll();
  }
}
