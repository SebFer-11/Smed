const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

loginForm.addEventListener("submit", function (event) {


event.preventDefault();

const usuario = document.getElementById("usuario").value;
const password = document.getElementById("password").value;

if (usuario === "" || password === "") {

    loginMessage.textContent = "Complete todos los campos.";
    loginMessage.style.color = "red";

    return;
}


if (usuario === "admin" && password === "123456") {

    loginMessage.textContent = "Inicio de sesión correcto.";
    loginMessage.style.color = "green";

    setTimeout(() => {
        window.location.href = "pages/dashboard.html";
    }, 500);

} else {

    loginMessage.textContent = "Usuario o contraseña incorrectos.";
    loginMessage.style.color = "red";
}


});
