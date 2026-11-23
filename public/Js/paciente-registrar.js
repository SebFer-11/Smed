document.addEventListener("DOMContentLoaded", () => {
    // ==========================================
    // 1. REFERENCIAS AL DOM
    // ==========================================
    const pacienteForm = document.getElementById("pacienteForm");
    const cancelButton = document.getElementById("cancelButton");
    const btnAutoFill = document.getElementById("btnAutoFill");
    const messageEl = document.getElementById("message");

    const dniInput = document.getElementById("dni");
    const dniCounter = document.getElementById("dniCounter");
    const fechaInput = document.getElementById("fecha");
    const horaInput = document.getElementById("hora");

    const btnSubmit = document.getElementById("btnSubmitPaciente");
    const submitSpinner = document.getElementById("submitSpinner");
    const submitIcon = document.getElementById("submitIcon");
    const submitText = document.getElementById("submitText");

    // ==========================================
    // 2. INICIALIZACIÓN DE UI (FECHA, HORA, CONTADOR DNI)
    // ==========================================
    inicializarFechaHora();

    if (dniInput) {
        dniInput.addEventListener("input", () => {
            dniInput.value = dniInput.value.replace(/\D/g, "").slice(0, 8);
            actualizarContadorDNI();
        });
    }

    pacienteForm.addEventListener("reset", () => {
        setTimeout(() => {
            inicializarFechaHora();
            actualizarContadorDNI();
            limpiarMensaje();
        }, 0);
    });

    // ==========================================
    // 3. ENVÍO DEL FORMULARIO (CP-01 A CP-05)
    // ==========================================
    pacienteForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        limpiarMensaje();

        // Captura de valores
        const fecha = fechaInput.value;
        const hora = horaInput.value;
        const seguro = document.getElementById("seguro").value;
        const sis = document.getElementById("sis").value.trim().toUpperCase();
        const origen = document.getElementById("origen").value.trim();
        const destino = document.getElementById("destino").value.trim();

        const historia = document.getElementById("historia").value.trim().toUpperCase();
        const dni = dniInput.value.trim();
        const nombres = document.getElementById("nombres").value.trim();
        const apellidos = document.getElementById("apellidos").value.trim();

        const sexo = document.getElementById("sexo").value;
        const edadRaw = document.getElementById("edad").value.trim();
        const edad = edadRaw === "" ? NaN : Number(edadRaw);

        const direccion = document.getElementById("direccion").value.trim();
        const departamento = document.getElementById("departamento").value;
        const distrito = document.getElementById("distrito").value.trim();

        const anamnesis = document.getElementById("anamnesis").value.trim();
        const examenFisico = document.getElementById("examenFisico").value.trim();
        const examenes = document.getElementById("examenes").value.trim();
        const diagnosticos = document.getElementById("diagnosticos").value.trim();
        const tratamiento = document.getElementById("tratamiento").value.trim();

        const ups = document.getElementById("ups").value;
        const especialidad = document.getElementById("especialidad").value;
        const condicion = document.getElementById("condicion").value;

        const refNombre = document.getElementById("refNombre").value.trim();
        const refColegiatura = document.getElementById("refColegiatura").value.trim();
        const refProfesion = document.getElementById("refProfesion").value;

        const estNombre = document.getElementById("estNombre").value.trim();
        const estColegiatura = document.getElementById("estColegiatura").value.trim();
        const estProfesion = document.getElementById("estProfesion").value;

        // ------------------------------------------
        // VALIDACIÓN CP-04: Formato de DNI (8 dígitos)
        // ------------------------------------------
        if (!/^\d{8}$/.test(dni)) {
            mostrarMensaje("El documento de identidad debe tener 8 dígitos", "error");
            dniInput.focus();
            return;
        }

        // ------------------------------------------
        // VALIDACIÓN CP-05: Rango de edad (0 a 105 años)
        // ------------------------------------------
        if (!Number.isInteger(edad) || edad < 0 || edad > 105) {
            mostrarMensaje("Ingrese una edad válida", "error");
            document.getElementById("edad").focus();
            return;
        }

        // ------------------------------------------
        // VALIDACIÓN DE CAMPOS OBLIGATORIOS MÍNIMOS
        // ------------------------------------------
        if (!historia || !nombres || !apellidos || !sexo || !direccion || !departamento || !distrito || !origen || !destino || !ups || !especialidad || !condicion || !refNombre || !refProfesion || !estNombre || !estProfesion) {
            mostrarMensaje("Complete todos los campos obligatorios del formulario.", "error");
            return;
        }

        setLoadingState(true);

        try {
            // ------------------------------------------
            // VALIDACIÓN CP-02: DNI duplicado en Supabase
            // ------------------------------------------
            const pacientesExistentes = await supabaseGet(
                "pacientes",
                `?select=id,dni&dni=eq.${encodeURIComponent(dni)}`
            );

            if (Array.isArray(pacientesExistentes) && pacientesExistentes.length > 0) {
                mostrarMensaje("Ya existe un paciente registrado con ese DNI", "error");
                dniInput.focus();
                return;
            }

            // ------------------------------------------
            // VALIDACIÓN CP-RP-03: Historia Clínica duplicada
            // ------------------------------------------
            const historiasExistentes = await supabaseGet(
                "pacientes",
                `?select=id,historia_clinica&historia_clinica=eq.${encodeURIComponent(historia)}`
            );

            if (Array.isArray(historiasExistentes) && historiasExistentes.length > 0) {
                mostrarMensaje("El número de Historia Clínica ya está registrado", "error");
                document.getElementById("historia").focus();
                return;
            }

            // ------------------------------------------
            // PREPARACIÓN Y REGISTRO DE PACIENTE (CP-01)
            // ------------------------------------------
            const partesApellido = apellidos.split(/\s+/).filter(Boolean);
            const apellidoPaterno = partesApellido[0] || "";
            const apellidoMaterno = partesApellido.slice(1).join(" ") || null;

            const fechaNacimiento = calcularFechaNacimiento(edad);
            const sexoBD = sexo ? sexo.toUpperCase() : null;
            const sisEstado = seguro === "si" ? "ACTIVO" : null;

            const pacienteInsertado = await supabasePost("pacientes", {
                dni,
                codigo_sis: sis || null,
                historia_clinica: historia,
                nombres,
                apellido_paterno: apellidoPaterno,
                apellido_materno: apellidoMaterno,
                fecha_nacimiento: fechaNacimiento,
                sexo: sexoBD,
                direccion,
                distrito_id: null,
                telefono: null,
                email: null,
                sis_estado: sisEstado
            });

            if (!pacienteInsertado || pacienteInsertado.length === 0) {
                throw new Error("Supabase no devolvió el registro creado en pacientes.");
            }

            const paciente = pacienteInsertado[0];

            // ------------------------------------------
            // REGISTRO DE REFERENCIA ASOCIADA
            // ------------------------------------------
            await registrarReferenciaPaciente({
                pacienteId: paciente.id,
                fecha,
                hora,
                origen,
                destino,
                ups,
                especialidad,
                condicion,
                anamnesis,
                examenFisico,
                examenes,
                diagnosticos,
                tratamiento,
                refNombre,
                refColegiatura,
                refProfesion,
                estNombre,
                estColegiatura,
                estProfesion
            });

            // ------------------------------------------
            // ÉXITO CP-01
            // ------------------------------------------
            pacienteForm.reset();
            mostrarMensaje("Paciente registrado correctamente", "success");

        } catch (error) {
            console.error("Error al registrar paciente:", error);
            mostrarMensaje("No se pudo registrar el paciente. Verifique la conexión con Supabase.", "error");
        } finally {
            setLoadingState(false);
        }
    });

    // ==========================================
    // 4. REGISTRAR REFERENCIA EN SUPABASE
    // ==========================================
    async function registrarReferenciaPaciente(datos) {
        const [establecimientosOrigen, establecimientosDestino, especialidades] = await Promise.all([
            supabaseGet("establecimientos", `?select=id&nombre=ilike.${encodeURIComponent(datos.origen)}`),
            supabaseGet("establecimientos", `?select=id&nombre=ilike.${encodeURIComponent(datos.destino)}`),
            supabaseGet("especialidades", "?select=id,nombre")
        ]);

        const establecimientoOrigen = establecimientosOrigen?.[0];
        const establecimientoDestino = establecimientosDestino?.[0];

        if (!establecimientoOrigen || !establecimientoDestino) {
            console.warn("Paciente registrado, pero uno de los establecimientos no existe en la tabla establecimientos.");
            return;
        }

        const especialidadEncontrada = (especialidades || []).find(
            (item) => normalizar(item.nombre) === normalizar(convertirEspecialidad(datos.especialidad))
        );

        await supabasePost("referencias", {
            paciente_id: datos.pacienteId,
            fecha_hora: crearFechaHora(datos.fecha, datos.hora),
            establecimiento_origen_id: establecimientoOrigen.id,
            establecimiento_destino_id: establecimientoDestino.id,
            ups_destino: datos.ups,
            especialidad_destino_id: especialidadEncontrada ? especialidadEncontrada.id : null,
            condicion_paciente: datos.condicion,
            motivo: datos.anamnesis || null,
            estado: "PENDIENTE",
            usuario_registro_id: null
        });
    }

    // ==========================================
    // 5. CANCELAR Y AUTOCOMPLETAR DEMO (QA)
    // ==========================================
    if (cancelButton) {
        cancelButton.addEventListener("click", () => {
            if (window.confirm("¿Está seguro de que desea cancelar el registro del paciente? Los cambios no guardados se perderán.")) {
                window.location.href = "../dashboard.html";
            }
        });
    }

    if (btnAutoFill) {
        btnAutoFill.addEventListener("click", () => {
            document.getElementById("seguro").value = "si";
            document.getElementById("sis").value = "SIS-902341";
            document.getElementById("origen").value = "Centro de Salud Belenpampa (Cusco)";
            document.getElementById("destino").value = "Hospital Antonio Lorena";
            document.getElementById("historia").value = "HC-000456";
            dniInput.value = "45678912";
            actualizarContadorDNI();

            document.getElementById("nombres").value = "María";
            document.getElementById("apellidos").value = "Torres Díaz";
            document.getElementById("sexo").value = "femenino";
            document.getElementById("edad").value = "30";
            document.getElementById("direccion").value = "Av. La Cultura 123";
            document.getElementById("departamento").value = "cusco";
            document.getElementById("distrito").value = "Santiago";

            document.getElementById("anamnesis").value = "Paciente primigesta de 34 semanas refiere cefalea frontal persistente, escotomas centelleantes y edema bimaleolar bilateral de progresión en 48 horas.";
            document.getElementById("examenFisico").value = "PA: 150/95 mmHg, FC: 84 lpm, FR: 18 rpm, T°: 36.6 °C. AU: 32 cm, LCF: 142 lpm. Edema ++/+++ en miembros inferiores.";
            document.getElementById("examenes").value = "Proteinuria cualitativa en tira reactiva (++). Hemograma y perfil hepático en curso.";
            document.getElementById("diagnosticos").value = "O14.0 - Preeclampsia moderada en gestación pretérmino.";
            document.getElementById("tratamiento").value = "Sulfato de Magnesio esquema Zuspan iniciado. Nifedipino 10mg VO condicional.";

            document.getElementById("ups").value = "emergencia";
            document.getElementById("especialidad").value = "ginecologia";
            document.getElementById("condicion").value = "delicado";

            document.getElementById("refNombre").value = "Dra. Patricia Valenzuela";
            document.getElementById("refColegiatura").value = "CMP 58210";
            document.getElementById("refProfesion").value = "medico";

            document.getElementById("estNombre").value = "Dr. Juan Carlos Ramos";
            document.getElementById("estColegiatura").value = "CMP 41203";
            document.getElementById("estProfesion").value = "medico";

            mostrarMensaje("Datos de prueba cargados correctamente en el formulario.", "info");
        });
    }

    // ==========================================
    // 6. FUNCIONES AUXILIARES
    // ==========================================
    function inicializarFechaHora() {
        if (fechaInput && !fechaInput.value) {
            fechaInput.value = new Date().toISOString().split("T")[0];
        }
        if (horaInput && !horaInput.value) {
            const now = new Date();
            const hh = String(now.getHours()).padStart(2, "0");
            const mm = String(now.getMinutes()).padStart(2, "0");
            horaInput.value = `${hh}:${mm}`;
        }
    }

    function actualizarContadorDNI() {
        if (!dniCounter || !dniInput) return;
        const len = dniInput.value.length;
        dniCounter.textContent = `${len}/8 dígitos`;
        dniCounter.style.color = len === 8 ? "var(--teal)" : "var(--slate-400)";
    }

    function calcularFechaNacimiento(edad) {
        const hoy = new Date();
        return new Date(hoy.getFullYear() - edad, hoy.getMonth(), hoy.getDate())
            .toISOString()
            .split("T")[0];
    }

    function crearFechaHora(fecha, hora) {
        if (!fecha || !hora) return new Date().toISOString();
        return new Date(`${fecha}T${hora}:00`).toISOString();
    }

    function convertirEspecialidad(valor) {
        const equivalencias = {
            "medicina-general": "Medicina General",
            "cardiologia": "Cardiología",
            "traumatologia": "Traumatología",
            "pediatria": "Pediatría",
            "ginecologia": "Ginecología",
            "cirugia-general": "Cirugía General"
        };
        return equivalencias[valor] || valor;
    }

    function normalizar(texto) {
        return String(texto || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim();
    }

    function mostrarMensaje(texto, tipo = "info") {
        if (!messageEl) return;
        messageEl.className = tipo;
        const iconos = {
            error: "alert-circle",
            success: "checkmark-circle",
            info: "information-circle"
        };
        const icono = iconos[tipo] || "information-circle";
        messageEl.innerHTML = `<ion-icon name="${icono}" style="font-size:1.3rem;"></ion-icon><span>${texto}</span>`;
        messageEl.style.display = "flex";
        messageEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    function limpiarMensaje() {
        if (!messageEl) return;
        messageEl.className = "";
        messageEl.innerHTML = "";
        messageEl.style.display = "none";
    }

    function setLoadingState(isLoading) {
        if (!btnSubmit) return;
        btnSubmit.disabled = isLoading;
        if (submitSpinner) submitSpinner.style.display = isLoading ? "block" : "none";
        if (submitIcon) submitIcon.style.display = isLoading ? "none" : "inline-block";
        if (submitText) submitText.textContent = isLoading ? "Guardando paciente..." : "Registrar paciente";
    }
});