const buscarPacienteForm =
    document.getElementById("buscarPacienteForm");

const atencionForm =
    document.getElementById("atencionForm");

// ID del paciente encontrado
let pacienteActual = null;

// Cita que será utilizada para registrar la atención
let citaActual = null;


// ==========================================
// BUSCAR PACIENTE
// ==========================================

buscarPacienteForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        const dni =
            document.getElementById("dni")
                .value
                .trim();

        if (dni === "") {
            alert("Ingrese el DNI del paciente.");
            return;
        }

        try {

            // ==========================================
            // BUSCAR PACIENTE EN SUPABASE
            // ==========================================

            const pacientes = await supabaseGet(
                "pacientes",
                `?select=*&dni=eq.${dni}`
            );

            if (
                !pacientes ||
                pacientes.length === 0
            ) {

                pacienteActual = null;
                citaActual = null;

                alert(
                    "No se encontró un paciente con ese DNI."
                );

                return;
            }

            const paciente = pacientes[0];

            // Guardamos el paciente encontrado
            pacienteActual = paciente;

            // ==========================================
            // MOSTRAR DATOS DEL PACIENTE
            // ==========================================

            document.getElementById(
                "nombrePaciente"
            ).textContent =
                `${paciente.nombres} ${paciente.apellido_paterno} ${paciente.apellido_materno || ""}`;

            document.getElementById(
                "dniPaciente"
            ).textContent =
                paciente.dni;

            document.getElementById(
                "historiaClinica"
            ).textContent =
                paciente.historia_clinica ||
                "No registrada";

            document.getElementById(
                "edadPaciente"
            ).textContent =
                calcularEdad(
                    paciente.fecha_nacimiento
                );

            document.getElementById(
                "sexoPaciente"
            ).textContent =
                paciente.sexo ||
                "No registrado";


            // ==========================================
            // BUSCAR CITA DEL PACIENTE
            // ==========================================

            await buscarCitaPaciente(
                paciente.id
            );

            alert("Paciente encontrado.");

        } catch (error) {

            console.error(
                "Error al buscar paciente:",
                error
            );

            alert(
                "Ocurrió un error al buscar el paciente."
            );
        }
    }
);


// ==========================================
// BUSCAR CITA DEL PACIENTE
// ==========================================

async function buscarCitaPaciente(
    pacienteId
) {

    try {

        /*
         * Buscamos una cita del paciente que:
         *
         * - esté PROGRAMADA
         * - esté asociada al paciente
         *
         * La ordenamos por fecha/hora para obtener
         * la cita más próxima.
         */

        const citas = await supabaseGet(
            "citas",
            `?select=*&paciente_id=eq.${pacienteId}&estado=eq.PROGRAMADA&order=fecha.asc,hora_inicio.asc`
        );

        if (
            !citas ||
            citas.length === 0
        ) {

            citaActual = null;

            document.getElementById(
                "fechaCita"
            ).textContent =
                "No hay cita programada";

            document.getElementById(
                "medico"
            ).textContent =
                "No disponible";

            document.getElementById(
                "especialidad"
            ).textContent =
                "No disponible";

            alert(
                "El paciente no tiene una cita programada."
            );

            return;
        }

        // Tomamos la primera cita disponible
        const cita = citas[0];

        citaActual = cita;

        // ==========================================
        // FECHA DE LA CITA
        // ==========================================

        const fechaCita =
            formatearFecha(
                cita.fecha
            );

        const horaCita =
            cita.hora_inicio
                ? cita.hora_inicio.substring(0, 5)
                : "";

        document.getElementById(
            "fechaCita"
        ).textContent =
            `${fechaCita} - ${horaCita}`;


        // ==========================================
        // BUSCAR PROFESIONAL
        // ==========================================

        if (cita.profesional_id) {

            const profesionales =
                await supabaseGet(
                    "profesionales",
                    `?select=*&id=eq.${cita.profesional_id}`
                );

            if (
                profesionales &&
                profesionales.length > 0
            ) {

                const profesional =
                    profesionales[0];

                document.getElementById(
                    "medico"
                ).textContent =
                    `${profesional.nombres} ${profesional.apellidos}`;


                // ==========================================
                // BUSCAR ESPECIALIDAD
                // ==========================================

                if (
                    profesional.especialidad_id
                ) {

                    const especialidades =
                        await supabaseGet(
                            "especialidades",
                            `?select=*&id=eq.${profesional.especialidad_id}`
                        );

                    if (
                        especialidades &&
                        especialidades.length > 0
                    ) {

                        document.getElementById(
                            "especialidad"
                        ).textContent =
                            especialidades[0].nombre;

                    } else {

                        document.getElementById(
                            "especialidad"
                        ).textContent =
                            "No registrada";
                    }

                } else {

                    document.getElementById(
                        "especialidad"
                    ).textContent =
                        "No registrada";
                }

            } else {

                document.getElementById(
                    "medico"
                ).textContent =
                    "No registrado";

                document.getElementById(
                    "especialidad"
                ).textContent =
                    "No registrada";
            }

        } else {

            document.getElementById(
                "medico"
            ).textContent =
                "No registrado";

            document.getElementById(
                "especialidad"
            ).textContent =
                "No registrada";
        }

    } catch (error) {

        console.error(
            "Error al buscar cita:",
            error
        );

        citaActual = null;

        alert(
            "No se pudo consultar la cita del paciente."
        );
    }
}


