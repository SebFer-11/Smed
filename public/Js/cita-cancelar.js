const searchForm =
    document.getElementById("searchForm");

const appointmentResult =
    document.getElementById("appointmentResult");

const cancelAppointment =
    document.getElementById("cancelAppointment");

const message =
    document.getElementById("message");

// ==========================================
// CITA ACTUAL
// ==========================================

let citaActual = null;


// ==========================================
// BUSCAR CITA POR DNI
// ==========================================

searchForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        const dni =
            document.getElementById("dni")
                .value
                .trim();

        // ==========================================
        // VALIDAR DNI
        // ==========================================

        if (!/^\d{8}$/.test(dni)) {

            appointmentResult.classList.add(
                "hidden"
            );

            message.textContent =
                "El DNI debe tener 8 dígitos.";

            message.style.color = "red";

            citaActual = null;

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

                appointmentResult.classList.add(
                    "hidden"
                );

                message.textContent =
                    "No se encontró el paciente.";

                message.style.color = "red";

                citaActual = null;

                return;
            }

            const paciente =
                pacientes[0];


            // ==========================================
            // BUSCAR CITAS PROGRAMADAS
            // ==========================================

            const citas =
                await supabaseGet(
                    "citas",
                    `?select=*&paciente_id=eq.${paciente.id}&estado=eq.PROGRAMADA&order=fecha.asc,hora_inicio.asc`
                );

            if (
                !citas ||
                citas.length === 0
            ) {

                appointmentResult.classList.add(
                    "hidden"
                );

                message.textContent =
                    "No se encontró una cita programada.";

                message.style.color = "red";

                citaActual = null;

                return;
            }


            // ==========================================
            // TOMAR LA PRIMERA CITA
            // ==========================================

            citaActual =
                citas[0];


            // ==========================================
            // MOSTRAR DATOS DE LA CITA
            // ==========================================

            await mostrarCita(
                citaActual
            );

            appointmentResult.classList.remove(
                "hidden"
            );

            message.textContent =
                "Cita encontrada.";

            message.style.color = "green";


        } catch (error) {

            console.error(
                "Error al buscar cita:",
                error
            );

            appointmentResult.classList.add(
                "hidden"
            );

            message.textContent =
                "Ocurrió un error al consultar la cita.";

            message.style.color = "red";

            citaActual = null;
        }
    }
);


// ==========================================
// MOSTRAR DATOS DE LA CITA
// ==========================================

async function mostrarCita(
    cita
) {

    /*
     * IMPORTANTE:
     *
     * No sé los IDs exactos de los elementos
     * que tienes dentro de appointmentResult.
     *
     * Por eso primero intentamos encontrar
     * elementos habituales sin romper el código.
     *
     * Si tu HTML tiene IDs específicos,
     * podemos adaptarlos exactamente.
     */

    const fecha =
        formatearFecha(
            cita.fecha
        );

    const horaInicio =
        cita.hora_inicio
            ? cita.hora_inicio.substring(0, 5)
            : "";

    const horaFin =
        cita.hora_fin
            ? cita.hora_fin.substring(0, 5)
            : "";

    // ==========================================
    // FECHA
    // ==========================================

    const fechaElemento =
        document.getElementById("appointmentDate");

    if (fechaElemento) {

        fechaElemento.textContent =
            fecha;
    }


    // ==========================================
    // HORA
    // ==========================================

    const horaElemento =
        document.getElementById("appointmentTime");

    if (horaElemento) {

        horaElemento.textContent =
            `${horaInicio} - ${horaFin}`;
    }


    // ==========================================
    // BUSCAR MÉDICO
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

            const medicoElemento =
                document.getElementById(
                    "appointmentDoctor"
                );

            if (medicoElemento) {

                medicoElemento.textContent =
                    `${profesional.nombres} ${profesional.apellidos}`;
            }


            // ==========================================
            // ESPECIALIDAD
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

                    const especialidadElemento =
                        document.getElementById(
                            "appointmentSpecialty"
                        );

                    if (especialidadElemento) {

                        especialidadElemento.textContent =
                            especialidades[0].nombre;
                    }
                }
            }
        }
    }


    // ==========================================
    // OBSERVACIONES
    // ==========================================

    const observacionesElemento =
        document.getElementById(
            "appointmentObservations"
        );

    if (observacionesElemento) {

        observacionesElemento.textContent =
            cita.observaciones ||
            "Sin observaciones";
    }
}


// ==========================================
// CANCELAR CITA
// ==========================================

cancelAppointment.addEventListener(
    "click",
    async function () {

        // ==========================================
        // VERIFICAR CITA
        // ==========================================

        if (!citaActual) {

            message.textContent =
                "Primero debe buscar una cita.";

            message.style.color = "red";

            return;
        }


        // ==========================================
        // CONFIRMAR CANCELACIÓN
        // ==========================================

        const confirmar =
            confirm(
                "¿Está seguro de cancelar esta cita?\n\n" +
                "La cita no podrá ser reprogramada posteriormente."
            );

        if (!confirmar) {
            return;
        }


        try {

            // ==========================================
            // ACTUALIZAR ESTADO
            // ==========================================

            await supabasePatch(
                "citas",
                `?id=eq.${citaActual.id}`,
                {
                    estado: "CANCELADA"
                }
            );


            // ==========================================
            // ACTUALIZAR INTERFAZ
            // ==========================================

            appointmentResult.classList.add(
                "hidden"
            );

            message.textContent =
                "La cita ha sido cancelada correctamente.";

            message.style.color = "green";


            // ==========================================
            // LIMPIAR CITA ACTUAL
            // ==========================================

            citaActual = null;

            document.getElementById(
                "dni"
            ).value = "";


        } catch (error) {

            console.error(
                "Error al cancelar cita:",
                error
            );

            message.textContent =
                "No se pudo cancelar la cita.";

            message.style.color = "red";
        }
    }
);


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