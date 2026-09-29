<?php

namespace App\Services;

class GradeCalculator
{
    public function finalScore($nota1, $nota2, $nota3)
    {
        return ($nota1 * 0.30) + ($nota2 * 0.40) + ($nota3 * 0.30);
    }
}
