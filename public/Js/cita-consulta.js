const searchForm =
    document.getElementById("searchForm");

const appointmentResult =
    document.getElementById("appointmentResult");

const message =
    document.getElementById("message");


// ==========================================
// BUSCAR CITA
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

                return;
            }


            // ==========================================
            // MOSTRAR LA PRIMERA CITA
            // ==========================================

            const cita =
                citas[0];


            await mostrarCita(
                cita
            );


            appointmentResult.classList.remove(
                "hidden"
            );

            message.textContent =
                "Cita encontrada.";

            message.style.color = "green";


        } catch (error) {

            console.error(
                "Error al consultar cita:",
                error
            );

            appointmentResult.classList.add(
                "hidden"
            );

            message.textContent =
                "Ocurrió un error al consultar la cita.";

            message.style.color = "red";
        }
    }
);


// ==========================================
// MOSTRAR CITA
// ==========================================

async function mostrarCita(
    cita
) {

    // ==========================================
    // FECHA
    // ==========================================

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
    // MOSTRAR FECHA
    // ==========================================

    const fechaElemento =
        document.getElementById(
            "appointmentDate"
        );

    if (fechaElemento) {

        fechaElemento.textContent =
            fecha;
    }


    // ==========================================
    // MOSTRAR HORA
    // ==========================================

    const horaElemento =
        document.getElementById(
            "appointmentTime"
        );

    if (horaElemento) {

        horaElemento.textContent =
            `${horaInicio} - ${horaFin}`;
    }


    // ==========================================
    // MOSTRAR OBSERVACIONES
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


    // ==========================================
    // BUSCAR PROFESIONAL
    // ==========================================

    if (!cita.profesional_id) {

        return;
    }


    const profesionales =
        await supabaseGet(
            "profesionales",
            `?select=*&id=eq.${cita.profesional_id}`
        );


    if (
        !profesionales ||
        profesionales.length === 0
    ) {

        return;
    }


    const profesional =
        profesionales[0];


    // ==========================================
    // MOSTRAR MÉDICO
    // ==========================================

    const medicoElemento =
        document.getElementById(
            "appointmentDoctor"
        );

    if (medicoElemento) {

        medicoElemento.textContent =
            `${profesional.nombres} ${profesional.apellidos}`;
    }


    // ==========================================
    // BUSCAR ESPECIALIDAD
    // ==========================================

    if (!profesional.especialidad_id) {

        return;
    }


    const especialidades =
        await supabaseGet(
            "especialidades",
            `?select=*&id=eq.${profesional.especialidad_id}`
        );


    if (
        !especialidades ||
        especialidades.length === 0
    ) {

        return;
    }


    const especialidad =
        especialidades[0];


    // ==========================================
    // MOSTRAR ESPECIALIDAD
    // ==========================================

    const especialidadElemento =
        document.getElementById(
            "appointmentSpecialty"
        );

    if (especialidadElemento) {

        especialidadElemento.textContent =
            especialidad.nombre;
    }
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