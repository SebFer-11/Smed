<?php

namespace Tests\Unit;

use App\Services\DniService;
use Mockery;
use Tests\TestCase;


class DniServiceTest extends TestCase
{
    private DniService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new DniService();
    }

    public function test_acepta_dni_valido_de_8_digitos(): void
    {
        $this->assertTrue($this->service->validarDni('31265498'));
    }

    public function test_rechaza_dni_con_menos_de_8_digitos(): void
    {
        $this->assertFalse($this->service->validarDni('1234567'));
    }

    public function test_rechaza_dni_con_mas_de_8_digitos(): void
    {
        $this->assertFalse($this->service->validarDni('123456789'));
    }

    public function test_rechaza_dni_con_caracteres_no_numericos(): void
    {
        $this->assertFalse($this->service->validarDni('3126A498'));
    }

    public function test_rechaza_dni_vacio(): void
    {
        $this->assertFalse($this->service->validarDni(''));
    }
}