<?php

namespace App\Services;

class MedicalService{
    
    public function ingresarRegistro(String $dni, String $nombre, String $apellido){
        return $dni . " " . $nombre . " " . $apellido;

    }


    public function agendarCita(
        String $dni,
        String $especialidad,
        String $fecha
    ) {
        return [
            'dni' => $dni,
            'especialidad' => $especialidad,
            'fecha' => $fecha,
            'estado' => 'Pendiente'
        ];
    }


    public function verificarAfiliacionSIS(string $dni): array
    {
        return ['dni' => $dni, 'estado' => 'ACTIVO', 'tabla_afiliacion' => 'SIS-GRATUITO'];
    }


    public function validarFechaCita(string $fecha): bool
    {
        return $fecha >= date('Y-m-d');
    }


}
