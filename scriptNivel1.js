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
        emociones: [
            "alegre", "triste", "enojado",
            "asustado", "sorprendido", "nervioso",
            "confundido", "avergonzado", "decepcionado"
        ],

        familia: [
            "papa", "mama", "familia", "hijo", "hombre", "mujer", 
        ],

        expresionesComunes: [
            "buenos dias", "buenas noches", "disculpa",
        ]
    };

    const itemsPorGrupo = 3;
    let grupoActual = 0;
    //let moduloActual = "familia"; // Cambia aquí para seleccionar el módulo
    let palabrasUsadas = [];
    let palabrasMostradas = [];
    let bloqueoInteraccion = false;

    const sonidoAcierto = new Audio("/sonidos/correcto.wav");
    const sonidoError = new Audio("/sonidos/incorrecto.wav");
    const sonidoSeleccion = new Audio("/sonidos/click.wav");

    let selectedImage = null;
    let selectedSena = null;

    cargarGrupo();

    function cargarGrupo() {
        const disponibles = modulos[moduloActual].filter(p => !palabrasUsadas.includes(p));

        if (disponibles.length === 0) {
            mostrarGanador();
            return;
        }

        const seleccionadas = [];

        while (seleccionadas.length < itemsPorGrupo && disponibles.length > 0) {
            const index = Math.floor(Math.random() * disponibles.length);
            seleccionadas.push(disponibles.splice(index, 1)[0]);
        }

        palabrasUsadas.push(...seleccionadas);
        palabrasMostradas = [...seleccionadas];

        const imagenes = document.getElementById("imagenes");
        const senas = document.getElementById("senas");
        const svg = document.querySelector(".lineas-svg");

        imagenes.innerHTML = "";
        senas.innerHTML = "";
        svg.innerHTML = "";

        const imagenesAleatorias = [...seleccionadas].sort(() => Math.random() - 0.5);
        const senasAleatorias = [...seleccionadas].sort(() => Math.random() - 0.5);

        imagenesAleatorias.forEach(palabra => {
            const img = document.createElement("img");
            img.src = `/img/${moduloActual}/${palabra}.png`;
            img.classList.add("item");
            img.dataset.match = palabra;
            imagenes.appendChild(img);
        });

        senasAleatorias.forEach(palabra => {
            const sena = document.createElement("img");
            if(moduloActual == 'emociones'){sena.src = `/senas/${moduloActual}/sena_${palabra}.gif`;}else{
            sena.src = `/senas/${moduloActual}/sena_${palabra}.png`;}
            sena.classList.add("item");
            sena.dataset.match = palabra;
            senas.appendChild(sena);
        });

        aplicarEventos();
        aplicarZoomInteractivo();
    }

    function aplicarEventos() {
        
        selectedImage = null;
        selectedSena = null;
        document.getElementById("feedback").textContent = "";

        const items = document.querySelectorAll('.item');
        items.forEach(item => {
            item.setAttribute('draggable', 'false');
            item.style.userSelect = 'none';
            item.style.webkitUserSelect = 'none';

            item.addEventListener('selectstart', e => e.preventDefault()); // previene highlight
            item.addEventListener('mousedown', e => e.preventDefault()); // previene selección por clic
            item.addEventListener('touchmove', e => e.preventDefault()); // previene selección por movimiento

            item.addEventListener('click', () => {
                if (bloqueoInteraccion || item.style.opacity === "0.5") return;

                sonidoSeleccion.play();
                const isImage = item.parentElement.id === 'imagenes';

                if (isImage) {
                    document.querySelectorAll('#imagenes .item').forEach(i => i.classList.remove('selected'));
                    item.classList.add('selected');
                    selectedImage = item;
                } else {
                    document.querySelectorAll('#senas .item').forEach(i => i.classList.remove('selected'));
                    item.classList.add('selected');
                    selectedSena = item;
                }

                if (selectedImage && selectedSena) {
                    const match1 = selectedImage.dataset.match;
                    const match2 = selectedSena.dataset.match;

                    bloqueoInteraccion = true;

                    if (match1 === match2) {
                        sonidoAcierto.play();
                        if (navigator.vibrate) navigator.vibrate(200); // ✅ vibración en móvil
                        dibujarLinea(selectedImage, selectedSena);
                        selectedImage.classList.remove('selected');
                        selectedSena.classList.remove('selected');
                        selectedImage.classList.add('acertado');
                        selectedSena.classList.add('acertado');
                        selectedImage.style.opacity = 0.8;
                        selectedSena.style.opacity = 0.8;
                        selectedImage.onclick = null;
                        selectedSena.onclick = null;

                        palabrasMostradas = palabrasMostradas.filter(p => p !== match1);
                        selectedImage = null;
                        selectedSena = null;

                        if (palabrasMostradas.length === 0) {
                            lanzarConfeti();
                            setTimeout(() => {
                                fadeOutIn(() => {
                                    grupoActual++;
                                    cargarGrupo();
                                    bloqueoInteraccion = false;
                                });
                            }, 1000);
                        } else {
                            setTimeout(() => {
                                bloqueoInteraccion = false;
                            }, 800);
                        }
                    } else {
                        sonidoError.play();
                        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);; // ✅ vibración en móvil
                        selectedImage.classList.add('incorrecto');
                        selectedSena.classList.add('incorrecto');
                        shake(selectedImage);
                        shake(selectedSena);
                        setTimeout(() => {
                            selectedImage.classList.remove('selected', 'incorrecto');
                            selectedSena.classList.remove('selected', 'incorrecto');
                            selectedImage = null;
                            selectedSena = null;
                            bloqueoInteraccion = false;
                        }, 1000);
                    }
                }
            });
        });
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
                <button onclick="pasarNivel2()" class="boton-final">Nivel 2</button>
                <button onclick="volverMenu()" class="boton-final">Inicio</button>
            </div>
        </div>`;
}

    function dibujarLinea(origen, destino) {
    const svg = document.querySelector('.lineas-svg');
    if (!svg) return;

    const svgRect = svg.getBoundingClientRect();
    const rect1 = origen.getBoundingClientRect();
    const rect2 = destino.getBoundingClientRect();

    // Ajustamos desde el centro visual del .item sin padding interno
    const x1 = rect1.left + rect1.width - svgRect.left;
    const y1 = rect1.top + rect1.height / 2 - svgRect.top;
    const x2 = rect2.left - svgRect.left;
    const y2 = rect2.top + rect2.height / 2 - svgRect.top;

    const linea = document.createElementNS("http://www.w3.org/2000/svg", "line");
    linea.setAttribute("x1", x1);
    linea.setAttribute("y1", y1);
    linea.setAttribute("x2", x1);
    linea.setAttribute("y2", y1);
    linea.setAttribute("stroke", "#1976d2");
    linea.setAttribute("stroke-width", "4");
    linea.setAttribute("stroke-linecap", "round");
    linea.classList.add("svg-linea");

    svg.appendChild(linea);

    setTimeout(() => {
        linea.setAttribute("x2", x2);
        linea.setAttribute("y2", y2);
    }, 10);
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

// Ampliar en hover o mantener pulsado
    function aplicarZoomInteractivo() {
    const items = document.querySelectorAll(".item");

    items.forEach(item => {
        
        item.setAttribute('draggable', 'false');         // No se puede arrastrar
        item.style.userSelect = 'none';                  // No se puede seleccionar (estándar)
        item.style.webkitUserSelect = 'none';            // Safari
        
        // Móvil: mantener presionado
        let timeout;
        item.addEventListener('touchstart', () => {
        timeout = setTimeout(() => {
            item.classList.add('enlarged');
        }, 300);
        });
        item.addEventListener('touchend', () => {
        clearTimeout(timeout);
        item.classList.remove('enlarged');
        });

        // PC: hover
        item.addEventListener('mouseenter', () => item.classList.add('enlarged'));
        item.addEventListener('mouseleave', () => item.classList.remove('enlarged'));
    });
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

        // Móvil
        item.setAttribute('draggable', 'false');

        item.addEventListener('touchstart', () => {
            timeout = setTimeout(() => {
                zoomImage.src = item.src;
                zoomViewer.style.display = 'flex';
            }, 300);
        });

        item.addEventListener('touchend', () => clearTimeout(timeout));

        // PC (opcional, hover ampliado)
        item.addEventListener('mouseenter', () => {
            // Solo si quieres activarlo también con mouse
            // zoomImage.src = item.src;
            // zoomViewer.style.display = 'flex';
        });
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
    //window.location.href = '../perfil.html';
}

function pasarNivel2() {
    window.location.href = "Nivel2.html"; // Cambia esto por la ruta real del nivel 2
}

function volverMenu() {
    window.location.href = "SeleccionarNivel.html"; // O la ruta a tu menú principal
}
