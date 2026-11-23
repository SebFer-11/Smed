document.addEventListener("DOMContentLoaded", () => {
    // ==========================================
    // 1. REFERENCIAS AL DOM
    // ==========================================
    const searchForm = document.getElementById("searchForm");
    const searchType = document.getElementById("searchType");
    const searchValue = document.getElementById("searchValue");
    const searchLabel = document.getElementById("searchLabel");
    const fieldSearchIcon = document.getElementById("fieldSearchIcon");

    const patientResult = document.getElementById("patientResult");
    const emptyState = document.getElementById("emptyState");
    const messageEl = document.getElementById("message");

    const btnSearchSubmit = document.getElementById("btnSearchSubmit");
    const btnSpinner = document.getElementById("btnSpinner");
    const btnSearchIcon = document.getElementById("btnSearchIcon");
    const btnSearchText = document.getElementById("btnSearchText");

    // ==========================================
    // 2. DATOS DE PRUEBA (MOCK / FALLBACK PARA QA Y UAT)
    // ==========================================
    const PACIENTES_PRUEBA = [
        {
            dni: "12345678",
            historia_clinica: "HC-000123",
            codigo_sis: "SIS-123456",
            nombres: "Juan",
            apellido_paterno: "Pérez",
            apellido_materno: "Quispe",
            sexo: "Masculino",
            fecha_nacimiento: "1991-05-14", // ~35 años
            departamento: "Cusco",
            distrito: "Cusco",
            establecimiento_origen: "Centro de Salud Cusco",
            establecimiento_destino: "Hospital Antonio Lorena",
            especialidad: "Cardiología",
            anamnesis: "Paciente refiere dolor torácico opresivo de esfuerzo, disnea progresiva en moderados esfuerzos desde hace 3 semanas. Niega alergias medicamentosas conocidas.",
            diagnostico: "I20.9 - Angina de pecho no especificada / Síndrome coronario agudo en evaluación. HTA grado 1 en tratamiento irregular.",
            tratamiento: "Aspirina 100mg VO c/24h + Atorvastatina 40mg VO nocturno. Solicitar EKG de 12 derivaciones, ecocardiograma transtorácico y enzimas cardíacas seriadas."
        }
    ];

    // ==========================================
    // 3. ACTUALIZACIÓN DINÁMICA DE UI SEGÚN CRITERIO
    // ==========================================
    function updateSearchTypeUI() {
        const type = searchType.value;
        searchValue.value = "";
        hideHospitalMessage();

        if (type === "dni") {
            searchLabel.textContent = "N° de DNI";
            searchValue.placeholder = "Ej. 12345678 (8 dígitos)";
            // Nota: No restringimos maxLength estrictamente a 8 para permitir probar CP-02 con 9+ dígitos si se desea,
            // o puedes dejarlo en 15 para validar ambos extremos (menos de 8 y más de 8 dígitos).
            searchValue.maxLength = 15;
            fieldSearchIcon.setAttribute("name", "id-card-outline");
        } else if (type === "historia") {
            searchLabel.textContent = "N° Historia Clínica";
            searchValue.placeholder = "Ej. HC-000123";
            searchValue.maxLength = 20;
            fieldSearchIcon.setAttribute("name", "folder-outline");
        } else if (type === "sis") {
            searchLabel.textContent = "Código de Afiliación SIS";
            searchValue.placeholder = "Ej. SIS-123456";
            searchValue.maxLength = 20;
            fieldSearchIcon.setAttribute("name", "shield-outline");
        }
        searchValue.focus();
    }

    searchType.addEventListener("change", updateSearchTypeUI);
    updateSearchTypeUI();

    // ==========================================
    // 4. ENVÍO DEL FORMULARIO Y VALIDACIONES (CP-01, CP-02, CP-03)
    // ==========================================
    searchForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const type = searchType.value;
        const rawValue = searchValue.value.trim();

        // Limpiar vista previa antes de validar/consultar (Evita fuga de datos de consultas previas)
        ocultarFichaPaciente();

        // Validación 1: Campo vacío
        if (!rawValue) {
            showHospitalMessage("Por favor, ingrese un valor para realizar la búsqueda.", "error");
            searchValue.focus();
            return;
        }

        // Validación 2: CP-02 / UAT-02 (Formato exacto de DNI: 8 dígitos numéricos)
        if (type === "dni" && !/^\d{8}$/.test(rawValue)) {
            showHospitalMessage("El DNI debe contener exactamente 8 números", "error");
            searchValue.focus();
            return;
        }

        // Normalizar mayúsculas para códigos alfanuméricos (HC-000123, XX-000999, SIS-123456)
        const queryValue = type === "dni" ? rawValue : rawValue.toUpperCase();

        setLoadingState(true);
        hideHospitalMessage();

        try {
            const paciente = await buscarPacienteEnFuenteDeDatos(type, queryValue);

            if (!paciente) {
                // CP-03 / UAT-03: Paciente no encontrado
                ocultarFichaPaciente();
                showHospitalMessage(
                    `No se encontró ningún paciente registrado con el dato ingresado (${queryValue}).`,
                    "error"
                );
                return;
            }

            // CP-01 / UAT-01: Paciente encontrado
            renderPatientData(paciente);
            showHospitalMessage("Expediente clínico recuperado satisfactoriamente.", "success");

        } catch (error) {
            console.error("Error en consulta de paciente:", error);
            ocultarFichaPaciente();
            showHospitalMessage("Ocurrió un error al consultar el sistema. Intente nuevamente.", "error");
        } finally {
            setLoadingState(false);
        }
    });

    // ==========================================
    // 5. CAPA DE DATOS (SUPABASE + FALLBACK LOCAL)
    // ==========================================
    async function buscarPacienteEnFuenteDeDatos(type, value) {
        const columnMap = {
            dni: "dni",
            historia: "historia_clinica",
            sis: "codigo_sis"
        };

        const columna = columnMap[type];
        if (!columna) return null;

        // Si existe la función global supabaseGet (entorno conectado), consulta la BD real
        if (typeof supabaseGet === "function") {
            const resultados = await supabaseGet(
                "pacientes",
                `?select=*&${columna}=eq.${encodeURIComponent(value)}`
            );
            return resultados && resultados.length > 0 ? resultados[0] : null;
        }

        // Simulación de latencia de red para entorno de pruebas / maqueta
        await new Promise((resolve) => setTimeout(resolve, 450));

        // Búsqueda exacta en los datos de prueba (Evita falsos positivos con XX-000999 u otros)
        const encontrado = PACIENTES_PRUEBA.find(
            (p) => String(p[columna]).toUpperCase() === value.toUpperCase()
        );

        return encontrado || null;
    }

    // ==========================================
    // 6. RENDERIZADO DE FICHA CLÍNICA (ALINEADO AL HTML)
    // ==========================================
    function renderPatientData(p) {
        const nombreCompleto = [p.nombres, p.apellido_paterno, p.apellido_materno]
            .filter(Boolean)
            .join(" ")
            .trim() || "Paciente Sin Nombre";

        const iniciales = nombreCompleto
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();

        const edadCalculada = p.edad || calcularEdad(p.fecha_nacimiento);

        // Cabecera
        document.getElementById("avatarBox").textContent = iniciales;
        document.getElementById("patientName").textContent = nombreCompleto;
        document.getElementById("patientDocument").innerHTML =
            `<ion-icon name="id-card-outline"></ion-icon> DNI: ${p.dni || "No registrado"}`;

        // Datos Generales
        document.getElementById("patientHistory").textContent = p.historia_clinica || "No registrada";
        document.getElementById("patientSIS").textContent = p.codigo_sis || "No registrado";
        document.getElementById("patientSex").textContent = p.sexo || "No registrado";
        document.getElementById("patientAge").textContent = edadCalculada;
        document.getElementById("patientDepartment").textContent = p.departamento || "Cusco";
        document.getElementById("patientDistrict").textContent = p.distrito || "Cusco";

        // Hoja de Referencia
        document.getElementById("origin").innerHTML =
            `<ion-icon name="business-outline"></ion-icon> ${p.establecimiento_origen || "Centro de Salud Cusco"}`;
        document.getElementById("destination").innerHTML =
            `<ion-icon name="medkit-outline"></ion-icon> ${p.establecimiento_destino || "Hospital Antonio Lorena"}`;
        document.getElementById("specialty").innerHTML =
            `<ion-icon name="heart-circle-outline"></ion-icon> ${p.especialidad || "Medicina General"}`;

        // Resumen Clínico
        document.getElementById("anamnesis").textContent =
            p.anamnesis || "Sin registros de anamnesis previos.";
        document.getElementById("diagnosis").textContent =
            p.diagnostico || "Sin diagnóstico registrado.";
        document.getElementById("treatment").textContent =
            p.tratamiento || "Sin plan de tratamiento activo.";

        // Mostrar tarjeta y ocultar estado vacío
        patientResult.classList.remove("hidden");
        if (emptyState) emptyState.classList.add("hidden");
    }

    function ocultarFichaPaciente() {
        patientResult.classList.add("hidden");
        if (emptyState) emptyState.classList.remove("hidden");
    }

    // ==========================================
    // 7. UTILIDADES DE INTERFAZ Y CÁLCULO
    // ==========================================
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

    function showHospitalMessage(text, type = "info") {
        messageEl.className = `message ${type}`;
        const iconMap = {
            error: "alert-circle",
            success: "checkmark-circle",
            info: "information-circle"
        };
        const iconName = iconMap[type] || "information-circle";
        messageEl.innerHTML = `<ion-icon name="${iconName}"></ion-icon> <span>${text}</span>`;
        messageEl.style.display = "flex";
    }

    function hideHospitalMessage() {
        messageEl.style.display = "none";
        messageEl.innerHTML = "";
    }

    function setLoadingState(isLoading) {
        btnSearchSubmit.disabled = isLoading;
        btnSpinner.style.display = isLoading ? "block" : "none";
        btnSearchIcon.style.display = isLoading ? "none" : "inline-block";
        btnSearchText.textContent = isLoading ? "Consultando..." : "Buscar paciente";
    }
});

// ==========================================
// 8. FUNCIONES GLOBALES PARA BOTONES DEL HTML
// ==========================================
function quickFill(type, val) {
    const searchType = document.getElementById("searchType");
    const searchValue = document.getElementById("searchValue");
    const searchForm = document.getElementById("searchForm");

    searchType.value = type;
    searchType.dispatchEvent(new Event("change"));
    searchValue.value = val;
    searchForm.dispatchEvent(new Event("submit"));
}

function notifyAction(msg) {
    const messageEl = document.getElementById("message");
    messageEl.className = "message info";
    messageEl.innerHTML = `<ion-icon name="information-circle"></ion-icon> <span>${msg}</span>`;
    messageEl.style.display = "flex";
    setTimeout(() => {
        messageEl.style.display = "none";
    }, 3000);
}