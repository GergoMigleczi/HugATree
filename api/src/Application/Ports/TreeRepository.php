<?php

namespace App\Application\Ports;

interface TreeRepository
{
    public function insert(array $tree): int;
}