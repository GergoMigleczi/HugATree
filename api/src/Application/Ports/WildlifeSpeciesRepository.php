<?php
declare(strict_types=1);

namespace App\Application\Ports;

interface WildlifeSpeciesRepository
{
    /** @return list<array{id:int,common_name:string,scientific_name:?string,taxon_key:?int}> */
    public function list(): array;
}
