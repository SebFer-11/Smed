<?php

namespace App;

class Calculadora{

    public function sumar(int $a, int $b): int{
        return $a + $b;
    }

    public function restar(int $a, int $b): int{
        return $a - $b;
    }

    public function multiplicar(int $a, int $b): int{
        return $a * $b;
    }
    
    public function dividir(int $a, int $b): int{

        if($b == 0){
            throw new \InvalidArgumentException('No se puede dividir entre 0');
        }
        return $a / $b;
    }
}