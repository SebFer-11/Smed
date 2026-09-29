<?php

namespace App\Services;

class MedicalService
{
    public function verificarAfiliacionSIS(string $estado): bool
    {
        return strtoupper($estado) === 'ACTIVO';
    }

    public function validarEdad(int $edad): bool
    {
        return $edad >= 0 && $edad <= 120;
    }

    public function validarDni(string $dni): bool
    {
        return preg_match('/^\d{8}$/', $dni) === 1;
    }

    public function validarFechaCita(string $fecha): bool
    {
        return strtotime($fecha) !== false;
    }
}