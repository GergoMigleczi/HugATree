<?php

namespace App\Application\Ports;

interface ObservationRepository
{
    public function insert(array $observation): int;
}