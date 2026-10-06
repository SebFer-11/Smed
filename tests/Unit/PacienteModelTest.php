<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\Paciente;

class PacienteModelTest extends TestCase
{
    /**
     * Valida que los campos obligatorios del paciente permitan asignación masiva.
     */
    public function test_modelo_paciente_asigna_atributos_en_fillable(): void
    {
        $datos = [
            'dni'              => '31265498',
            'codigo_sis'       => 'sis-123',
            'historia_clinica' => 'his-123',
            'nombres'          => 'Juan',
            'apellido_paterno' => 'Perez',
            'apellido_materno' => 'Gonzales',
            'sis_estado'       => 'ACTIVO'
        ];

        $paciente = new Paciente($datos);

        $this->assertEquals('31265498', $paciente->dni);
        $this->assertEquals('sis-123', $paciente->codigo_sis);
        $this->assertEquals('Juan', $paciente->nombres);
        $this->assertEquals('ACTIVO', $paciente->sis_estado);
    }

}