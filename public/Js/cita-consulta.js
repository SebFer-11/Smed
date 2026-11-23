
document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // 1. ELEMENTOS DEL DOM
    // ==========================================

    const searchForm = document.getElementById("searchForm");
    const dniInput = document.getElementById("dni");
    const dniCounter = document.getElementById("dniCounter");

    const appointmentResult = document.getElementById("appointmentResult");
    const emptySearchState = document.getElementById("emptySearchState");
    const message = document.getElementById("message");

    if (!searchForm || !dniInput || !appointmentResult || !message) {
        console.error(
            "No se encontraron todos los elementos necesarios para consultar citas."
        );
        return;
    }

    const submitButton = searchForm.querySelector(
        'button[type="submit"]'
    );

    if (!submitButton) {
        console.error("No se encontró el botón de consulta.");
        return;
    }

    const originalButtonHTML = submitButton.innerHTML;


    // ==========================================
    // 2. CONFIGURACIÓN DE MENSAJES
    // ==========================================

    const colores = {
        success: "green",
        error: "red",
        warning: "#d97706",
        info: "#2563eb"
    };

    function mostrarMensaje(texto, tipo = "info") {

        message.textContent = texto;
        message.style.color = colores[tipo] || colores.info;

        message.style.display = "block";
        message.setAttribute("role", "status");

    }


    // ==========================================
    // 3. CONTADOR Y VALIDACIÓN DEL DNI
    // ==========================================

    function actualizarContador() {

        const dni = dniInput.value;
        const longitud = dni.length;

        if (dniCounter) {

            dniCounter.textContent = `${longitud} / 8 dígitos`;

            if (longitud === 8) {
                dniCounter.style.color = "var(--primary)";
            } else {
                dniCounter.style.color = "var(--slate-400)";
            }

        }

    }

    dniInput.addEventListener("input", () => {

        // Permitir únicamente números
        dniInput.value = dniInput.value.replace(/[^0-9]/g, "");

        actualizarContador();

    });

    actualizarContador();


    // ==========================================
    // 4. AUTOCOMPLETADO DE DNI PARA PRUEBAS
    // ==========================================

    window.rellenarDni = function (dni) {

        dniInput.value = String(dni).replace(/[^0-9]/g, "");

        dniInput.dispatchEvent(
            new Event("input", { bubbles: true })
        );

        dniInput.focus();

    };


    // ==========================================
    // 5. CONTROL DE INTERFAZ
    // ==========================================

    function cambiarEstadoBoton(cargando) {

        submitButton.disabled = cargando;

        if (cargando) {

            submitButton.innerHTML = "Consultando...";
            submitButton.style.opacity = "0.7";
            submitButton.style.cursor = "wait";

        } else {

            submitButton.innerHTML = originalButtonHTML;
            submitButton.style.opacity = "1";
            submitButton.style.cursor = "pointer";

        }

    }


    // ==========================================
    // 6. LIMPIAR RESULTADOS ANTERIORES
    // ==========================================

    function limpiarResultado() {

        appointmentResult.classList.add("hidden");

        const campos = [
            "patientFullName",
            "patientDniDisplay",
            "patientAvatar",
            "appointmentDate",
            "appointmentTime",
            "appointmentDoctor",
            "appointmentSpecialty",
            "appointmentRoom",
            "appointmentCoverage"
        ];

        campos.forEach(id => {

            const elemento = document.getElementById(id);

            if (elemento) {
                elemento.textContent = "";
            }

        });

        const statusElemento = appointmentResult.querySelector(".status");

        if (statusElemento) {
            statusElemento.textContent = "";
        }

    }


    // ==========================================
    // 7. CONTROLAR ESTADO VACÍO
    // ==========================================

    function mostrarEstadoVacio(mostrar) {

        if (emptySearchState) {

            emptySearchState.style.display = mostrar ? "" : "none";

        }

    }


    // ==========================================
    // 8. FORMATEAR FECHA
    // ==========================================

    function formatearFecha(fecha) {

        if (!fecha) {
            return "Fecha no registrada";
        }

        const partes = fecha.split("-");

        if (partes.length !== 3) {
            return fecha;
        }

        const [anio, mes, dia] = partes;

        return `${dia}/${mes}/${anio}`;

    }


    // ==========================================
    // 9. OBTENER INICIALES DEL PACIENTE
    // ==========================================

    function obtenerIniciales(nombres, apellido) {

        const primeraInicial = nombres?.trim().charAt(0) || "";
        const segundaInicial = apellido?.trim().charAt(0) || "";

        return (primeraInicial + segundaInicial).toUpperCase();

    }


    // ==========================================
    // 10. VERIFICAR COBERTURA SIS
    // ==========================================

    function obtenerEstadoSIS(paciente) {

        const estado = String(paciente.sis_estado ?? "")
            .trim()
            .toUpperCase();

        const sisActivo = [
            "ACTIVO",
            "VIGENTE",
            "TRUE"
        ].includes(estado);

        if (sisActivo && paciente.codigo_sis) {

            return `SIS Activo (${paciente.codigo_sis})`;

        }

        if (sisActivo) {

            return "SIS Activo";

        }

        return "Sin SIS activo";

    }


    // ==========================================
    // 11. BUSCAR PACIENTE POR DNI
    // ==========================================

    async function buscarPaciente(dni) {

        const pacientes = await supabaseGet(
            "pacientes",
            `?select=*&dni=eq.${encodeURIComponent(dni)}`
        );

        if (!Array.isArray(pacientes)) {

            throw new Error(
                "La respuesta del servidor al buscar pacientes no es válida."
            );

        }

        return pacientes[0] || null;

    }


    // ==========================================
    // 12. BUSCAR CITAS PROGRAMADAS
    // ==========================================

    async function buscarCitasProgramadas(pacienteId) {

        const citas = await supabaseGet(
            "citas",
            `?select=*&paciente_id=eq.${encodeURIComponent(pacienteId)}&estado=eq.PROGRAMADA&order=fecha.asc,hora_inicio.asc`
        );

        if (!Array.isArray(citas)) {

            throw new Error(
                "La respuesta del servidor al buscar citas no es válida."
            );

        }

        return citas;

    }


    // ==========================================
    // 13. MOSTRAR INFORMACIÓN DEL PACIENTE
    // ==========================================

    function mostrarDatosPaciente(paciente) {

        const nombreCompleto = [
            paciente.nombres,
            paciente.apellido_paterno,
            paciente.apellido_materno
        ]
            .filter(Boolean)
            .join(" ");

        const nombreElemento = document.getElementById(
            "patientFullName"
        );

        const dniElemento = document.getElementById(
            "patientDniDisplay"
        );

        const avatarElemento = document.getElementById(
            "patientAvatar"
        );

        if (nombreElemento) {
            nombreElemento.textContent = nombreCompleto || "No disponible";
        }

        if (dniElemento) {
            dniElemento.textContent = `DNI: ${paciente.dni}`;
        }

        if (avatarElemento) {

            avatarElemento.textContent = obtenerIniciales(
                paciente.nombres,
                paciente.apellido_paterno
            );

        }

    }


    // ==========================================
    // 14. MOSTRAR FECHA Y HORARIO
    // ==========================================

    function mostrarFechaHorario(cita) {

        const fechaElemento = document.getElementById(
            "appointmentDate"
        );

        const horaElemento = document.getElementById(
            "appointmentTime"
        );

        if (fechaElemento) {

            fechaElemento.textContent = formatearFecha(
                cita.fecha
            );

        }

        if (horaElemento) {

            const horaInicio = cita.hora_inicio
                ? cita.hora_inicio.substring(0, 5)
                : "--:--";

            const horaFin = cita.hora_fin
                ? cita.hora_fin.substring(0, 5)
                : "--:--";

            horaElemento.textContent =
                `${horaInicio} - ${horaFin}`;

        }

    }


    // ==========================================
    // 15. MOSTRAR ESTADO Y COBERTURA
    // ==========================================

    function mostrarEstadoCobertura(cita, paciente) {

        const statusElemento = appointmentResult.querySelector(
            ".status"
        );

        const coberturaElemento = document.getElementById(
            "appointmentCoverage"
        );

        if (statusElemento) {

            statusElemento.textContent = cita.estado || "No disponible";

        }

        if (coberturaElemento) {

            coberturaElemento.textContent = obtenerEstadoSIS(
                paciente
            );

        }

    }


    // ==========================================
    // 16. MOSTRAR INFORMACIÓN DEL PROFESIONAL
    // ==========================================

    async function mostrarProfesional(cita) {

        const medicoElemento = document.getElementById(
            "appointmentDoctor"
        );

        const especialidadElemento = document.getElementById(
            "appointmentSpecialty"
        );

        if (medicoElemento) {
            medicoElemento.textContent = "Consultando...";
        }

        if (especialidadElemento) {
            especialidadElemento.textContent = "Consultando...";
        }

        const profesionales = await supabaseGet(
            "profesionales",
            `?select=*&id=eq.${encodeURIComponent(cita.profesional_id)}`
        );

        const profesional = profesionales?.[0];

        if (!profesional) {

            if (medicoElemento) {
                medicoElemento.textContent = "No disponible";
            }

            if (especialidadElemento) {
                especialidadElemento.textContent = "No disponible";
            }

            return;

        }

        if (medicoElemento) {

            medicoElemento.textContent = [
                profesional.nombres,
                profesional.apellidos
            ]
                .filter(Boolean)
                .join(" ") || "No disponible";

        }

        if (!profesional.especialidad_id) {

            if (especialidadElemento) {
                especialidadElemento.textContent = "No asignada";
            }

            return;

        }

        const especialidades = await supabaseGet(
            "especialidades",
            `?select=*&id=eq.${encodeURIComponent(profesional.especialidad_id)}`
        );

        if (especialidadElemento) {

            especialidadElemento.textContent =
                especialidades?.[0]?.nombre || "No disponible";

        }

    }


    // ==========================================
    // 17. MOSTRAR INFORMACIÓN DEL CONSULTORIO
    // ==========================================

    async function mostrarConsultorio(cita) {

        const consultorioElemento = document.getElementById(
            "appointmentRoom"
        );

        if (consultorioElemento) {
            consultorioElemento.textContent = "Consultando...";
        }

        const consultorios = await supabaseGet(
            "consultorios",
            `?select=*&id=eq.${encodeURIComponent(cita.consultorio_id)}`
        );

        if (consultorioElemento) {

            consultorioElemento.textContent =
                consultorios?.[0]?.nombre || "No disponible";

        }

    }


    // ==========================================
    // 18. MOSTRAR INFORMACIÓN COMPLETA DE LA CITA
    // ==========================================

    async function mostrarCita(cita, paciente) {

        // Información principal
        mostrarDatosPaciente(paciente);

        // Fecha y horario
        mostrarFechaHorario(cita);

        // Estado y cobertura
        mostrarEstadoCobertura(cita, paciente);

        // Información relacionada
        await Promise.all([
            mostrarProfesional(cita),
            mostrarConsultorio(cita)
        ]);

        // Mostrar resultado una vez completadas las consultas
        appointmentResult.classList.remove("hidden");

        mostrarEstadoVacio(false);

    }


    // ==========================================
    // 19. EVENTO PRINCIPAL: CONSULTAR CITA
    // ==========================================

    searchForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const dni = dniInput.value.trim();

        // --------------------------------------
        // VALIDACIÓN DEL DNI
        // --------------------------------------

        if (!/^\d{8}$/.test(dni)) {

            limpiarResultado();
            mostrarEstadoVacio(true);

            mostrarMensaje(
                "DNI inválido. Debe ingresar exactamente 8 dígitos numéricos.",
                "error"
            );

            dniInput.focus();

            return;

        }

        // --------------------------------------
        // INICIAR CONSULTA
        // --------------------------------------

        cambiarEstadoBoton(true);

        limpiarResultado();
        mostrarEstadoVacio(false);

        mostrarMensaje(
            "Buscando información del paciente...",
            "info"
        );

        try {

            // ==================================
            // PASO 1: BUSCAR PACIENTE
            // ==================================

            const paciente = await buscarPaciente(dni);

            if (!paciente) {

                mostrarEstadoVacio(true);

                mostrarMensaje(
                    `No se encontró ningún paciente registrado con el DNI ${dni}. Verifique el número ingresado.`,
                    "error"
                );

                return;

            }

            // ==================================
            // PASO 2: BUSCAR CITAS PROGRAMADAS
            // ==================================

            mostrarMensaje(
                "Paciente encontrado. Verificando sus citas programadas...",
                "info"
            );

            const citas = await buscarCitasProgramadas(
                paciente.id
            );

            // ==================================
            // PASO 3: VALIDAR EXISTENCIA DE CITAS
            // ==================================

            if (citas.length === 0) {

                mostrarEstadoVacio(true);

                mostrarMensaje(
                    "El paciente está registrado, pero no tiene citas con estado PROGRAMADA.",
                    "warning"
                );

                return;

            }

            // ==================================
            // PASO 4: SELECCIONAR PRIMERA CITA
            // ==================================

            // Supabase ya entrega las citas ordenadas
            // por fecha ascendente y hora ascendente.

            const cita = citas[0];

            // ==================================
            // PASO 5: MOSTRAR INFORMACIÓN
            // ==================================

            mostrarMensaje(
                "Cita encontrada. Cargando los datos del paciente y de la atención...",
                "info"
            );

            await mostrarCita(cita, paciente);

            // ==================================
            // PASO 6: CONFIRMAR RESULTADO
            // ==================================

            mostrarMensaje(
                "Consulta realizada correctamente. Se muestran los datos de la primera cita programada del paciente.",
                "success"
            );

            console.info("Consulta de cita exitosa:", {
                dni: paciente.dni,
                paciente: paciente.id,
                cita: cita.id,
                fecha: cita.fecha,
                hora: cita.hora_inicio,
                estado: cita.estado
            });

        } catch (error) {

            // ==================================
            // MANEJO DE ERRORES
            // ==================================

            console.error(
                "Error al consultar la cita:",
                error
            );

            limpiarResultado();
            mostrarEstadoVacio(true);

            mostrarMensaje(
                "No fue posible completar la consulta debido a un error de conexión o del servidor. Verifique su conexión e inténtelo nuevamente.",
                "error"
            );

        } finally {

            // ==================================
            // RESTAURAR BOTÓN
            // ==================================

            cambiarEstadoBoton(false);

        }

    });


    // ==========================================
    // 20. ESTADO INICIAL
    // ==========================================

    limpiarResultado();
    mostrarEstadoVacio(true);

    console.info(
        "Módulo de consulta de citas inicializado correctamente."
    );

});
