const historyForm =
    document.getElementById("historyForm");

const historyResult =
    document.getElementById("historyResult");

const message =
    document.getElementById("message");


// ==========================================
// BUSCAR HISTORIAL
// ==========================================

historyForm.addEventListener(
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

            historyResult.classList.add(
                "hidden"
            );

            message.textContent =
                "El DNI debe tener 8 dígitos.";

            message.style.color =
                "red";

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

                historyResult.classList.add(
                    "hidden"
                );

                message.textContent =
                    "No se encontró el paciente.";

                message.style.color =
                    "red";

                return;
            }


            const paciente =
                pacientes[0];


            // ==========================================
            // BUSCAR ATENCIONES
            // ==========================================

            const atenciones =
                await supabaseGet(
                    "atenciones",
                    `?select=*&paciente_id=eq.${paciente.id}&order=fecha_hora.desc`
                );


            if (
                !atenciones ||
                atenciones.length === 0
            ) {

                historyResult.classList.add(
                    "hidden"
                );

                message.textContent =
                    "El paciente no tiene atenciones registradas.";

                message.style.color =
                    "red";

                return;
            }


            // ==========================================
            // MOSTRAR INFORMACIÓN
            // ==========================================

            await mostrarHistorial(
                paciente,
                atenciones
            );


            historyResult.classList.remove(
                "hidden"
            );

            message.textContent =
                "Historial clínico encontrado.";

            message.style.color =
                "green";


        } catch (error) {

            console.error(
                "Error al consultar historial:",
                error
            );

            historyResult.classList.add(
                "hidden"
            );

            message.textContent =
                "Ocurrió un error al consultar el historial.";

            message.style.color =
                "red";
        }
    }
);


// ==========================================
// MOSTRAR HISTORIAL
// ==========================================

async function mostrarHistorial(
    paciente,
    atenciones
) {

    // ==========================================
    // DATOS DEL PACIENTE
    // ==========================================

    establecerTexto(
        "nombrePaciente",
        `${paciente.nombres} ${paciente.apellido_paterno} ${paciente.apellido_materno || ""}`
    );

    establecerTexto(
        "dniPaciente",
        paciente.dni
    );

    establecerTexto(
        "historiaClinica",
        paciente.historia_clinica ||
        "No registrada"
    );


    // ==========================================
    // CONTENEDOR DEL HISTORIAL
    // ==========================================

    /*
     * Intentamos encontrar un contenedor
     * específico para las atenciones.
     */

    const contenedor =
        document.getElementById(
            "atencionesContainer"
        );


    if (!contenedor) {

        console.warn(
            "No existe #atencionesContainer en el HTML."
        );

        return;
    }


    contenedor.innerHTML = "";


    // ==========================================
    // RECORRER ATENCIONES
    // ==========================================

    for (const atencion of atenciones) {

        let medico =
            "No registrado";

        let especialidad =
            "No registrada";


        // ==========================================
        // BUSCAR PROFESIONAL
        // ==========================================

        if (atencion.profesional_id) {

            const profesionales =
                await supabaseGet(
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

                        especialidad =
                            especialidades[0].nombre;
                    }
                }
            }
        }


        // ==========================================
        // FECHA
        // ==========================================

        const fecha =
            atencion.fecha_hora
                ? new Date(
                    atencion.fecha_hora
                ).toLocaleString("es-PE")
                : "Fecha no registrada";


        // ==========================================
        // CREAR TARJETA
        // ==========================================

        const item =
            document.createElement(
                "div"
            );

        item.classList.add(
            "history-item"
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

            <p>
                <strong>Tratamiento:</strong>
                ${atencion.tratamiento || "No registrado"}
            </p>
        `;


        contenedor.appendChild(
            item
        );
    }
}


// ==========================================
// ESTABLECER TEXTO
// ==========================================

function establecerTexto(
    id,
    texto
) {

    const elemento =
        document.getElementById(id);

    if (elemento) {

        elemento.textContent =
            texto;
    }
}