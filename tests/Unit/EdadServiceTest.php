<?php

namespace Tests\Unit;

use App\Services\EdadService;
use Mockery;
use Tests\TestCase;


class EdadServiceTest extends TestCase
{
    private EdadService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new EdadService();
    }

    public function test_acepta_edad_valida(): void
    {
        $this->assertTrue($this->service->validarEdad(25));
    }

    public function test_acepta_edad_limite_inferior_cero(): void
    {
        $this->assertTrue($this->service->validarEdad(0));
    }

    public function test_rechaza_edad_negativa(): void
    {
        $this->assertFalse($this->service->validarEdad(-1));
    }

    public function test_rechaza_edad_excesiva(): void
    {
        $this->assertFalse($this->service->validarEdad(150));
    }
}