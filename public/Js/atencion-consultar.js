const buscarForm = document.getElementById("buscarForm");
const historial = document.getElementById("historial");
const detalleSection = document.getElementById("detalleSection");

// ==========================================
// CALCULAR EDAD
// ==========================================

function calcularEdad(fechaNacimiento) {
    if (!fechaNacimiento) {
        return "No registrada";
    }

    const nacimiento = new Date(fechaNacimiento);
    const hoy = new Date();

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
// BUSCAR PACIENTE
// ==========================================

buscarForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const dni = document
        .getElementById("dni")
        .value
        .trim();

    if (dni === "") {
        alert("Ingrese el DNI.");
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

        if (!pacientes || pacientes.length === 0) {

            alert("No se encontró el paciente.");

            historial.innerHTML = `
                <p class="empty">
                    No se encontraron atenciones para este paciente.
                </p>
            `;

            detalleSection.style.display = "none";

            return;
        }

        const paciente = pacientes[0];

        // ==========================================
        // MOSTRAR DATOS DEL PACIENTE
        // ==========================================

        document.getElementById("nombrePaciente").textContent =
            `${paciente.nombres} ${paciente.apellido_paterno} ${paciente.apellido_materno || ""}`;

        document.getElementById("dniPaciente").textContent =
            paciente.dni;

        document.getElementById("historiaClinica").textContent =
            paciente.historia_clinica || "No registrada";

        document.getElementById("edadPaciente").textContent =
            calcularEdad(paciente.fecha_nacimiento);

        // ==========================================
        // BUSCAR HISTORIAL
        // ==========================================

        await mostrarHistorial(paciente.id);

    } catch (error) {

        console.error("Error al buscar paciente:", error);

        alert(
            "Ocurrió un error al consultar el paciente."
        );
    }
});

// ==========================================
// MOSTRAR HISTORIAL
// ==========================================

async function mostrarHistorial(pacienteId) {

    try {

        const resultados = await supabaseGet(
            "atenciones",
            `?select=*&paciente_id=eq.${pacienteId}&order=fecha_hora.desc`
        );

        if (!resultados || resultados.length === 0) {

            historial.innerHTML = `
                <p class="empty">
                    El paciente no tiene atenciones registradas.
                </p>
            `;

            detalleSection.style.display = "none";

            return;
        }

        historial.innerHTML = "";

        for (const atencion of resultados) {

            // ==========================================
            // BUSCAR MÉDICO
            // ==========================================

            let medico = "No registrado";
            let especialidad = "No registrada";

            if (atencion.profesional_id) {

                const profesionales = await supabaseGet(
                    "profesionales",
                    `?select=*&id=eq.${atencion.profesional_id}`
                );

                if (
                    profesionales &&
                    profesionales.length > 0
                ) {

                    const profesional =
                        profesionales[0];

                    medico =
                        `${profesional.nombres} ${profesional.apellidos}`;

                    // ==========================================
                    // BUSCAR ESPECIALIDAD
                    // ==========================================

                    if (profesional.especialidad_id) {

                        const especialidades =
                            await supabaseGet(
                                "especialidades",
                                `?select=*&id=eq.${profesional.especialidad_id}`
                            );

                        if (
                            especialidades &&
                            especialidades.length > 0
                        ) {

                            especialidad =
                                especialidades[0].nombre;
                        }
                    }
                }
            }

            // ==========================================
            // FECHA FORMATEADA
            // ==========================================

            const fecha = atencion.fecha_hora
                ? new Date(atencion.fecha_hora)
                    .toLocaleString("es-PE")
                : "Fecha no registrada";

            // ==========================================
            // CREAR ELEMENTO
            // ==========================================

            const item =
                document.createElement("div");

            item.classList.add(
                "attention-item"
            );

            item.innerHTML = `
                <h3>
                    Atención del ${fecha}
                </h3>

                <p>
                    <strong>Médico:</strong>
                    ${medico}
                </p>

                <p>
                    <strong>Especialidad:</strong>
                    ${especialidad}
                </p>

                <p>
                    <strong>Diagnóstico:</strong>
                    ${atencion.diagnostico || "No registrado"}
                </p>
            `;

            // ==========================================
            // CLICK → VER DETALLE
            // ==========================================

            item.addEventListener(
                "click",
                () => mostrarDetalle(
                    atencion,
                    medico,
                    especialidad,
                    fecha
                )
            );

            historial.appendChild(item);
        }

    } catch (error) {

        console.error(
            "Error al obtener historial:",
            error
        );

        historial.innerHTML = `
            <p class="empty">
                Ocurrió un error al cargar
                el historial clínico.
            </p>
        `;
    }
}

// ==========================================
// MOSTRAR DETALLE
// ==========================================

function mostrarDetalle(
    atencion,
    medico,
    especialidad,
    fecha
) {

    detalleSection.style.display = "block";

    document.getElementById(
        "detalleFecha"
    ).textContent =
        fecha;

    document.getElementById(
        "detalleMedico"
    ).textContent =
        medico;

    document.getElementById(
        "detalleEspecialidad"
    ).textContent =
        especialidad;

    document.getElementById(
        "detalleAnamnesis"
    ).textContent =
        atencion.anamnesis ||
        "No registrado";

    document.getElementById(
        "detalleExamen"
    ).textContent =
        atencion.examen_fisico ||
        "No registrado";

    document.getElementById(
        "detalleAuxiliares"
    ).textContent =
        atencion.examenes_auxiliares ||
        "No registrado";

    document.getElementById(
        "detalleDiagnostico"
    ).textContent =
        atencion.diagnostico ||
        "No registrado";

    document.getElementById(
        "detalleTratamiento"
    ).textContent =
        atencion.tratamiento ||
        "No registrado";

    document.getElementById(
        "detalleObservaciones"
    ).textContent =
        atencion.observaciones ||
        "No registrado";

    // ==========================================
    // LLEVAR AL DETALLE
    // ==========================================

    detalleSection.scrollIntoView({
        behavior: "smooth"
    });
}