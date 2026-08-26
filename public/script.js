const form = document.getElementById("suggestionForm");
const message = document.getElementById("message");

form.addEventListener("submit", async function (event) {

    event.preventDefault();

    const music = document.getElementById("music").value.trim();
    const username = document.getElementById("username").value.trim();

    if (!music || !username) {

        message.textContent = "Preencha todos os campos.";
        message.className = "message error";

        return;
    }

    try {

        const response = await fetch("/api/suggestions", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                music: music,
                username: username
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message);
        }

        message.textContent = data.message;
        message.className = "message success";

        form.reset();

    } catch (error) {

        console.error(error);

        message.textContent =
            "Não foi possível enviar sua sugestão.";

        message.className = "message error";
    }
});