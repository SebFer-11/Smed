<?php

namespace Tests\Unit;

use App\Services\MedicalService;
use Tests\TestCase;

class MedicalServiceTest extends TestCase
{
    private MedicalService $service;

    protected function setUp(): void
    {
        parent::setUp();

        // GIVEN (Dado): Preparamos el servicio de salud para todas las pruebas
        $this->service = new MedicalService();
    }

    public function test_paciente_con_sis_activo_es_afiliado(): void
    {
        // GIVEN (Dado): Un paciente con estado SIS 'ACTIVO'

        // WHEN (Cuando): Se verifica la afiliación
        $resultado = $this->service
            ->verificarAfiliacionSIS('ACTIVO');

        // THEN (Entonces): Se confirma que está afiliado
        $this->assertTrue($resultado);
    }

    public function test_paciente_con_sis_inactivo_no_es_afiliado(): void
    {
        // GIVEN (Dado): Un paciente con estado SIS 'INACTIVO'

        // WHEN (Cuando): Se verifica la afiliación
        $resultado = $this->service
            ->verificarAfiliacionSIS('INACTIVO');

        // THEN (Entonces): Se confirma que no está afiliado
        $this->assertFalse($resultado);
    }

    public function test_edad_valida(): void
    {
        // GIVEN (Dado): Una edad dentro del rango permitido (23 años)

        // WHEN (Cuando): Se valida la edad
        $resultado = $this->service
            ->validarEdad(23);

        // THEN (Entonces): Se confirma que es válida
        $this->assertTrue($resultado);
    }

    public function test_edad_mayor_a_120_no_es_valida(): void
    {
        // GIVEN (Dado): Una edad superior al límite máximo (121 años)

        // WHEN (Cuando): Se valida la edad
        $resultado = $this->service
            ->validarEdad(121);

        // THEN (Entonces): Se confirma que no es válida
        $this->assertFalse($resultado);
    }

    public function test_dni_de_8_digitos_es_valido(): void
    {
        // GIVEN (Dado): Un número de DNI con la longitud correcta (8 dígitos)

        // WHEN (Cuando): Se valida el DNI
        $resultado = $this->service
            ->validarDni('12345678');

        // THEN (Entonces): Se confirma que es válido
        $this->assertTrue($resultado);
    }

    public function test_dni_con_menos_de_8_digitos_no_es_valido(): void
    {
        // GIVEN (Dado): Un número de DNI con longitud incorrecta (7 dígitos)

        // WHEN (Cuando): Se valida el DNI
        $resultado = $this->service
            ->validarDni('1234567');

        // THEN (Entonces): Se confirma que no es válido
        $this->assertFalse($resultado);
    }

    public function test_fecha_valida(): void
    {
        // GIVEN (Dado): Una fecha de cita con formato correcto

        // WHEN (Cuando): Se valida la fecha
        $resultado = $this->service
            ->validarFechaCita('2026-10-15');

        // THEN (Entonces): Se confirma que la fecha es válida
        $this->assertTrue($resultado);
    }
}