// ==========================================
// REGISTRAR ATENCIÓN
// ==========================================

atencionForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        // ==========================================
        // VERIFICAR PACIENTE
        // ==========================================

        if (!pacienteActual) {

            alert(
                "Primero debe buscar y seleccionar un paciente."
            );

            return;
        }

        // ==========================================
        // VERIFICAR CITA
        // ==========================================

        if (!citaActual) {

            alert(
                "El paciente no tiene una cita válida para registrar la atención."
            );

            return;
        }


        // ==========================================
        // OBTENER DATOS DEL FORMULARIO
        // ==========================================

        const anamnesis =
            document.getElementById(
                "anamnesis"
            ).value.trim();

        const examenFisico =
            document.getElementById(
                "examenFisico"
            ).value.trim();

        const diagnostico =
            document.getElementById(
                "diagnostico"
            ).value.trim();

        const tratamiento =
            document.getElementById(
                "tratamiento"
            ).value.trim();


        // ==========================================
        // CAMPOS OBLIGATORIOS
        // ==========================================

        if (
            anamnesis === "" ||
            examenFisico === "" ||
            diagnostico === "" ||
            tratamiento === ""
        ) {

            alert(
                "Complete los campos obligatorios de la atención."
            );

            return;
        }


        try {

            // ==========================================
            // VERIFICAR QUE NO EXISTA ATENCIÓN
            // ==========================================

            const atencionesExistentes =
                await supabaseGet(
                    "atenciones",
                    `?select=id&cita_id=eq.${citaActual.id}`
                );

            if (
                atencionesExistentes &&
                atencionesExistentes.length > 0
            ) {

                alert(
                    "Esta cita ya tiene una atención médica registrada."
                );

                return;
            }


            // ==========================================
            // REGISTRAR ATENCIÓN
            // ==========================================

            const nuevaAtencion = {

                cita_id:
                    citaActual.id,

                paciente_id:
                    pacienteActual.id,

                profesional_id:
                    citaActual.profesional_id,

                fecha_hora:
                    new Date().toISOString(),

                anamnesis:
                    anamnesis,

                examen_fisico:
                    examenFisico,

                examenes_auxiliares:
                    "",

                diagnostico:
                    diagnostico,

                tratamiento:
                    tratamiento,

                observaciones:
                    "",

                usuario_registro_id:
                    null
            };


            const resultado =
                await supabasePost(
                    "atenciones",
                    nuevaAtencion
                );


            // ==========================================
            // ACTUALIZAR ESTADO DE LA CITA
            // ==========================================

            await supabasePatch(
                "citas",
                `?id=eq.${citaActual.id}`,
                {
                    estado: "ATENDIDA"
                }
            );


            console.log(
                "Atención registrada:",
                resultado
            );


            alert(
                "Atención médica registrada correctamente."
            );


            // ==========================================
            // LIMPIAR FORMULARIO
            // ==========================================

            atencionForm.reset();

            pacienteActual = null;
            citaActual = null;


            // Limpiar información visual

            document.getElementById(
                "nombrePaciente"
            ).textContent = "";

            document.getElementById(
                "dniPaciente"
            ).textContent = "";

            document.getElementById(
                "historiaClinica"
            ).textContent = "";

            document.getElementById(
                "edadPaciente"
            ).textContent = "";

            document.getElementById(
                "sexoPaciente"
            ).textContent = "";

            document.getElementById(
                "fechaCita"
            ).textContent = "";

            document.getElementById(
                "medico"
            ).textContent = "";

            document.getElementById(
                "especialidad"
            ).textContent = "";


        } catch (error) {

            console.error(
                "Error al registrar atención:",
                error
            );

            alert(
                "Ocurrió un error al registrar la atención médica."
            );
        }
    }
);


// ==========================================
// CALCULAR EDAD
// ==========================================

function calcularEdad(
    fechaNacimiento
) {

    if (!fechaNacimiento) {
        return "No registrada";
    }

    const nacimiento =
        new Date(fechaNacimiento);

    const hoy =
        new Date();

    let edad =
        hoy.getFullYear() -
        nacimiento.getFullYear();

    const mes =
        hoy.getMonth() -
        nacimiento.getMonth();

    if (
        mes < 0 ||
        (
            mes === 0 &&
            hoy.getDate() < nacimiento.getDate()
        )
    ) {

        edad--;
    }

    return `${edad} años`;
}


// ==========================================
// FORMATEAR FECHA
// ==========================================

function formatearFecha(
    fecha
) {

    if (!fecha) {
        return "Fecha no registrada";
    }

    const partes =
        fecha.split("-");

    if (partes.length !== 3) {
        return fecha;
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}