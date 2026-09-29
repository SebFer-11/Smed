<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

class ExampleTest extends TestCase
{
    /**
     * A basic test example.
     */
    public function test_that_true_is_true(): void
    {
        // GIVEN (Dado): Un estado inicial o valor verdadero
        // WHEN (Cuando): Se evalúa la condición
        // THEN (Entonces): Se confirma que la afirmación es verdadera
        $this->assertTrue(true);
    }
}