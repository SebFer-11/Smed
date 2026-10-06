<?php

namespace App\Services;

class EdadService
{
    public function validarEdad(int $edad): bool
    {
        return $edad >= 0 && $edad <= 125;
    }
}