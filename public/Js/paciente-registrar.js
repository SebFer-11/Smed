const pacienteForm =
    document.getElementById("pacienteForm");

const cancelButton =
    document.getElementById("cancelButton");

const message =
    document.getElementById("message");


// ==========================================
// REGISTRAR PACIENTE
// ==========================================

pacienteForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        limpiarMensaje();


        // ==========================================
        // DATOS DEL FORMULARIO
        // ==========================================

        const fecha =
            document.getElementById("fecha").value;

        const hora =
            document.getElementById("hora").value;

        const seguro =
            document.getElementById("seguro").value;

        const sis =
            document.getElementById("sis").value.trim();

        const origen =
            document.getElementById("origen").value.trim();

        const destino =
            document.getElementById("destino").value.trim();


        const historia =
            document.getElementById("historia")
                .value
                .trim();

        const dni =
            document.getElementById("dni")
                .value
                .trim();

        const nombres =
            document.getElementById("nombres")
                .value
                .trim();

        const apellidos =
            document.getElementById("apellidos")
                .value
                .trim();


        const sexo =
            document.getElementById("sexo").value;

        const valoredad = Number(document.getElementById("edad").value);
        const edad = (valoredad<0 || valoredad>105)?null : valoredad;


        const direccion =
            document.getElementById("direccion")
                .value
                .trim();

        const departamento =
            document.getElementById("departamento")
                .value;

        const distrito =
            document.getElementById("distrito")
                .value
                .trim();


        const anamnesis =
            document.getElementById("anamnesis")
                .value
                .trim();

        const examenFisico =
            document.getElementById("examenFisico")
                .value
                .trim();

        const examenes =
            document.getElementById("examenes")
                .value
                .trim();

        const diagnosticos =
            document.getElementById("diagnosticos")
                .value
                .trim();

        const tratamiento =
            document.getElementById("tratamiento")
                .value
                .trim();


        const ups =
            document.getElementById("ups").value;

        const especialidad =
            document.getElementById("especialidad")
                .value;

        const condicion =
            document.getElementById("condicion")
                .value;


        const refNombre =
            document.getElementById("refNombre")
                .value
                .trim();

        const refColegiatura =
            document.getElementById("refColegiatura")
                .value
                .trim();

        const refProfesion =
            document.getElementById("refProfesion")
                .value;


        const estNombre =
            document.getElementById("estNombre")
                .value
                .trim();

        const estColegiatura =
            document.getElementById("estColegiatura")
                .value
                .trim();

        const estProfesion =
            document.getElementById("estProfesion")
                .value;


        // ==========================================
        // VALIDACIONES
        // ==========================================

        if (!/^\d{8}$/.test(dni)) {

            mostrarError(
                "El documento de identidad debe tener 8 dígitos."
            );

            return;
        }


        if (
            !Number.isInteger(edad) ||
            edad < 0 ||
            edad > 120
        ) {

            mostrarError(
                "Ingrese una edad válida."
            );

            return;
        }


        // ==========================================
        // VERIFICAR DNI
        // ==========================================

        try {

            const pacientesExistentes =
                await supabaseGet(
                    "pacientes",
                    `?select=id,dni&dni=eq.${dni}`
                );


            if (
                pacientesExistentes.length > 0
            ) {

                mostrarError(
                    "Ya existe un paciente registrado con ese DNI."
                );

                return;
            }


            // ==========================================
            // VERIFICAR HISTORIA CLÍNICA
            // ==========================================

            const historiasExistentes =
                await supabaseGet(
                    "pacientes",
                    `?select=id,historia_clinica&historia_clinica=eq.${encodeURIComponent(historia)}`
                );


            if (
                historiasExistentes.length > 0
            ) {

                mostrarError(
                    "El número de Historia Clínica ya está registrado."
                );

                return;
            }


            // ==========================================
            // SEPARAR APELLIDOS
            // ==========================================

            const partesApellido =
                apellidos
                    .split(/\s+/)
                    .filter(Boolean);


            const apellidoPaterno =
                partesApellido[0] || "";


            const apellidoMaterno =
                partesApellido
                    .slice(1)
                    .join(" ");


            // ==========================================
            // FECHA DE NACIMIENTO TEMPORAL
            // ==========================================

            /*
             * El formulario actualmente pide EDAD,
             * pero la BD guarda FECHA_NACIMIENTO.
             *
             * Para el prototipo calculamos una fecha
             * aproximada.
             *
             * En la versión definitiva sería mejor
             * cambiar "Edad" por "Fecha de nacimiento".
             */

            const fechaNacimiento =
                calcularFechaNacimiento(edad);


            // ==========================================
            // CONVERTIR SEXO
            // ==========================================

            const sexoBD =
                sexo
                    ? sexo.toUpperCase()
                    : null;


            // ==========================================
            // CONVERTIR SIS
            // ==========================================

            let sisEstado = null;

            if (seguro === "si") {

                sisEstado =
                    sis
                        ? "ACTIVO"
                        : "ACTIVO";
            }


            // ==========================================
            // REGISTRAR PACIENTE
            // ==========================================

            const pacienteInsertado =
                await supabasePost(
                    "pacientes",
                    {
                        dni: dni,

                        codigo_sis:
                            sis || null,

                        historia_clinica:
                            historia,

                        nombres:
                            nombres,

                        apellido_paterno:
                            apellidoPaterno,

                        apellido_materno:
                            apellidoMaterno || null,

                        fecha_nacimiento:
                            fechaNacimiento,

                        sexo:
                            sexoBD,

                        direccion:
                            direccion,

                        distrito_id:
                            null,

                        telefono:
                            null,

                        email:
                            null,

                        sis_estado:
                            sisEstado
                    }
                );


            if (
                !pacienteInsertado ||
                pacienteInsertado.length === 0
            ) {

                throw new Error(
                    "No se pudo obtener el paciente registrado."
                );
            }


            const paciente =
                pacienteInsertado[0];


            // ==========================================
            // BUSCAR ESTABLECIMIENTO DE ORIGEN
            // ==========================================

            const establecimientosOrigen =
                await supabaseGet(
                    "establecimientos",
                    `?select=id&nombre=ilike.${encodeURIComponent(origen)}`
                );


            // ==========================================
            // BUSCAR ESTABLECIMIENTO DE DESTINO
            // ==========================================

            const establecimientosDestino =
                await supabaseGet(
                    "establecimientos",
                    `?select=id&nombre=ilike.${encodeURIComponent(destino)}`
                );


            /*
             * Como actualmente el formulario permite escribir
             * libremente el establecimiento, solo podemos crear
             * la referencia si esos establecimientos existen
             * previamente en la tabla establecimientos.
             */

            const establecimientoOrigen =
                establecimientosOrigen[0];

            const establecimientoDestino =
                establecimientosDestino[0];


            // ==========================================
            // BUSCAR ESPECIALIDAD
            // ==========================================

            const especialidades =
                await supabaseGet(
                    "especialidades",
                    `?select=id,nombre`
                );


            const especialidadEncontrada =
                especialidades.find(
                    function (item) {

                        return normalizar(
                            item.nombre
                        ) === normalizar(
                            convertirEspecialidad(
                                especialidad
                            )
                        );
                    }
                );


            // ==========================================
            // REGISTRAR REFERENCIA
            // ==========================================

            if (
                establecimientoOrigen &&
                establecimientoDestino
            ) {

                await supabasePost(
                    "referencias",
                    {
                        paciente_id:
                            paciente.id,

                        fecha_hora:
                            crearFechaHora(
                                fecha,
                                hora
                            ),

                        establecimiento_origen_id:
                            establecimientoOrigen.id,

                        establecimiento_destino_id:
                            establecimientoDestino.id,

                        ups_destino:
                            ups,

                        especialidad_destino_id:
                            especialidadEncontrada
                                ? especialidadEncontrada.id
                                : null,

                        condicion_paciente:
                            condicion,

                        motivo:
                            anamnesis || null,

                        estado:
                            "PENDIENTE",

                        usuario_registro_id:
                            null
                    }
                );

            } else {

                console.warn(
                    "Paciente registrado, pero no se creó la referencia porque uno de los establecimientos no existe en Supabase."
                );
            }


            // ==========================================
            // ÉXITO
            // ==========================================

            mostrarExito(
                "Paciente registrado correctamente."
            );


            pacienteForm.reset();


        } catch (error) {

            console.error(
                "Error al registrar paciente:",
                error
            );


            mostrarError(
                "No se pudo registrar el paciente. Revise la consola para más detalles."
            );
        }
    }
);


