<?php

namespace Tests\Unit;

use App\Services\SisService;
use Mockery;
use Tests\TestCase;

class SisServiceTest extends TestCase
{
    private SisService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new SisService();
    }

    public function test_valida_formato_codigo_sis_correcto(): void
    {
        $this->assertTrue($this->service->validarCodigoSis('sis-123'));
        $this->assertTrue($this->service->validarCodigoSis('31265498'));
    }

    public function test_rechaza_codigo_sis_con_formato_invalido(): void
    {
        $this->assertFalse($this->service->validarCodigoSis('INVALIDO#*'));
    }

    public function test_acepta_afiliacion_en_estado_activo(): void
    {
        $this->assertTrue($this->service->validarEstadoActivo('ACTIVO'));
        $this->assertTrue($this->service->validarEstadoActivo('activo'));
    }

    public function test_rechaza_afiliacion_en_estado_inactivo_o_suspendido(): void
    {
        $this->assertFalse($this->service->validarEstadoActivo('INACTIVO'));
        $this->assertFalse($this->service->validarEstadoActivo('SUSPENDIDO'));
    }
}