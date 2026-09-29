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

        $resultado = $service->pacienteExiste('12345678');

        $this->assertTrue($resultado);
    }
}