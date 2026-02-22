<?php

namespace App\Application\Ports;

interface TreeDetailHistoryRepository
{
    public function insert(array $detail): int;
}