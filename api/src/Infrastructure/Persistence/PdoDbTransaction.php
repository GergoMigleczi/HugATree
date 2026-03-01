<?php

namespace App\Infrastructure\Persistence;

use App\Application\Ports\DbTransaction;
use PDO;
use Throwable;

final class PdoDbTransaction implements DbTransaction
{
    public function __construct(private PDO $pdo) {}

    public function run(callable $fn)
    {
        $this->pdo->beginTransaction();
        try {
            $result = $fn();
            $this->pdo->commit();
            return $result;
        } catch (Throwable $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw $e;
        }
    }
}