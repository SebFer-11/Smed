const citaForm =
    document.getElementById("citaForm");

const cancelButton =
    document.getElementById("cancelButton");

const message =
    document.getElementById("message");


// ==========================================
// REGISTRAR CITA
// ==========================================

citaForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        const dni =
            document.getElementById("dni")
                .value
                .trim();

        const fecha =
            document.getElementById("fecha")
                .value;

        const hora =
            document.getElementById("hora")
                .value;


        // ==========================================
        // VALIDAR DNI
        // ==========================================

        if (!/^\d{8}$/.test(dni)) {

            message.textContent =
                "El DNI debe tener 8 dígitos.";

            message.style.color = "red";

            return;
        }


        // ==========================================
        // VALIDAR FECHA Y HORA
        // ==========================================

        if (!fecha || !hora) {

            message.textContent =
                "Seleccione una fecha y hora.";

            message.style.color = "red";

            return;
        }


        try {

            // ==========================================
            // BUSCAR PACIENTE
            // ==========================================

            const pacientes =
                await supabaseGet(
                    "pacientes",
                    `?select=*&dni=eq.${dni}`
                );


            if (
                !pacientes ||
                pacientes.length === 0
            ) {

                message.textContent =
                    "No se encontró un paciente con ese DNI.";

                message.style.color = "red";

                return;
            }


            const paciente =
                pacientes[0];


            // ==========================================
            // RN-01
            // MÁXIMO 2 CITAS ACTIVAS
            // ==========================================

            const citasPaciente =
                await supabaseGet(
                    "citas",
                    `?select=id,estado&paciente_id=eq.${paciente.id}&estado=eq.PROGRAMADA`
                );


            if (
                citasPaciente &&
                citasPaciente.length >= 2
            ) {

                message.textContent =
                    "El paciente ya tiene el máximo de 2 citas programadas.";

                message.style.color = "red";

                return;
            }


            // ==========================================
            // VERIFICAR DISPONIBILIDAD DEL HORARIO
            // ==========================================

            const citasHorario =
                await supabaseGet(
                    "citas",
                    `?select=id&fecha=eq.${fecha}&hora_inicio=eq.${hora}:00&estado=eq.PROGRAMADA`
                );


            if (
                citasHorario &&
                citasHorario.length > 0
            ) {

                message.textContent =
                    "El horario seleccionado ya está ocupado.";

                message.style.color = "red";

                return;
            }


            // ==========================================
            // BUSCAR MÉDICO
            // ==========================================

            /*
             * Temporalmente obtenemos el primer
             * profesional activo.
             *
             * Después lo cambiaremos por el médico
             * seleccionado desde el formulario.
             */

            const profesionales =
                await supabaseGet(
                    "profesionales",
                    "?select=*&activo=eq.true&order=id.asc"
                );


            if (
                !profesionales ||
                profesionales.length === 0
            ) {

                message.textContent =
                    "No hay médicos disponibles para registrar la cita.";

                message.style.color = "red";

                return;
            }


            const profesional =
                profesionales[0];


            // ==========================================
            // CALCULAR HORA FIN
            // ==========================================

            const horaFin =
                calcularHoraFin(hora);


            // ==========================================
            // CREAR CITA
            // ==========================================

            const nuevaCita = {

                paciente_id:
                    paciente.id,

                profesional_id:
                    profesional.id,

                consultorio_id:
                    null,

                fecha:
                    fecha,

                hora_inicio:
                    `${hora}:00`,

                hora_fin:
                    horaFin,

                estado:
                    "PROGRAMADA",

                observaciones:
                    null,

                usuario_registro_id:
                    null
            };


            // ==========================================
            // INSERTAR EN SUPABASE
            // ==========================================

            const resultado =
                await supabasePost(
                    "citas",
                    nuevaCita
                );


            console.log(
                "Cita registrada:",
                resultado
            );


            // ==========================================
            // MENSAJE
            // ==========================================

            message.textContent =
                "Cita registrada correctamente.";

            message.style.color =
                "green";


            // ==========================================
            // LIMPIAR FORMULARIO
            // ==========================================

            citaForm.reset();


        } catch (error) {

            console.error(
                "Error al registrar cita:",
                error
            );

            message.textContent =
                "Ocurrió un error al registrar la cita.";

            message.style.color =
                "red";
        }
    }
);


// ==========================================
// CALCULAR HORA FIN
// ==========================================

function calcularHoraFin(
    horaInicio
) {

    const partes =
        horaInicio.split(":");

    let horas =
        parseInt(partes[0]);

    let minutos =
        parseInt(partes[1]);

    // Duración temporal de 30 minutos
    minutos += 30;


    if (minutos >= 60) {

        horas +=
            Math.floor(minutos / 60);

        minutos =
            minutos % 60;
    }


    return (
        String(horas).padStart(2, "0") +
        ":" +
        String(minutos).padStart(2, "0") +
        ":00"
    );
}


// ==========================================
// CANCELAR / VOLVER
// ==========================================

cancelButton.addEventListener(
    "click",
    function () {

        const confirmar =
            confirm(
                "¿Desea cancelar el registro de la cita?"
            );

        if (confirmar) {

            window.location.href =
                "../dashboard.html";
        }
    }
);