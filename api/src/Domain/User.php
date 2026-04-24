<?php
declare(strict_types=1);

namespace App\Domain;

enum UserRole: string {
	case USER = 'user';
	case ADMIN = 'admin';
	case GUARDIAN = 'guardian';
}

final class User {
	public function __construct(
		public int $id,
		public string $email,
		public string $passwordHash,
		public ?string $displayName,
		public bool $isActive,
		public \DateTimeImmutable $createdAt,
		public \DateTimeImmutable $updatedAt,
		public UserRole $role = UserRole::USER,
	) {}
}
