const moduloActual = localStorage.getItem("moduloSeleccionado");

  if (!moduloActual) {
    // Si entran directo sin seleccionar módulo, redirige
    window.location.href = "SeleccionarModulo.html";
  }

document.addEventListener("DOMContentLoaded", () => {
  const modulos = {
    emociones: [
      "alegre", "triste", "enojado",
      "asustado", "sorprendido", "nervioso",
      "confundido", "avergonzado", "decepcionado"
    ],
    familia: [
      "papa", "mama", "familia", "hijo", "hombre", "mujer"
    ],
    expresionesComunes: [
            "buenos dias", "buenas noches", "disculpa",
    ]
  };

  //const moduloActual = "emociones"; // Cambia aquí según el módulo deseado
  let palabraCorrecta = "";
  let palabraEscrita = "";
  let esMayuscula = true;
  let bloqueoInteraccion = false;
  let palabrasUsadas = [];
  let letrasDOM = [];
  let indiceLetraActual = 0;


      const sonidoAcierto = new Audio("/sonidos/correcto.wav");
    const sonidoError = new Audio("/sonidos/incorrecto.wav");
    const sonidoSeleccion = new Audio("/sonidos/click.wav");

  // Inicializa
  seleccionarPalabraAleatoria();

  // TECLADO FISICO
  document.addEventListener('keydown', (e) => {
    if (bloqueoInteraccion) return; // NO PERMITIR nada
    if (e.key === ' ') {
    e.preventDefault(); // ⛔ evita el scroll
  }
    let tecla = e.key;
    if (window.innerWidth <= 768 || 'ontouchstart' in window) {
    if (tecla.length !== 1) {
      if (e.key === 'Backspace') {
        palabraEscrita = palabraEscrita.slice(0, -1);
        actualizarCaja();
      }
      return;
    }
    }

    tecla = esMayuscula ? tecla.toUpperCase() : tecla.toLowerCase();

    // Solo si es letra válida
    if (/^[a-zñáéíóúü ]$/i.test(tecla)) {
      const letraEsperada = palabraCorrecta[indiceLetraActual]?.toLowerCase();
      if (palabraEscrita.length === indiceLetraActual && tecla.toLowerCase() === letraEsperada) {
        palabraEscrita += tecla;
        actualizarCaja();
        indiceLetraActual++;

    // Animar tecla física
        const elemento = document.querySelector(`.tecla[data-tecla="${tecla.toUpperCase()}"]`);
        if (elemento) {
          elemento.classList.add('activa');
          setTimeout(() => {
            elemento.classList.remove('activa');
          }, 200);
        }

        // Si ya escribió todo
        if (palabraEscrita.length === palabraCorrecta.length) {
          bloqueoInteraccion = true;
          setTimeout(() => verificarPalabra(), 500);
        }

      } else {
        // opcional: vibrar o dar sonido de error
        sonidoError.play();
        if (navigator.vibrate) navigator.vibrate(200); // ✅ vibración en móvil
        }
    }

    // Verifica si ya escribió toda la palabra
    if (palabraEscrita.length === palabraCorrecta.length) {
        bloqueoInteraccion = true;
      setTimeout(() => verificarPalabra(), 500); // pequeña pausa para UX
    }
  });

  // Botón para mayúsculas/minúsculas
  document.getElementById('toggle-case').addEventListener('click', () => {
    esMayuscula = !esMayuscula;

    document.querySelectorAll('.tecla').forEach(tecla => {
      const letra = tecla.dataset.tecla;
      tecla.textContent = esMayuscula ? letra.toUpperCase() : letra.toLowerCase();
    });

    actualizarCaja();

    document.getElementById('toggle-case').textContent = esMayuscula
      ? "Cambiar a minúscula"
      : "Cambiar a mayúscula";
  });


  // Carga una palabra aleatoria del módulo
 function seleccionarPalabraAleatoria() {
  
  const disponibles = modulos[moduloActual].filter(p => !palabrasUsadas.includes(p));

  if (disponibles.length === 0) {
    mostrarGanador();
    return;
  }

  const index = Math.floor(Math.random() * disponibles.length);
  palabraCorrecta = disponibles[index];
  palabrasUsadas.push(palabraCorrecta); // Marca como usada
  palabraEscrita = "";
  indiceLetraActual = 0;
  actualizarCaja();

  const img = document.getElementById('imagen-palabra');
  const sena = document.getElementById('imagen-sena');
  if (img) img.src = `/img/${moduloActual}/${palabraCorrecta}.png`;
   if(moduloActual == 'emociones'){ if (sena) sena.src = `/senas/${moduloActual}/sena_${palabraCorrecta}.gif`;}
   else{ if (sena) sena.src = `/senas/${moduloActual}/sena_${palabraCorrecta}.png`;}

  console.log("Palabra correcta:", palabraCorrecta);
}

  function verificarPalabra() {
  const ingreso = palabraEscrita.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const correcta = palabraCorrecta.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  if (ingreso === correcta) {
    sonidoAcierto.play();
    if (navigator.vibrate) navigator.vibrate(200); // ✅ vibración en móvil
    document.getElementById('caja-escritura').classList.add('acertado');
    lanzarConfeti(); // Lanza confeti si está disponibl
    setTimeout(() => {
      document.getElementById('caja-escritura').classList.remove('acertado');
      seleccionarPalabraAleatoria(); // carga nueva palabra
      bloqueoInteraccion = false
    }, 1000);

  } else {
    sonidoError.play();
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);; // ✅ vibración en móvil
    document.getElementById('caja-escritura').classList.add('incorrecto');
    setTimeout(() => {
    document.getElementById('caja-escritura').classList.remove('incorrecto');
      palabraEscrita = "";
      actualizarCaja();
      bloqueoInteraccion = false
    }, 800);
  }
}



function actualizarCaja() {
  const contenedor = document.getElementById("caja-escritura");
  contenedor.innerHTML = "";
  letrasDOM = [];

  for (let i = 0; i < palabraCorrecta.length; i++) {
    const span = document.createElement("span");
    span.classList.add("letra");
    span.textContent = palabraEscrita[i] ? palabraEscrita[i] : "_";
    contenedor.appendChild(span);
    letrasDOM.push(span);
  }

  resaltarLetraActual();
  resaltarSiguienteLetra();
  
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

    function mostrarGanador() {
    const gameBox = document.querySelector(".game-box");
    gameBox.innerHTML = `
        <div class="final-box" style="position: relative; z-index: 10; text-align: center;">
            <div class="overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); z-index: -1;"></div>
            <img src="/img/ganaste.png" alt="Ganaste" class="ganaste-img" style="max-width: 80%; margin-bottom: 20px;" />
            <div style="margin-top: 20px;">
                <button onclick="volverMenu()" class="boton-final">Inicio</button>
            </div>
        </div>`;
}

function resaltarSiguienteLetra() {
  // Primero limpiamos cualquier resaltado previo
  document.querySelectorAll('.tecla').forEach(tecla => {
    tecla.classList.remove('resaltada');
  });

  if (palabraEscrita.length >= palabraCorrecta.length) return;

  const siguienteLetra = palabraCorrecta[palabraEscrita.length];
  const teclaEsperada = esMayuscula
    ? siguienteLetra.toUpperCase()
    : siguienteLetra.toLowerCase();

  const teclaHTML = document.querySelector(`.tecla[data-tecla="${teclaEsperada.toUpperCase()}"]`);
  if (teclaHTML) {
    teclaHTML.classList.add('resaltada');
  }
}

function resaltarLetraActual() {
  letrasDOM.forEach((span, i) => {
    span.classList.remove("letra-activa");
  });

  if (letrasDOM[indiceLetraActual]) {
    letrasDOM[indiceLetraActual].classList.add("letra-activa");
  }
}

function aplicarZoomInteractivo() {
    const items = document.querySelectorAll(".img-n3");
    const zoomViewer = document.getElementById("zoom-viewer");
    const zoomImage = document.getElementById("zoom-image");
    const closeBtn = document.getElementById("close-zoom");

    function cerrarZoom() {
        zoomViewer.style.display = 'none';
        zoomImage.src = '';
    }

    items.forEach(item => {
        let timeout;


        // Prevenir acciones no deseadas
        document.addEventListener('contextmenu', function (e) {
        e.preventDefault();
    }, false);
        item.setAttribute('draggable', 'false');

        // En móviles: mantener pulsado
        item.addEventListener('touchstart', () => {
            timeout = setTimeout(() => {
                zoomImage.src = item.src;
                zoomViewer.style.display = 'flex';
            }, 300);
        });

        item.addEventListener('touchend', () => clearTimeout(timeout));

        // En PC: no se activa zoom
    });

    closeBtn.addEventListener('click', cerrarZoom);
    zoomViewer.addEventListener('click', (e) => {
        if (e.target === zoomViewer) cerrarZoom();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') cerrarZoom();
    });
}


if (window.innerWidth <= 768 || 'ontouchstart' in window) {
    aplicarZoomInteractivo();
  document.querySelectorAll('.tecla').forEach(tecla => {
    tecla.addEventListener('click', () => {
      if (bloqueoInteraccion) return;

      const letra = tecla.dataset.tecla;
      if (!letra) return;

      if (palabraEscrita.length < palabraCorrecta.length) {
        palabraEscrita += esMayuscula ? letra.toUpperCase() : letra.toLowerCase();
        actualizarCaja();

        tecla.classList.add('activa');
        setTimeout(() => tecla.classList.remove('activa'), 200);
      }

      if (palabraEscrita.length === palabraCorrecta.length) {
        bloqueoInteraccion = true;
        setTimeout(() => verificarPalabra(), 500);
      }
    });
  });

  // Botón de borrar (⌫)
  const borrar = document.getElementById('tecla-borrar');  
  if (borrar) {
    borrar.addEventListener('click', () => {
      if (bloqueoInteraccion) return;

      palabraEscrita = palabraEscrita.slice(0, -1);
      actualizarCaja();
    });
  }
}
});

function volverMenu() {
    window.location.href = "SeleccionarNivel.html"; // O la ruta a tu menú principal
}


