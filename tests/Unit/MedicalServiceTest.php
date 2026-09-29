<?php

namespace App\Services;

use Tests\TestCase;

class MedicalServiceTest extends TestCase
{
public function test_ingresar_registro_correctamente(): void
    {
        $service = new MedicalService();

        $resultado = $service->ingresarRegistro(
            "12345678",
            "Juan",
            "Pérez"
        );

        $this->assertEquals("12345678 Juan Pérez", $resultado);
    }


    public function test_agendar_cita_correctamente(): void
    {
        $service = new MedicalService();

        $resultado = $service->agendarCita(
            "12345678",
            "Cardiología",
            "2026-09-15"
        );

        $esperado = [
            'dni' => '12345678',
            'especialidad' => 'Cardiología',
            'fecha' => '2026-09-15',
            'estado' => 'Pendiente'
        ];

        $this->assertEquals($esperado, $resultado);
    }
    

    public function test_verificar_afiliacion_sis_correctamente(): void
    {
        $service = new MedicalService();

        $resultado = $service->verificarAfiliacionSIS("12345678");

        $esperado = [
            'dni' => '12345678',
            'estado' => 'ACTIVO',
            'tabla_afiliacion' => 'SIS-GRATUITO'
        ];

        $this->assertEquals($esperado, $resultado);
    }


        public function test_validar_fecha_cita_correctamente(): void
    {   
        $service = new MedicalService();

        $resultado = $service->validarFechaCita("2026-09-15");

        $this->assertTrue($resultado);
    }


}
