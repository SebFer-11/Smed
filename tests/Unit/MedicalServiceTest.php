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

        $this->service = new MedicalService();
    }

    public function test_paciente_con_sis_activo_es_afiliado(): void
    {
        $resultado = $this->service
            ->verificarAfiliacionSIS('ACTIVO');

        $this->assertTrue($resultado);
    }

    public function test_paciente_con_sis_inactivo_no_es_afiliado(): void
    {
        $resultado = $this->service
            ->verificarAfiliacionSIS('INACTIVO');

        $this->assertFalse($resultado);
    }

    public function test_edad_valida(): void
    {
        $resultado = $this->service
            ->validarEdad(23);

        $this->assertTrue($resultado);
    }

    public function test_edad_mayor_a_120_no_es_valida(): void
    {
        $resultado = $this->service
            ->validarEdad(121);

        $this->assertFalse($resultado);
    }

    public function test_dni_de_8_digitos_es_valido(): void
    {
        $resultado = $this->service
            ->validarDni('12345678');

        $this->assertTrue($resultado);
    }

    public function test_dni_con_menos_de_8_digitos_no_es_valido(): void
    {
        $resultado = $this->service
            ->validarDni('1234567');

        $this->assertFalse($resultado);
    }

    public function test_fecha_valida(): void
    {
        $resultado = $this->service
            ->validarFechaCita('2026-10-15');

        $this->assertTrue($resultado);
    }
}