<?php

namespace App\Application\Ports;

interface ObservationPhotoRepository
{
    public function insert(array $photo): int;
}