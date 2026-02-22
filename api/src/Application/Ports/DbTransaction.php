<?php

namespace App\Application\Ports;

interface DbTransaction
{
    /**
     * Execute the callback inside a DB transaction.
     * If callback throws, transaction is rolled back.
     *
     * @return mixed
     */
    public function run(callable $fn);
}