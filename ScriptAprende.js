document.addEventListener("DOMContentLoaded", function () {
    const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");
    const wordDisplay = document.getElementById("word-display");
    const optionsContainer = document.querySelector(".options");
    const feedback = document.getElementById("feedback");
    const progressContainer = document.querySelector(".progress-container");
    const floatingMessage = document.getElementById("floating-message");
    const messageTitle = document.getElementById("message-title");
    const messageText = document.getElementById("message-text");
    const messageButton = document.getElementById("message-button");
    const overlay = document.getElementById("overlay");
    const endMessage = document.getElementById("end-message");
    const restartButton = document.getElementById("restart-button");

    let currentRound = 0;
    let maxRounds = 10;
    let score = Array(maxRounds).fill(null);
    let correctLetter = "";

    function createProgressIndicators() {
        progressContainer.innerHTML = "";
        for (let i = 0; i < maxRounds; i++) {
            let circle = document.createElement("div");
            circle.classList.add("progress-circle");
            circle.textContent = i + 1; // Agregar número dentro del círculo
            progressContainer.appendChild(circle);
        }
    }

    function getRandomLetter() {
        return alphabet[Math.floor(Math.random() * alphabet.length)];
    }

    function generateOptions(correctLetter) {
        let options = new Set();
        options.add(correctLetter);

        while (options.size < 4) {
            let randomLetter = getRandomLetter();
            if (!options.has(randomLetter)) {
                options.add(randomLetter);
            }
        }

        return Array.from(options).sort(() => Math.random() - 0.5);
    }

    function updateGame() {
        if (currentRound >= maxRounds) {
            showEndMessage();
            return;
        }

        correctLetter = getRandomLetter();
        wordDisplay.textContent = correctLetter;
        let optionLetters = generateOptions(correctLetter);
        optionsContainer.innerHTML = "";

        optionLetters.forEach(letter => {
            let img = document.createElement("img");
            img.src = `/img/juego_opciones/${letter}.png`;
            img.classList.add("option");
            img.dataset.answer = letter === correctLetter;
            img.addEventListener("click", checkAnswer);
            optionsContainer.appendChild(img);
        });

        feedback.textContent = "";
    }

    function checkAnswer(event) {
        let selected = event.target.dataset.answer === "true";

        if (selected) {
            score[currentRound] = score[currentRound] === false ? false : true;
            showFloatingMessage("¡MUY BIEN! 😃", "¡Respuesta correcta! 🎉", "Continuar", true);
        } else {
            score[currentRound] = false;
            showFloatingMessage("Incorrecto 😟", "¡Vuelve a intentarlo! 😎", "OK", false);
        }

        updateProgressIndicators();
    }

    function showFloatingMessage(title, text, buttonText, correct) {
        messageTitle.textContent = title;
        messageText.textContent = text;
        messageButton.textContent = buttonText;
        floatingMessage.classList.add("show");
        overlay.classList.add("show");

        messageButton.onclick = () => {
            floatingMessage.classList.remove("show");
            overlay.classList.remove("show");
            if (correct) {
                currentRound++;
                updateGame();
            }
        };
    }

    function updateProgressIndicators() {
        const circles = document.querySelectorAll(".progress-circle");
        circles.forEach((circle, index) => {
            if (score[index] === true) {
                circle.style.backgroundColor = "white"; // Correcto a la primera
            } else if (score[index] === false) {
                circle.style.backgroundColor = "red"; // Falló alguna vez
            } else {
                circle.style.backgroundColor = "transparent"; // Sin respuesta aún
            }
        });
    }

    function showEndMessage() {
        endMessage.classList.add("show");
        overlay.classList.add("show");
        restartButton.onclick = () => {
            endMessage.classList.remove("show");
            overlay.classList.remove("show");
            restartGame();
        };
    }

    function restartGame() {
        currentRound = 0;
        score = Array(maxRounds).fill(null);
        updateProgressIndicators();
        updateGame();
    }

    createProgressIndicators();
    updateGame();
});

function goToPerfil() {
    window.location.href = 'perfil.html';
}