// ==========================================
// CANCELAR
// ==========================================

cancelButton.addEventListener(
    "click",
    function () {

        const confirmar =
            confirm(
                "¿Desea cancelar el registro?"
            );


        if (confirmar) {

            window.location.href =
                "../dashboard.html";
        }
    }
);


// ==========================================
// FECHA DE NACIMIENTO
// ==========================================

function calcularFechaNacimiento(
    edad
) {

    const hoy =
        new Date();

    return new Date(
        hoy.getFullYear() - edad,
        hoy.getMonth(),
        hoy.getDate()
    )
        .toISOString()
        .split("T")[0];
}


// ==========================================
// FECHA + HORA
// ==========================================

function crearFechaHora(
    fecha,
    hora
) {

    if (!fecha || !hora) {

        return new Date().toISOString();
    }

    return new Date(
        `${fecha}T${hora}:00`
    ).toISOString();
}


// ==========================================
// CONVERTIR VALOR DE ESPECIALIDAD
// ==========================================

function convertirEspecialidad(
    valor
) {

    const equivalencias = {

        "medicina-general":
            "Medicina General",

        "cardiologia":
            "Cardiología",

        "traumatologia":
            "Traumatología",

        "pediatria":
            "Pediatría",

        "ginecologia":
            "Ginecología"
    };


    return equivalencias[valor] ||
        valor;
}


// ==========================================
// NORMALIZAR TEXTO
// ==========================================

function normalizar(
    texto
) {

    return String(texto || "")
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .toLowerCase()
        .trim();
}


// ==========================================
// MENSAJES
// ==========================================

function mostrarError(
    texto
) {

    message.textContent =
        texto;

    message.style.color =
        "red";
}


function mostrarExito(
    texto
) {

    message.textContent =
        texto;

    message.style.color =
        "green";
}


function limpiarMensaje() {

    message.textContent = "";
}