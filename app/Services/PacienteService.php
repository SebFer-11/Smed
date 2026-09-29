<?php

namespace App\Services;

class PacienteService
{
    public function __construct(
        private $pacienteRepository
    ) {}

    public function pacienteExiste(string $dni): bool
    {
        $paciente = $this->pacienteRepository->buscarPorDni($dni);

        return $paciente !== null;
    }
}