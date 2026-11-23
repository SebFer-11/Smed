document.addEventListener("DOMContentLoaded", () => {
    // ==========================================
    // 1. REFERENCIAS AL DOM Y ESTADO
    // ==========================================
    const buscarPacienteForm = document.getElementById("buscarPacienteForm");
    const atencionForm = document.getElementById("atencionForm");
    const dniInput = document.getElementById("dni");

    let pacienteActual = null;
    let citaActual = null;
    let procesandoRegistro = false;

    // Filtro preventivo para el input de DNI (solo números, máximo 8)
    if (dniInput) {
        dniInput.addEventListener("input", () => {
            dniInput.value = dniInput.value.replace(/\D/g, "").slice(0, 8);
        });
    }

    // ==========================================
    // 2. BÚSQUEDA DE PACIENTE Y CITA (RA-01, RA-02, RA-03)
    // ==========================================
    if (buscarPacienteForm) {
        buscarPacienteForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const dni = dniInput ? dniInput.value.trim() : "";

            // Validación básica de DNI
            if (!/^\d{8}$/.test(dni)) {
                limpiarDatosPacienteYCita();
                alert("Ingrese un DNI válido de 8 dígitos.");
                if (dniInput) dniInput.focus();
                return;
            }

            const btnBuscar = buscarPacienteForm.querySelector('button[type="submit"]');
            setEstadoBoton(btnBuscar, true, "Buscando...");

            try {
                // Consultar paciente en Supabase
                const pacientes = await supabaseGet(
                    "pacientes",
                    `?select=*&dni=eq.${encodeURIComponent(dni)}`
                );

                // RA-02: Paciente no registrado
                if (!Array.isArray(pacientes) || pacientes.length === 0) {
                    limpiarDatosPacienteYCita(); // Evita mostrar datos residuales de búsquedas previas
                    alert("No se encontró un paciente con ese DNI");
                    return;
                }

                const paciente = pacientes[0];
                pacienteActual = paciente;

                // Renderizar datos personales del paciente (RA-01)
                renderizarDatosPaciente(paciente);

                // Consultar cita PROGRAMADA más próxima (RA-03)
                const tieneCita = await buscarCitaPaciente(paciente.id);

                if (tieneCita) {
                    alert("Paciente y cita programada encontrados.");
                }
                // Si no tiene cita, buscarCitaPaciente ya mostró el mensaje exacto de RA-03

            } catch (error) {
                console.error("Error al buscar paciente:", error);
                limpiarDatosPacienteYCita();
                alert("Ocurrió un error al buscar el paciente.");
            } finally {
                setEstadoBoton(btnBuscar, false, "Buscar paciente");
            }
        });
    }

    // ==========================================
    // 3. CONSULTA DE CITA PROGRAMADA (RA-03)
    // ==========================================
    async function buscarCitaPaciente(pacienteId) {
        try {
            const citas = await supabaseGet(
                "citas",
                `?select=*&paciente_id=eq.${encodeURIComponent(pacienteId)}&estado=eq.PROGRAMADA&order=fecha.asc,hora_inicio.asc`
            );

            // RA-03: Paciente registrado sin citas PROGRAMADA
            if (!Array.isArray(citas) || citas.length === 0) {
                citaActual = null;
                establecerTexto("fechaCita", "No disponible");
                establecerTexto("medico", "No disponible");
                establecerTexto("especialidad", "No disponible");

                alert("El paciente no tiene una cita programada");
                return false;
            }

            const cita = citas[0];
            citaActual = cita;

            // Formatear fecha y hora
            const fechaFormateada = formatearFecha(cita.fecha);
            const horaFormateada = cita.hora_inicio ? cita.hora_inicio.substring(0, 5) : "";
            establecerTexto(
                "fechaCita",
                horaFormateada ? `${fechaFormateada} - ${horaFormateada}` : fechaFormateada
            );

            // Obtener datos del profesional y su especialidad
            await cargarProfesionalYEspecialidad(cita.profesional_id);

            return true;

        } catch (error) {
            console.error("Error al buscar cita:", error);
            citaActual = null;
            establecerTexto("fechaCita", "No disponible");
            establecerTexto("medico", "No disponible");
            establecerTexto("especialidad", "No disponible");
            alert("No se pudo consultar la cita del paciente.");
            return false;
        }
    }

    async function cargarProfesionalYEspecialidad(profesionalId) {
        if (!profesionalId) {
            establecerTexto("medico", "No disponible");
            establecerTexto("especialidad", "No disponible");
            return;
        }

        const profesionales = await supabaseGet(
            "profesionales",
            `?select=*&id=eq.${encodeURIComponent(profesionalId)}`
        );

        if (!Array.isArray(profesionales) || profesionales.length === 0) {
            establecerTexto("medico", "No disponible");
            establecerTexto("especialidad", "No disponible");
            return;
        }

        const profesional = profesionales[0];
        const nombreMedico = `${profesional.nombres || ""} ${profesional.apellidos || ""}`.trim();
        establecerTexto("medico", nombreMedico || "No disponible");

        if (!profesional.especialidad_id) {
            establecerTexto("especialidad", "No disponible");
            return;
        }

        const especialidades = await supabaseGet(
            "especialidades",
            `?select=*&id=eq.${encodeURIComponent(profesional.especialidad_id)}`
        );

        const nombreEspecialidad =
            Array.isArray(especialidades) && especialidades.length > 0
                ? especialidades[0].nombre
                : "No disponible";

        establecerTexto("especialidad", nombreEspecialidad);
    }

    // ==========================================
    // 4. REGISTRO DE ATENCIÓN MÉDICA (RA-04, RA-05)
    // ==========================================
    if (atencionForm) {
        atencionForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            if (procesandoRegistro) return;

            // RA-05: Validar que exista un paciente seleccionado antes de continuar
            if (!pacienteActual) {
                alert("Primero debe buscar y seleccionar un paciente");
                if (dniInput) dniInput.focus();
                return;
            }

            // Validar que exista una cita programada asociada (refuerzo de RA-03)
            if (!citaActual) {
                alert("El paciente no tiene una cita programada");
                return;
            }

            // Obtener campos clínicos
            const anamnesisEl = document.getElementById("anamnesis");
            const examenFisicoEl = document.getElementById("examenFisico");
            const diagnosticoEl = document.getElementById("diagnostico");
            const tratamientoEl = document.getElementById("tratamiento");

            // Captura opcional de campos adicionales si existen en el HTML
            const examenesAuxEl = document.getElementById("examenesAuxiliares") || document.getElementById("examenes");
            const observacionesEl = document.getElementById("observaciones");

            const anamnesis = anamnesisEl ? anamnesisEl.value.trim() : "";
            const examenFisico = examenFisicoEl ? examenFisicoEl.value.trim() : "";
            const diagnostico = diagnosticoEl ? diagnosticoEl.value.trim() : "";
            const tratamiento = tratamientoEl ? tratamientoEl.value.trim() : "";

            // RA-04: Validación de campos obligatorios (respaldo si el navegador no detuvo el submit)
            if (!anamnesis || !examenFisico || !diagnostico || !tratamiento) {
                // Si el navegador soporta reportValidity() y los campos tienen atributo required, dispara el globo nativo
                if (typeof atencionForm.reportValidity === "function" && !atencionForm.checkValidity()) {
                    atencionForm.reportValidity();
                    return;
                }
                alert("Complete los campos obligatorios de la atención.");
                return;
            }

            const btnRegistrar = atencionForm.querySelector('button[type="submit"]');
            procesandoRegistro = true;
            setEstadoBoton(btnRegistrar, true, "Registrando...");

            try {
                // Evitar duplicidad de atención para la misma cita
                const atencionesExistentes = await supabaseGet(
                    "atenciones",
                    `?select=id&cita_id=eq.${encodeURIComponent(citaActual.id)}`
                );

                if (Array.isArray(atencionesExistentes) && atencionesExistentes.length > 0) {
                    alert("Esta cita ya tiene una atención médica registrada.");
                    return;
                }

                // Construir payload para Supabase
                const nuevaAtencion = {
                    cita_id: citaActual.id,
                    paciente_id: pacienteActual.id,
                    profesional_id: citaActual.profesional_id,
                    fecha_hora: new Date().toISOString(),
                    anamnesis,
                    examen_fisico: examenFisico,
                    examenes_auxiliares: examenesAuxEl ? examenesAuxEl.value.trim() : "",
                    diagnostico,
                    tratamiento,
                    observaciones: observacionesEl ? observacionesEl.value.trim() : "",
                    usuario_registro_id: null
                };

                await supabasePost("atenciones", nuevaAtencion);

                // Actualizar estado de la cita a ATENDIDA
                await supabasePatch(
                    "citas",
                    `?id=eq.${encodeURIComponent(citaActual.id)}`,
                    { estado: "ATENDIDA" }
                );

                alert("Atención médica registrada correctamente.");

                // Resetear formulario y limpiar estado global y visual
                atencionForm.reset();
                if (dniInput) dniInput.value = "";
                limpiarDatosPacienteYCita();

            } catch (error) {
                console.error("Error al registrar atención:", error);
                alert("Ocurrió un error al registrar la atención médica.");
            } finally {
                procesandoRegistro = false;
                setEstadoBoton(btnRegistrar, false, "Registrar atención");
            }
        });
    }

    // ==========================================
    // 5. FUNCIONES AUXILIARES DE UI Y FORMATO
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
        establecerTexto("sexoPaciente", paciente.sexo || "No registrado");
    }

    function limpiarDatosPacienteYCita() {
        pacienteActual = null;
        citaActual = null;

        const camposLimpiar = [
            "nombrePaciente",
            "dniPaciente",
            "historiaClinica",
            "edadPaciente",
            "sexoPaciente",
            "fechaCita",
            "medico",
            "especialidad"
        ];

        camposLimpiar.forEach((id) => establecerTexto(id, "-"));
    }

    function establecerTexto(id, valor) {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.textContent = valor;
        }
    }

    function setEstadoBoton(boton, cargando, texto) {
        if (!boton) return;
        boton.disabled = cargando;
        boton.textContent = texto;
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

    function formatearFecha(fecha) {
        if (!fecha) return "Fecha no registrada";
        const partes = fecha.split("-");
        if (partes.length !== 3) return fecha;
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
});