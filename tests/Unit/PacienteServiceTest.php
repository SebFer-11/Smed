<?php

namespace Tests\Unit;

use App\Services\PacienteService;
use Mockery;
use Tests\TestCase;

class PacienteServiceTest extends TestCase
{
    protected function tearDown(): void
    {
        Mockery::close();

        parent::tearDown();
    }

    public function test_paciente_existe(): void
    {
        // GIVEN (Dado): Un mock del repositorio configurado con los datos del paciente y la instancia del servicio
        $repository = Mockery::mock();

        $repository
            ->shouldReceive('buscarPorDni')
            ->once()
            ->with('12345678')
            ->andReturn([
                'dni' => '12345678',
                'nombres' => 'José Luis'
            ]);

        $service = new PacienteService($repository);

        // WHEN (Cuando): Se consulta si el paciente existe indicando el DNI
        $resultado = $service->pacienteExiste('12345678');

        // THEN (Entonces): Se confirma que la respuesta sea verdadera
        $this->assertTrue($resultado);
    }
}