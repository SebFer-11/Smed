<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});



Route::get('/asd123', function () {
    return 'asdasdadasd';
});


// Ruta con parametros
/*
Route::get('/cursos/{curso}', function ($curso){
    return "Bienvenido al curso: $curso";
});

Route::get('/cursos/{curso}/{categoria}', function ($curso, $categoria){
    return "Bienvenido al curso: $curso de la categoria:  $categoria";
});

*/


// Ruta con parametros optimizada 
/*
// el ? hace opcional la 2da ruta
Route::get('/cursos/{curso}/{categoria?}', function ($curso, $categoria = null){
    if ($categoria) {
        return "Bienvenido al curso de: $curso de la categoria: $categoria";
    }else{
        return "Bienvenido al curso de: $curso";
    }
});

// Expresiones regulares
//  whereAlpha -> valida para caracteres alfabeticos
//  whereAlphaNumeric -> valida para caraceteres alfanumericos


Route::get('/cursos/{curso}',function ($curso){
    return "Bienvenido al curso $curso";

})->whereAlpha("curso");

*/

//  whereIn -> valida palabras solo de una lista

Route::get('cursos/{curso}', function ($curso){
    return "Bienvenido al curso: $curso";
})->whereIn('curso', ['matematica','filosofia','Antimateria']);



Route::get('cursos/{curso}/{categoria?}', function ($curso, $categoria = null){

    if($categoria){
        return "Bienvenido al curso: $curso, de la categoria: $categoria"; 
    }else{
        return "Bienvenido al curso: $curso";
    }
})->whereIn('curso', ['matematica','filosofia','Antimateria'])
->whereIn('categoria',['numeros','letras','salud']);





// Ruta con ID

