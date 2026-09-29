<?php

namespace Tests\Unit;

use App\Services\GradeCalculator;
use PhpUnit\Framework\TestCase;

class GradeCalculatorTest extends TestCase{
    
    public function test_calcula_promedio_final_ponderado(): void{
        $calculator = new GradeCalculator();

        $result = $calculator->finalScore(15,18,14);

        $this->assertEquals(15.8, $result);
    }
}