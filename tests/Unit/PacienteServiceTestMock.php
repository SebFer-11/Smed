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
        // GIVEN (Dado un escenario / configuración inicial)
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

        // WHEN (Cuando se ejecuta la acción que se desea probar)
        $resultado = $service->pacienteExiste('12345678');

        // THEN (Entonces se verifica el resultado esperado)
        $this->assertTrue($resultado);
    }
}