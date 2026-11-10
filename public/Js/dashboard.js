const logoutButton =
    document.getElementById("logoutButton");


// ==========================================
// CERRAR SESIÓN
// ==========================================

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        function () {

            const confirmar =
                confirm(
                    "¿Está seguro de que desea cerrar sesión?"
                );

            if (!confirmar) {
                return;
            }

            // ==========================================
            // LIMPIAR SESIÓN TEMPORAL
            // ==========================================

            sessionStorage.clear();

            // ==========================================
            // VOLVER AL LOGIN
            // ==========================================

            window.location.href =
                "../index.html";
        }
    );
}



document.addEventListener('DOMContentLoaded', () => {

    // 1. Reloj y Fecha dinámica en español
    const dateSpan = document.getElementById('currentDateString');
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = now.toLocaleDateString('es-ES', options);
    dateSpan.querySelector('span').textContent = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

    // 2. Control del Menú Móvil (Responsive Drawer)
    const toggleMenuBtn = document.getElementById('toggleMenuBtn');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    function toggleDrawer() {
        sidebar.classList.toggle('mobile-open');
        sidebarOverlay.classList.toggle('active');
    }

    if (toggleMenuBtn) toggleMenuBtn.addEventListener('click', toggleDrawer);
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', toggleDrawer);

    // 3. Filtrado dinámico de la tabla de citas
    const filterBtns = document.querySelectorAll('.filter-btn');
    const tableRows = document.querySelectorAll('#appointmentsTable tbody tr');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.dataset.filter;

            tableRows.forEach(row => {
                const status = row.dataset.status;
                if (filter === 'all') {
                    row.style.display = '';
                } else if (filter === 'espera' && status === 'espera') {
                    row.style.display = '';
                } else if (filter === 'programada' && status === 'programada') {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    });

    // 4. Buscador Rápido Global (Filtrar por texto)
    const searchInput = document.getElementById('globalSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            tableRows.forEach(row => {
                const rowText = row.innerText.toLowerCase();
                row.style.display = rowText.includes(query) ? '' : 'none';
            });
        });

        // Atajo de teclado (Ctrl + K o Command + K)
        window.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                searchInput.focus();
                searchInput.select();
            }
        });
    }

    // 5. Botón de Notificaciones
    const notifBtn = document.getElementById('notifBtn');
    if (notifBtn) {
        notifBtn.addEventListener('click', () => {
            showToast('Tiene 3 avisos clínicos pendientes de revisión en Laboratorio.');
        });
    }

    // 6. Botón de Cerrar Sesión
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            showToast('Cerrando sesión de forma segura...');
            setTimeout(() => {
                window.location.href = '../login.html';
            }, 1200);
        });
    }
});

// Toast de retroalimentación
function showToast(message) {
    const toast = document.getElementById('toastNotify');
    const msg = document.getElementById('toastMessage');
    msg.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3200);
}

// Acción de atender paciente
function attendPatient(patientName) {
    showToast(`Iniciando atención médica de: ${patientName}`);
}