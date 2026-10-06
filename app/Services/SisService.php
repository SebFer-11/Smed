<?php

namespace App\Services;

class SisService
{
    public function validarCodigoSis(string $codigo): bool
    {
        return (bool) preg_match('/^(SIS-)?[0-9]{3,8}$/i', trim($codigo));
    }

    public function validarEstadoActivo(string $estado): bool
    {
        return strtoupper(trim($estado)) === 'ACTIVO';
    }
}