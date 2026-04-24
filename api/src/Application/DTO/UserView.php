<?php
declare(strict_types=1);

namespace App\Application\DTO;

use App\Domain\UserRole;

final class UserView {
	public function __construct(
		public int $id,
		public string $email,
		public ?string $displayName,
		public bool $isActive,
		public \DateTimeImmutable $createdAt,
		public \DateTimeImmutable $updatedAt,
		public UserRole $role,
	) {}
}
