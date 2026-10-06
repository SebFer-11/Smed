<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Paciente extends Model
{
    // Nombre de la tabla en base de datos
    protected $table = 'pacientes';

    // Atributos asignables de forma masiva
    protected $fillable = [
        'dni',
        'codigo_sis',
        'historia_clinica',
        'nombres',
        'apellido_paterno',
        'apellido_materno',
        'fecha_nacimiento',
        'sexo',
        'direccion',
        'telefono',
        'email',
        'sis_estado',
    ];

    /**
     * Accesor para obtener el nombre completo del paciente.
     */
    public function getNombreCompletoAttribute(): string
    {
        return trim("{$this->nombres} {$this->apellido_paterno} {$this->apellido_materno}");
    }
}