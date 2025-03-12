const API_URL = "http://motum.ddns.net:8383/cimws/apis/cim/auth";

// Elementos del DOM
const loginForm = document.getElementById("login");
const errorMessage = document.getElementById("error-message");
const logoutButton = document.getElementById("logout");

// Función para redirigir a una página
function redirectTo(page) {
    window.location.href = page;
}

async function login(username, password) {
    Swal.fire({
        title: "Iniciando sesión",
        timerProgressBar: true,
        allowOutsideClick: false,
        allowEscapeKey: false,
        showCloseButton: false,
        didOpen: () => {
            Swal.showLoading();
        },
    });
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ user: username, password }),
        });

        if (response.ok) {
            const data = await response.json();
            console.log({ data });
            if (data && data?.message === "noData") {
                Swal.fire({
                    title: 'Error!',
                    text: 'Usuario no econtrado. Volver a intentar.',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
            // Guardar el token o estado de autenticación en localStorage
            localStorage.setItem("isAuthenticated", "true");
            localStorage.setItem("user", JSON.stringify(data)); // Guardar datos del usuario
            redirectTo("admin.html"); // Redirigir a admin.html
        } else {
            Swal.fire({
                title: 'Error!',
                text: 'Hubo un problema al iniciar sesión.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
            errorMessage.style.display = "block";
        }
    } catch (error) {
        console.error("Error en la autenticación:", error);
        errorMessage.style.display = "block";
    }
}

// Evento de envío del formulario de login
if (loginForm) {
    loginForm.addEventListener("submit", (event) => {
        event.preventDefault(); // Evita que el formulario se envíe

        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;

        login(username, password);
    });
}

// Evento de logout
if (logoutButton) {
    logoutButton.addEventListener("click", () => {
        localStorage.removeItem("isAuthenticated");
        localStorage.removeItem("user");
        redirectTo("index.html"); // Redirigir a index.html
    });
}

// Verificar autenticación al cargar la página
window.addEventListener("load", () => {
    const isAuthenticated = localStorage.getItem("isAuthenticated");

    if (window.location.pathname.endsWith("admin.html")) {
        // Si está en admin.html y no está autenticado, redirigir a index.html
        if (!isAuthenticated) {
            redirectTo("index.html");
        }
    } else if (window.location.pathname.endsWith("index.html")) {
        // Si está en index.html y ya está autenticado, redirigir a admin.html
        if (isAuthenticated) {
            redirectTo("admin.html");
        }
    }
});