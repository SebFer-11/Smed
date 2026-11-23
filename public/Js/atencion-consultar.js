document.addEventListener("DOMContentLoaded", () => {
    // ==========================================
    // 1. REFERENCIAS AL DOM
    // ==========================================
    const buscarForm = document.getElementById("buscarForm");
    const dniInput = document.getElementById("dni");
    const searchMessageEl = document.getElementById("searchMessage");
    const historialEl = document.getElementById("historial");
    const contadorAtencionesEl = document.getElementById("contadorAtenciones");
    const detalleSection = document.getElementById("detalleSection");

    // Filtro numérico en tiempo real para el DNI
    if (dniInput) {
        dniInput.addEventListener("input", () => {
            dniInput.value = dniInput.value.replace(/\D/g, "").slice(0, 8);
        });
    }

    // ==========================================
    // 2. BUSCAR PACIENTE Y CONSULTAR HISTORIAL
    // ==========================================
    if (buscarForm) {
        buscarForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            ocultarMensaje();

            const dni = dniInput ? dniInput.value.trim() : "";

            if (!/^\d{8}$/.test(dni)) {
                limpiarDatosPaciente();
                ocultarDetalle();
                renderizarEstadoVacioHistorial("Ingrese un DNI válido de 8 dígitos para consultar.");
                mostrarMensaje("Ingrese un DNI válido de 8 dígitos.", "error");
                if (dniInput) dniInput.focus();
                return;
            }

            const btnConsultar = buscarForm.querySelector('button[type="submit"]');
            setEstadoBoton(btnConsultar, true, "Consultando...");

            try {
                // Consultar paciente en Supabase
                const pacientes = await supabaseGet(
                    "pacientes",
                    `?select=*&dni=eq.${encodeURIComponent(dni)}`
                );

                // CP-CA-02: Paciente no registrado
                if (!Array.isArray(pacientes) || pacientes.length === 0) {
                    limpiarDatosPaciente(); // Evita mostrar datos de un paciente consultado previamente
                    ocultarDetalle();
                    actualizarContador(0);
                    renderizarEstadoVacioHistorial("No se encontraron atenciones para este paciente.");
                    mostrarMensaje("No se encontró el paciente", "error");
                    return;
                }

                const paciente = pacientes[0];

                // Renderizar datos personales (CP-CA-01 y CP-CA-03)
                renderizarDatosPaciente(paciente);

                // Consultar historial de atenciones del paciente
                await mostrarHistorial(paciente.id);

            } catch (error) {
                console.error("Error al buscar paciente:", error);
                limpiarDatosPaciente();
                ocultarDetalle();
                actualizarContador(0);
                mostrarMensaje("Ocurrió un error al consultar el paciente.", "error");
            } finally {
                setEstadoBoton(btnConsultar, false, "Consultar");
            }
        });
    }

    // ==========================================
    // 3. MOSTRAR HISTORIAL DE ATENCIONES
    // ==========================================
    async function mostrarHistorial(pacienteId) {
        try {
            const resultados = await supabaseGet(
                "atenciones",
                `?select=*&paciente_id=eq.${encodeURIComponent(pacienteId)}&order=fecha_hora.desc`
            );

            // CP-CA-03: Paciente registrado sin atenciones médicas
            if (!Array.isArray(resultados) || resultados.length === 0) {
                ocultarDetalle();
                actualizarContador(0);
                renderizarEstadoVacioHistorial("El paciente no tiene atenciones registradas.");
                mostrarMensaje("El paciente no tiene atenciones registradas", "warning");
                return;
            }

            // CP-CA-01: Paciente con historial clínico
            ocultarDetalle();
            actualizarContador(resultados.length);
            historialEl.innerHTML = "";

            for (const atencion of resultados) {
                const { medico, especialidad } = await obtenerDatosProfesional(atencion.profesional_id);

                const fecha = atencion.fecha_hora
                    ? new Date(atencion.fecha_hora).toLocaleString("es-PE", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                    })
                    : "Fecha no registrada";

                const item = document.createElement("div");
                item.className = "attention-item";
                item.innerHTML = `
                    <div class="attention-item-header">
                        <h3>
                            <ion-icon name="calendar-outline"></ion-icon>
                            Atención del ${fecha}
                        </h3>
                        <span class="view-detail-hint">
                            Ver detalle completo <ion-icon name="chevron-forward-outline"></ion-icon>
                        </span>
                    </div>
                    <div class="attention-meta">
                        <p><strong>Médico:</strong> ${medico}</p>
                        <p><strong>Especialidad:</strong> ${especialidad}</p>
                        <p><strong>Diagnóstico:</strong> ${atencion.diagnostico || "No registrado"}</p>
                    </div>
                `;

                item.addEventListener("click", () => {
                    document.querySelectorAll(".attention-item").forEach((el) => el.classList.remove("selected"));
                    item.classList.add("selected");
                    mostrarDetalle(atencion, medico, especialidad, fecha);
                });

                historialEl.appendChild(item);
            }

            mostrarMensaje(
                `Historial clínico cargado (${resultados.length} ${resultados.length === 1 ? "atención encontrada" : "atenciones encontradas"}).`,
                "success"
            );

        } catch (error) {
            console.error("Error al obtener historial:", error);
            ocultarDetalle();
            actualizarContador(0);
            renderizarEstadoVacioHistorial("Ocurrió un error al cargar el historial clínico.");
            mostrarMensaje("Ocurrió un error al cargar el historial clínico.", "error");
        }
    }

    async function obtenerDatosProfesional(profesionalId) {
        let medico = "No registrado";
        let especialidad = "No registrada";

        if (!profesionalId) return { medico, especialidad };

        const profesionales = await supabaseGet(
            "profesionales",
            `?select=*&id=eq.${encodeURIComponent(profesionalId)}`
        );

        if (Array.isArray(profesionales) && profesionales.length > 0) {
            const profesional = profesionales[0];
            medico = `${profesional.nombres || ""} ${profesional.apellidos || ""}`.trim() || "No registrado";

            if (profesional.especialidad_id) {
                const especialidades = await supabaseGet(
                    "especialidades",
                    `?select=*&id=eq.${encodeURIComponent(profesional.especialidad_id)}`
                );

                if (Array.isArray(especialidades) && especialidades.length > 0) {
                    especialidad = especialidades[0].nombre;
                }
            }
        }

        return { medico, especialidad };
    }

    // ==========================================
    // 4. MOSTRAR DETALLE DE ATENCIÓN
    // ==========================================
    function mostrarDetalle(atencion, medico, especialidad, fecha) {
        if (!detalleSection) return;
        detalleSection.style.display = "block";

        establecerTexto("detalleFecha", fecha);
        establecerTexto("detalleMedico", medico);
        establecerTexto("detalleEspecialidad", especialidad);
        establecerTexto("detalleAnamnesis", atencion.anamnesis || "No registrado");
        establecerTexto("detalleExamen", atencion.examen_fisico || "No registrado");
        establecerTexto("detalleAuxiliares", atencion.examenes_auxiliares || "No registrado");
        establecerTexto("detalleDiagnostico", atencion.diagnostico || "No registrado");
        establecerTexto("detalleTratamiento", atencion.tratamiento || "No registrado");
        establecerTexto("detalleObservaciones", atencion.observaciones || "No registrado");

        detalleSection.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    function ocultarDetalle() {
        if (detalleSection) {
            detalleSection.style.display = "none";
        }
    }

    // ==========================================
    // 5. UTILIDADES DE UI Y FORMATO
    // ==========================================
    function renderizarDatosPaciente(paciente) {
        const nombreCompleto = [
            paciente.nombres,
            paciente.apellido_paterno,
            paciente.apellido_materno
        ].filter(Boolean).join(" ").trim();

        establecerTexto("nombrePaciente", nombreCompleto || "No registrado");
        establecerTexto("dniPaciente", paciente.dni || "No registrado");
        establecerTexto("historiaClinica", paciente.historia_clinica || "No registrada");
        establecerTexto("edadPaciente", calcularEdad(paciente.fecha_nacimiento));
    }

    function limpiarDatosPaciente() {
        ["nombrePaciente", "dniPaciente", "historiaClinica", "edadPaciente"].forEach((id) => {
            establecerTexto(id, "-");
        });
    }

    function renderizarEstadoVacioHistorial(mensaje) {
        if (!historialEl) return;
        historialEl.innerHTML = `
            <div class="empty-state-box">
                <ion-icon name="document-text-outline"></ion-icon>
                <p class="empty">${mensaje}</p>
            </div>
        `;
    }

    function actualizarContador(cantidad) {
        if (!contadorAtencionesEl) return;
        contadorAtencionesEl.textContent = `${cantidad} ${cantidad === 1 ? "registro" : "registros"}`;
    }

    function mostrarMensaje(texto, tipo = "info") {
        if (!searchMessageEl) return;
        const iconos = {
            success: "checkmark-circle",
            error: "alert-circle",
            warning: "warning",
            info: "information-circle"
        };
        const icono = iconos[tipo] || "information-circle";
        searchMessageEl.className = `inline-alert active ${tipo}`;
        searchMessageEl.innerHTML = `<ion-icon name="${icono}"></ion-icon><span>${texto}</span>`;
    }

    function ocultarMensaje() {
        if (!searchMessageEl) return;
        searchMessageEl.className = "inline-alert";
        searchMessageEl.innerHTML = "";
    }

    function establecerTexto(id, valor) {
        const el = document.getElementById(id);
        if (el) el.textContent = valor;
    }

    function setEstadoBoton(boton, cargando, texto) {
        if (!boton) return;
        boton.disabled = cargando;
        const span = boton.querySelector("span");
        if (span) span.textContent = texto;
        else boton.textContent = texto;
    }

    function calcularEdad(fechaNacimiento) {
        if (!fechaNacimiento) return "No registrada";
        const nacimiento = new Date(fechaNacimiento);
        if (isNaN(nacimiento.getTime())) return "No registrada";

        const hoy = new Date();
        let edad = hoy.getFullYear() - nacimiento.getFullYear();
        const mes = hoy.getMonth() - nacimiento.getMonth();

        if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
            edad--;
        }
        return `${edad} años`;
    }
});