const searchForm =
    document.getElementById("searchForm");

const patientResult =
    document.getElementById("patientResult");

const message =
    document.getElementById("message");


// ==========================================
// BUSCAR PACIENTE
// ==========================================

searchForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        const type =
            document.getElementById(
                "searchType"
            ).value;

        const value =
            document.getElementById(
                "searchValue"
            ).value.trim();


        // ==========================================
        // VALIDAR VALOR
        // ==========================================

        if (value === "") {

            patientResult.classList.add(
                "hidden"
            );

            message.textContent =
                "Ingrese un valor para realizar la búsqueda.";

            message.style.color =
                "red";

            return;
        }


        // ==========================================
        // VALIDAR DNI
        // ==========================================

        if (
            type === "dni" &&
            !/^\d{8}$/.test(value)
        ) {

            patientResult.classList.add(
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
            // PREPARAR CONSULTA
            // ==========================================

            let columna;

            if (type === "dni") {

                columna = "dni";

            } else if (
                type === "historia_clinica"
            ) {

                columna =
                    "historia_clinica";

            } else {

                message.textContent =
                    "Tipo de búsqueda no válido.";

                message.style.color =
                    "red";

                return;
            }


            // ==========================================
            // CONSULTAR SUPABASE
            // ==========================================

            const pacientes =
                await supabaseGet(
                    "pacientes",
                    `?select=*&${columna}=eq.${encodeURIComponent(value)}`
                );


            // ==========================================
            // PACIENTE NO ENCONTRADO
            // ==========================================

            if (
                !pacientes ||
                pacientes.length === 0
            ) {

                patientResult.classList.add(
                    "hidden"
                );

                message.textContent =
                    `No se encontró un paciente utilizando ${type}.`;

                message.style.color =
                    "red";

                return;
            }


            // ==========================================
            // PACIENTE ENCONTRADO
            // ==========================================

            const paciente =
                pacientes[0];


            mostrarPaciente(
                paciente
            );


            patientResult.classList.remove(
                "hidden"
            );

            message.textContent =
                "Paciente encontrado.";

            message.style.color =
                "green";


        } catch (error) {

            console.error(
                "Error al consultar paciente:",
                error
            );

            patientResult.classList.add(
                "hidden"
            );

            message.textContent =
                "Ocurrió un error al consultar el paciente.";

            message.style.color =
                "red";
        }
    }
);


// ==========================================
// MOSTRAR PACIENTE
// ==========================================

function mostrarPaciente(
    paciente
) {

    // ==========================================
    // NOMBRE
    // ==========================================

    const nombre =
        `${paciente.nombres || ""} ` +
        `${paciente.apellido_paterno || ""} ` +
        `${paciente.apellido_materno || ""}`.trim();


    establecerTexto(
        "nombrePaciente",
        nombre
    );


    // ==========================================
    // DNI
    // ==========================================

    establecerTexto(
        "dniPaciente",
        paciente.dni ||
        "No registrado"
    );


    // ==========================================
    // HISTORIA CLÍNICA
    // ==========================================

    establecerTexto(
        "historiaClinica",
        paciente.historia_clinica ||
        "No registrada"
    );


    // ==========================================
    // FECHA DE NACIMIENTO
    // ==========================================

    establecerTexto(
        "fechaNacimiento",
        formatearFecha(
            paciente.fecha_nacimiento
        )
    );


    // ==========================================
    // EDAD
    // ==========================================

    establecerTexto(
        "edadPaciente",
        calcularEdad(
            paciente.fecha_nacimiento
        )
    );


    // ==========================================
    // SEXO
    // ==========================================

    establecerTexto(
        "sexoPaciente",
        paciente.sexo ||
        "No registrado"
    );


    // ==========================================
    // DIRECCIÓN
    // ==========================================

    establecerTexto(
        "direccionPaciente",
        paciente.direccion ||
        "No registrada"
    );


    // ==========================================
    // TELÉFONO
    // ==========================================

    establecerTexto(
        "telefonoPaciente",
        paciente.telefono ||
        "No registrado"
    );


    // ==========================================
    // CORREO
    // ==========================================

    establecerTexto(
        "emailPaciente",
        paciente.email ||
        "No registrado"
    );


    // ==========================================
    // SIS
    // ==========================================

    establecerTexto(
        "codigoSIS",
        paciente.codigo_sis ||
        "No registrado"
    );


    establecerTexto(
        "estadoSIS",
        paciente.sis_estado ||
        "No registrado"
    );
}


