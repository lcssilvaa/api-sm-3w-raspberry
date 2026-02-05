function login(event) {
    event.preventDefault();

    const usuario = document.getElementById("usuario").value;
    const password = document.getElementById("password").value;

    fetch("/auth/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            usuario: usuario,
            password: password
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error("Login inválido");
        }
        return response.json();
    })
    .then(data => {
        console.log("Login OK", data);
        localStorage.setItem("token", data.token);
        window.location.href = "/dashboard";
    })
    .catch(err => {
        alert("Usuário ou senha inválidos");
    });
}
