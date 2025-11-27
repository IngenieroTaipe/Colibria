if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    document.addEventListener('contextmenu', function (e) {
        e.preventDefault();
    }, false);
}

const moduloActual = localStorage.getItem("moduloSeleccionado");

  if (!moduloActual) {
    // Si entran directo sin seleccionar módulo, redirige
    window.location.href = "SeleccionarModulo.html";
  }

document.addEventListener("DOMContentLoaded", function () {
    const modulos = {
        emociones: ["alegre", "triste", "enojado", "asustado", "sorprendido", "nervioso", "confundido", "avergonzado", "decepcionado"],
        familia: ["papa", "mama", "familia", "hijo", "hombre", "mujer", ],
        expresionesComunes: [
            "buenos dias", "buenas noches", "disculpa",
        ]
    };


    //let moduloActual = "familia";
    let palabrasUsadas = [];
    let palabraActual = null;
    let seleccionActual = null;
    let bloqueoInteraccion = false;

    const sonidoAcierto = new Audio("/sonidos/correcto.wav");
    const sonidoError = new Audio("/sonidos/incorrecto.wav");
    const sonidoSeleccion = new Audio("/sonidos/click.wav");

    cargarGrupo();
    
    function cargarGrupo() {
        const disponibles = modulos[moduloActual].filter(p => !palabrasUsadas.includes(p));
        if (disponibles.length === 0) {
            mostrarGanador();
            return;
        }

        const index = Math.floor(Math.random() * disponibles.length);
        palabraActual = disponibles[index];
        palabrasUsadas.push(palabraActual);

        document.getElementById("imagen-principal").src = `/img/${moduloActual}/${palabraActual}.png`;

        const opciones = generarOpciones(palabraActual);
        const contenedor = document.getElementById("opciones-senas");
        contenedor.innerHTML = "";

        opciones.forEach(palabra => {
            sonidoSeleccion.play();
            
            const img = document.createElement("img");
            if(moduloActual == 'emociones'){img.src = `/senas/${moduloActual}/sena_${palabra}.gif`} else{
                img.src = `/senas/${moduloActual}/sena_${palabra}.png`;
            }
            img.classList.add("item");
            img.dataset.match = palabra;

            img.addEventListener("click", () => {
                if (bloqueoInteraccion) return; // No permite seleccionar si está bloqueado
                sonidoSeleccion.play();
                document.querySelectorAll(".opciones-senas .item").forEach(i => i.classList.remove("selected"));
                img.classList.add("selected");
                seleccionActual = img;
            });

            contenedor.appendChild(img);
        });

        aplicarZoomInteractivo();
    }

    function generarOpciones(correcta) {
        
        const lista = [correcta];
        const restantes = modulos[moduloActual].filter(p => p !== correcta);
        while (lista.length < 4 && restantes.length > 0) {
            const index = Math.floor(Math.random() * restantes.length);
            lista.push(restantes.splice(index, 1)[0]);
        }
        return lista.sort(() => Math.random() - 0.5);
    }

    window.verificarSeleccion = function () {
        if (bloqueoInteraccion || !seleccionActual) return;
        bloqueoInteraccion = true; // 🔒 BLOQUEO TOTAL

        const seleccion = seleccionActual.dataset.match;

        if (seleccion === palabraActual) {
            sonidoAcierto.play();
            if (navigator.vibrate) navigator.vibrate(200); // ✅ vibración en móvil
            seleccionActual.classList.add("acertado");
            lanzarConfeti();
            
            setTimeout(() => {
                fadeOutIn(() => {
                    cargarGrupo();
                    bloqueoInteraccion = false; // 🔓 DESBLOQUEO
                    });
            }, 1000);

        } else {
                sonidoError.play();
                if (navigator.vibrate) navigator.vibrate([100, 50, 100]);; // ✅ vibración en móvil
                seleccionActual.classList.add("incorrecto");
                shake(seleccionActual);

                // Desactivar selección y ocultar imagen tras error
                setTimeout(() => {
                    seleccionActual.style.visibility = "hidden"; // Oculta visualmente
                    seleccionActual.style.pointerEvents = "none"; // No permite más clics
                    seleccionActual = null;
                    bloqueoInteraccion = false; // 🔓 DESBLOQUEO
                }, 700);
        }

        setTimeout(() => {
                if (bloqueoInteraccion) return;
        }, 1000);
    }

    function shake(element) {
        element.style.transition = "transform 0.1s";
        element.style.transform = "translateX(-10px)";
        setTimeout(() => {
            element.style.transform = "translateX(10px)";
        }, 100);
        setTimeout(() => {
            element.style.transform = "translateX(0px)";
        }, 200);
    }

    function mostrarGanador() {
    const gameBox = document.querySelector(".game-box");
    gameBox.innerHTML = `
        <div class="final-box" style="position: relative; z-index: 10; text-align: center;">
            <div class="overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); z-index: -1;"></div>
            <img src="/img/ganaste.png" alt="Ganaste" class="ganaste-img" style="max-width: 80%; margin-bottom: 20px;" />
            <div style="margin-top: 20px;">
                <button onclick="pasarNivel3()" class="boton-final">Nivel 3</button>
                <button onclick="volverMenu()" class="boton-final">Inicio</button>
            </div>
        </div>`;
}

    function fadeOutIn(callback) {
        const box = document.querySelector(".game-box");
        box.style.minHeight = "300px";
        box.style.opacity = 0;
        setTimeout(() => {
            callback();
            box.style.opacity = 1;
        }, 500);
    }

    function lanzarConfeti() {
        if (typeof confetti !== 'undefined') {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        }
    }

    function aplicarZoomInteractivo() {
        const items = document.querySelectorAll(".item");
        const zoomViewer = document.getElementById("zoom-viewer");
        const zoomImage = document.getElementById("zoom-image");
        const closeBtn = document.getElementById("close-zoom");

        function cerrarZoom() {
            zoomViewer.style.display = 'none';
            zoomImage.src = '';
        }

        items.forEach(item => {
            let timeout;

            item.setAttribute('draggable', 'false');

            item.addEventListener('touchstart', () => {
                timeout = setTimeout(() => {
                    zoomImage.src = item.src;
                    zoomViewer.style.display = 'flex';
                }, 300);
            });

            item.addEventListener('touchend', () => clearTimeout(timeout));
        });

        closeBtn.addEventListener('click', cerrarZoom);
        zoomViewer.addEventListener('click', (e) => {
            if (e.target === zoomViewer) cerrarZoom();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') cerrarZoom();
        });
    }
});

function goToPerfil() {
    window.location.href = '../perfil.html';
}

function pasarNivel3() {
    window.location.href = "Nivel3.html"; // Cambia esto por la ruta real del nivel 3
}

function volverMenu() {
    window.location.href = "SeleccionarNivel.html"; // O la ruta a tu menú principal
}
