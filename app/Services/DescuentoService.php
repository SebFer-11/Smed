<?php

namespace App\Services;

class DescuentoService{
    public function aplicarDescuento (float $precio, float $porcentaje): float{
        return $precio - ($precio * $porcentaje /100);
    }

    public function calcularImpuesto (float $precio, float $impuesto):float{
        return $precio + ($precio * $impuesto / 100);
    }
}