// ==========================================
// ESTABLECER TEXTO SI EXISTE EL ELEMENTO
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


// ==========================================
// CALCULAR EDAD
// ==========================================

function calcularEdad(
    fechaNacimiento
) {

    if (!fechaNacimiento) {

        return "No registrada";
    }

    const nacimiento =
        new Date(fechaNacimiento);

    const hoy =
        new Date();

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
            hoy.getDate() <
            nacimiento.getDate()
        )
    ) {

        edad--;
    }


    return `${edad} años`;
}


// ==========================================
// FORMATEAR FECHA
// ==========================================

function formatearFecha(
    fecha
) {

    if (!fecha) {

        return "No registrada";
    }

    const partes =
        fecha.split("-");


    if (
        partes.length !== 3
    ) {

        return fecha;
    }


    return (
        `${partes[2]}/` +
        `${partes[1]}/` +
        `${partes[0]}`
    );
}

  document.addEventListener('DOMContentLoaded', () => {

            const searchForm = document.getElementById('searchForm');
            const searchType = document.getElementById('searchType');
            const searchValue = document.getElementById('searchValue');
            const searchLabel = document.getElementById('searchLabel');
            const fieldSearchIcon = document.getElementById('fieldSearchIcon');
            const patientResult = document.getElementById('patientResult');
            const emptyState = document.getElementById('emptyState');
            const messageEl = document.getElementById('message');

            const btnSearchSubmit = document.getElementById('btnSearchSubmit');
            const btnSpinner = document.getElementById('btnSpinner');
            const btnSearchIcon = document.getElementById('btnSearchIcon');
            const btnSearchText = document.getElementById('btnSearchText');

            // 1. Ajuste dinámico de Placeholders y Máscaras según el selector
            function updateSearchTypeUI() {
                const type = searchType.value;
                if (type === 'dni') {
                    searchLabel.textContent = 'N° de DNI';
                    searchValue.placeholder = 'Ej. 12345678 (8 dígitos)';
                    searchValue.maxLength = 8;
                    fieldSearchIcon.setAttribute('name', 'id-card-outline');
                } else if (type === 'historia') {
                    searchLabel.textContent = 'N° Historia Clínica';
                    searchValue.placeholder = 'Ej. HC-000123';
                    searchValue.maxLength = 15;
                    fieldSearchIcon.setAttribute('name', 'folder-outline');
                } else if (type === 'sis') {
                    searchLabel.textContent = 'Código de Afiliación SIS';
                    searchValue.placeholder = 'Ej. SIS-123456';
                    searchValue.maxLength = 15;
                    fieldSearchIcon.setAttribute('name', 'shield-outline');
                }
                searchValue.focus();
            }

            searchType.addEventListener('change', updateSearchTypeUI);
            updateSearchTypeUI();

            // 2. Manejador de Submit del Formulario
            searchForm.addEventListener('submit', (e) => {
                e.preventDefault();

                const type = searchType.value;
                const value = searchValue.value.trim();

                // Validación simple de entrada
                if (!value) {
                    showHospitalMessage('Por favor, ingrese el dato a consultar.', 'error');
                    searchValue.focus();
                    return;
                }

                if (type === 'dni' && (!/^\d{8}$/.test(value))) {
                    showHospitalMessage('El DNI debe contener exactamente 8 números.', 'error');
                    searchValue.focus();
                    return;
                }

                // Simulación de Búsqueda (Soporta el paciente demo por defecto o invoca tu Supabase si está activo)
                setLoadingState(true);
                hideHospitalMessage();

                setTimeout(() => {
                    setLoadingState(false);

                    // Mock de comprobación: permite buscar "12345678", "HC-000123", "SIS-123456" o cualquier valor no vacío
                    const isMatch = (
                        (type === 'dni' && (value === '12345678' || value.length === 8)) ||
                        (type === 'historia' && (value.toUpperCase() === 'HC-000123' || value.startsWith('HC'))) ||
                        (type === 'sis' && (value.toUpperCase() === 'SIS-123456' || value.startsWith('SIS')))
                    );

                    if (isMatch) {
                        renderPatientData({
                            name: 'Juan Pérez Quispe',
                            document: `DNI: ${value.includes('12345678') ? '12345678' : value}`,
                            history: type === 'historia' ? value.toUpperCase() : 'HC-000123',
                            sis: type === 'sis' ? value.toUpperCase() : 'SIS-123456',
                            sex: 'Masculino',
                            age: '35 años',
                            department: 'Cusco',
                            district: 'Cusco',
                            origin: 'Centro de Salud Cusco',
                            destination: 'Hospital Antonio Lorena',
                            specialty: 'Cardiología',
                            anamnesis: 'Paciente refiere dolor torácico opresivo de esfuerzo, disnea progresiva en moderados esfuerzos desde hace 3 semanas. Niega alergias medicamentosas conocidas.',
                            diagnosis: 'I20.9 - Angina de pecho no especificada / Síndrome coronario agudo en evaluación.',
                            treatment: 'Aspirina 100mg VO c/24h + Atorvastatina 40mg VO nocturno. EKG de 12 derivaciones pendiente.'
                        });

                        showHospitalMessage('Expediente clínico recuperado satisfactoriamente.', 'success');
                    } else {
                        // Paciente no hallado
                        patientResult.classList.add('hidden');
                        if (emptyState) emptyState.classList.remove('hidden');
                        showHospitalMessage(`No se encontró ningún paciente registrado con el dato ingresado: "${value}".`, 'error');
                    }
                }, 750);
            });

            // 3. Función para renderizar los datos del paciente manteniendo los IDs existentes
            function renderPatientData(data) {
                document.getElementById('patientName').textContent = data.name;
                document.getElementById('patientDocument').textContent = data.document;
                document.getElementById('patientHistory').textContent = data.history;
                document.getElementById('patientSIS').textContent = data.sis;
                document.getElementById('patientSex').textContent = data.sex;
                document.getElementById('patientAge').textContent = data.age;
                document.getElementById('patientDepartment').textContent = data.department;
                document.getElementById('patientDistrict').textContent = data.district;

                document.getElementById('origin').innerHTML = `<ion-icon name="business-outline"></ion-icon> ${data.origin}`;
                document.getElementById('destination').innerHTML = `<ion-icon name="medkit-outline"></ion-icon> ${data.destination}`;
                document.getElementById('specialty').innerHTML = `<ion-icon name="heart-circle-outline"></ion-icon> ${data.specialty}`;

                document.getElementById('anamnesis').textContent = data.anamnesis;
                document.getElementById('diagnosis').textContent = data.diagnosis;
                document.getElementById('treatment').textContent = data.treatment;

                // Generar iniciales en el avatar
                const initials = data.name.split(' ').map(n => n[0]).slice(0, 2).join('');
                document.getElementById('avatarBox').textContent = initials;

                // Mostrar tarjeta y ocultar estado vacío
                patientResult.classList.remove('hidden');
                if (emptyState) emptyState.classList.add('hidden');
            }

            // 4. Utilidades de Mensajería
            function showHospitalMessage(text, type = 'info') {
                messageEl.className = `message ${type}`;
                const iconName = type === 'error' ? 'alert-circle' : (type === 'success' ? 'checkmark-circle' : 'information-circle');
                messageEl.innerHTML = `<ion-icon name="${iconName}"></ion-icon> <span>${text}</span>`;
                messageEl.style.display = 'flex';
            }

            function hideHospitalMessage() {
                messageEl.style.display = 'none';
                messageEl.textContent = '';
            }

            function setLoadingState(isLoading) {
                if (isLoading) {
                    btnSearchSubmit.disabled = true;
                    btnSpinner.style.display = 'block';
                    btnSearchIcon.style.display = 'none';
                    btnSearchText.textContent = 'Consultando...';
                } else {
                    btnSearchSubmit.disabled = false;
                    btnSpinner.style.display = 'none';
                    btnSearchIcon.style.display = 'inline-block';
                    btnSearchText.textContent = 'Buscar paciente';
                }
            }
        });

        // 5. Carga rápida de Demo para pruebas inmediatas
        function quickFill(type, val) {
            const searchType = document.getElementById('searchType');
            const searchValue = document.getElementById('searchValue');
            searchType.value = type;
            searchType.dispatchEvent(new Event('change'));
            searchValue.value = val;
            document.getElementById('searchForm').dispatchEvent(new Event('submit'));
        }

        function notifyAction(msg) {
            const messageEl = document.getElementById('message');
            messageEl.className = 'message info';
            messageEl.innerHTML = `<ion-icon name="information-circle"></ion-icon> <span>${msg}</span>`;
            messageEl.style.display = 'flex';
            setTimeout(() => {
                messageEl.style.display = 'none';
            }, 3000);
        }