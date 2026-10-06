<?php

namespace App\Services;

class DniService
{
    public function validarDni(string $dni): bool
    {
        return (bool) preg_match('/^[0-9]{8}$/', $dni);
    }
}