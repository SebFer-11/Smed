<?php

namespace Tests\Unit;

use App\Services\DescuentoService;

use Tests\TestCase;

class DescuentoServiceTest extends TestCase
{

    public function test_aplicar_descuento_correctamente():void{
        $service = new DescuentoService();
        $resultado = $service->aplicarDescuento(200,10);

        $this->assertEquals(180, $resultado);
    }

    public function test_calcular_impuesto_correctamente() : void {
        $service = new DescuentoService();
        $resultado = $service -> calcularImpuesto(100,18);

        $this->assertEquals(118,$resultado);
    }
}
