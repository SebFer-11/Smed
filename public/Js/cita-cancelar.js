document.addEventListener("DOMContentLoaded", () => {
    // ==========================================
    // 1. REFERENCIAS AL DOM
    // ==========================================
    const searchForm = document.getElementById("searchForm");
    const dniInput = document.getElementById("dni");
    const dniCounter = document.getElementById("dniCounter");

    const emptySearchState = document.getElementById("emptySearchState");
    const appointmentResult = document.getElementById("appointmentResult");
    const messageEl = document.getElementById("message");

    // Modal de confirmación
    const cancelAppointmentBtn = document.getElementById("cancelAppointment");
    const confirmModal = document.getElementById("confirmModal");
    const btnBack = document.getElementById("btnBack");
    const btnProceed = document.getElementById("btnProceed");

    let citaActual = null;
    let pacienteActual = null;

    // ==========================================
    // 2. CONTADOR Y FILTRO NUMÉRICO DE DNI
    // ==========================================
    if (dniInput) {
        dniInput.addEventListener("input", () => {
            dniInput.value = dniInput.value.replace(/\D/g, "").slice(0, 8);
            actualizarContadorDNI();
        });
    }

    // ==========================================
    // 3. BÚSQUEDA DE CITA POR DNI (CC-01, CC-02, CC-03)
    // ==========================================
    searchForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        limpiarMensaje();

        const dni = dniInput.value.trim();

        // ------------------------------------------
        // VALIDACIÓN CC-02 / UAT-RC-02: DNI de 8 dígitos
        // ------------------------------------------
        if (!/^\d{8}$/.test(dni)) {
            ocultarTarjetaCita();
            citaActual = null;
            pacienteActual = null;
            mostrarMensaje("El DNI debe tener 8 dígitos", "error");
            dniInput.focus();
            return;
        }

        try {
            // ------------------------------------------
            // PASO 1: BUSCAR PACIENTE EN SUPABASE (CC-03)
            // ------------------------------------------
            const pacientes = await supabaseGet(
                "pacientes",
                `?select=*&dni=eq.${encodeURIComponent(dni)}`
            );

            if (!pacientes || pacientes.length === 0) {
                ocultarTarjetaCita();
                citaActual = null;
                pacienteActual = null;
                mostrarMensaje("No se encontró el paciente", "error");
                return;
            }

            pacienteActual = pacientes[0];

            // ------------------------------------------
            // PASO 2: BUSCAR PRIMERA CITA PROGRAMADA (CC-01)
            // ------------------------------------------
            const citas = await supabaseGet(
                "citas",
                `?select=*&paciente_id=eq.${pacienteActual.id}&estado=eq.PROGRAMADA&order=fecha.asc,hora_inicio.asc`
            );

            if (!citas || citas.length === 0) {
                ocultarTarjetaCita();
                citaActual = null;
                mostrarMensaje("El paciente no tiene citas programadas.", "error");
                return;
            }

            citaActual = citas[0];

            // ------------------------------------------
            // PASO 3: RENDERIZAR TARJETA Y MOSTRAR ÉXITO
            // ------------------------------------------
            await renderizarCita(pacienteActual, citaActual);
            mostrarTarjetaCita();
            mostrarMensaje("Cita encontrada", "success");

        } catch (error) {
            console.error("Error al buscar cita:", error);
            ocultarTarjetaCita();
            citaActual = null;
            pacienteActual = null;
            mostrarMensaje("Ocurrió un error al consultar la cita.", "error");
        }
    });

    // ==========================================
    // 4. RENDERIZAR DATOS EN LA TARJETA HTML
    // ==========================================
    async function renderizarCita(paciente, cita) {
        // Datos del paciente
        const nombreCompleto = [
            paciente.nombres,
            paciente.apellido_paterno,
            paciente.apellido_materno
        ].filter(Boolean).join(" ").trim() || "Paciente Registrado";

        const iniciales = nombreCompleto
            .split(" ")
            .map((p) => p[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();

        establecerTexto("patientInitials", iniciales);
        establecerTexto("patientFullName", nombreCompleto);
        establecerTexto("patientDniText", `DNI: ${paciente.dni}`);

        // Fecha y Hora
        const fechaFormateada = formatearFecha(cita.fecha);
        const horaInicio = cita.hora_inicio ? cita.hora_inicio.substring(0, 5) : "--:--";
        const horaFin = cita.hora_fin ? ` - ${cita.hora_fin.substring(0, 5)}` : "";

        establecerTexto("appointmentDate", fechaFormateada);
        establecerTexto("appointmentTime", `${horaInicio}${horaFin}`);
        establecerTexto("appointmentOffice", cita.consultorio || "Consultorio Externo");
        establecerTexto("appointmentModality", cita.modalidad || "Consulta Externa");

        // Médico y Especialidad desde Supabase
        let nombreMedico = "Médico asignado";
        let nombreEspecialidad = "Medicina General";

        if (cita.profesional_id) {
            const profesionales = await supabaseGet(
                "profesionales",
                `?select=*&id=eq.${cita.profesional_id}`
            );

            if (profesionales && profesionales.length > 0) {
                const prof = profesionales[0];
                nombreMedico = `Dr(a). ${prof.nombres || ""} ${prof.apellidos || ""}`.trim();

                if (prof.especialidad_id) {
                    const especialidades = await supabaseGet(
                        "especialidades",
                        `?select=*&id=eq.${prof.especialidad_id}`
                    );
                    if (especialidades && especialidades.length > 0) {
                        nombreEspecialidad = especialidades[0].nombre;
                    }
                }
            }
        }

        establecerTexto("appointmentDoctor", nombreMedico);
        establecerTexto("appointmentSpecialty", nombreEspecialidad);
    }

    // ==========================================
    // 5. FLUJO DE CANCELACIÓN CON MODAL INTEGRADO
    // ==========================================
    if (cancelAppointmentBtn) {
        cancelAppointmentBtn.addEventListener("click", () => {
            if (!citaActual) {
                mostrarMensaje("Primero debe buscar una cita.", "error");
                return;
            }
            if (confirmModal) {
                confirmModal.classList.add("active");
            }
        });
    }

    if (btnBack && confirmModal) {
        btnBack.addEventListener("click", () => {
            confirmModal.classList.remove("active");
        });
    }

    if (btnProceed && confirmModal) {
        btnProceed.addEventListener("click", async () => {
            confirmModal.classList.remove("active");

            if (!citaActual) return;

            try {
                await supabasePatch(
                    "citas",
                    `?id=eq.${citaActual.id}`,
                    { estado: "CANCELADA" }
                );

                ocultarTarjetaCita();
                citaActual = null;
                pacienteActual = null;
                dniInput.value = "";
                actualizarContadorDNI();

                mostrarMensaje("La cita ha sido cancelada correctamente.", "success");

            } catch (error) {
                console.error("Error al cancelar cita:", error);
                mostrarMensaje("No se pudo cancelar la cita.", "error");
            }
        });
    }

    // ==========================================
    // 6. FUNCIONES AUXILIARES DE UI Y FORMATO
    // ==========================================
    function mostrarTarjetaCita() {
        if (appointmentResult) appointmentResult.classList.remove("hidden");
        if (emptySearchState) emptySearchState.style.display = "none";
    }

    function ocultarTarjetaCita() {
        if (appointmentResult) appointmentResult.classList.add("hidden");
        if (emptySearchState) emptySearchState.style.display = "block";
    }

    function actualizarContadorDNI() {
        if (!dniCounter || !dniInput) return;
        const len = dniInput.value.length;
        dniCounter.textContent = `${len} / 8 dígitos`;
        dniCounter.style.color = len === 8 ? "var(--primary)" : "var(--slate-400)";
    }

    function establecerTexto(id, texto) {
        const el = document.getElementById(id);
        if (el) el.textContent = texto;
    }

    function formatearFecha(fecha) {
        if (!fecha) return "Fecha no registrada";
        const partes = fecha.split("-");
        if (partes.length !== 3) return fecha;
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    function mostrarMensaje(texto, tipo = "info") {
        if (!messageEl) return;
        messageEl.className = `active ${tipo}`;
        messageEl.textContent = texto;
    }

    function limpiarMensaje() {
        if (!messageEl) return;
        messageEl.className = "";
        messageEl.textContent = "";
    }
});

// Función global para los chips de prueba rápida del HTML
function rellenarDni(dni) {
    const input = document.getElementById("dni");
    if (input) {
        input.value = dni;
        input.dispatchEvent(new Event("input"));
        input.focus();
    }
}