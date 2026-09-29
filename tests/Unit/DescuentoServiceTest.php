<?php

namespace Tests\Unit;

use App\Services\DescuentoService;
use Tests\TestCase;

class DescuentoServiceTest extends TestCase
{

    public function test_aplicar_descuento_correctamente(): void
    {
        // GIVEN (Dado): Inicialización del servicio o escenario
        $service = new DescuentoService();

        // WHEN (Cuando): Se ejecuta el método a probar con sus argumentos
        $resultado = $service->aplicarDescuento(200, 10);

        // THEN (Entonces): Se valida que la salida sea la esperada
        $this->assertEquals(180, $resultado);
    }

    public function test_calcular_impuesto_correctamente(): void
    {
        // GIVEN (Dado): Inicialización del servicio o escenario
        $service = new DescuentoService();

        // WHEN (Cuando): Se ejecuta el método a probar con sus argumentos
        $resultado = $service->calcularImpuesto(100, 18);

        // THEN (Entonces): Se valida que la salida sea la esperada
        $this->assertEquals(118, $resultado);
    }
}