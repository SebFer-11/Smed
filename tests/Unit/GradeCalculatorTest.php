<?php

namespace Tests\Unit;

use App\Services\GradeCalculator;
use PHPUnit\Framework\TestCase;

class GradeCalculatorTest extends TestCase
{
    public function test_calcula_promedio_final_ponderado(): void
    {
        // GIVEN (Dado): Instancia del servicio de cálculo
        $calculator = new GradeCalculator();

        // WHEN (Cuando): Se calcula la nota final pasando las calificaciones
        $result = $calculator->finalScore(15, 18, 14);

        // THEN (Entonces): Se verifica que el promedio final sea el esperado
        $this->assertEquals(15.8, $result);
    }
}