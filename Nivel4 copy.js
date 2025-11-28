// Desactivar menú contextual en móviles
if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    document.addEventListener('contextmenu', function (e) {
        e.preventDefault();
    }, false);
}

// Verificar módulo seleccionado
const moduloActual = localStorage.getItem("moduloSeleccionado");

if (!moduloActual) {
    window.location.href = "SeleccionarModulo.html";
}

// ============================================
// CONFIGURACIÓN DEL JUEGO
// ============================================

const modulos = {
        emociones: ["alegre", "triste", "enojado", "asustado", "sorprendido", "nervioso", "confundido", "avergonzado", "decepcionado"],
        familia: ["papa", "mama", "familia", "hijo", "hombre", "mujer", ],
        expresionesComunes: ["buenos dias", "buenas noches", "disculpa"]
    };

let palabrasUsadas = [];
let palabraActual = null;
let indiceActual = 0;
let videoStream = null;
let camaraSeleccionada = null;
let camarasDisponibles = [];
let permisosCamaraOtorgados = false;

// Sonidos
const sonidoTransicion = new Audio("/sonidos/click.wav");
const sonidoConfeti = new Audio("/sonidos/correcto.wav");

// ============================================
// INICIALIZACIÓN Y PERMISOS DE CÁMARA
// ============================================

// Al cargar la página, solicitar permisos de cámara
window.addEventListener('DOMContentLoaded', async () => {
    await verificarYSolicitarPermisos();
});


function seleccionarCamaraFrontal() {
    // Buscar cámara frontal (user-facing)
    const camaraFrontal = camarasDisponibles.find(cam => 
        cam.label.toLowerCase().includes('front') || 
        cam.label.toLowerCase().includes('frontal') ||
        cam.label.toLowerCase().includes('user')
    );
    
    if (camaraFrontal) {
        camaraSeleccionada = camaraFrontal.deviceId;
        console.log('Cámara frontal seleccionada:', camaraFrontal.label);
    } else {
        // Si no encuentra frontal, usar la última cámara (suele ser la frontal en laptops)
        camaraSeleccionada = camarasDisponibles[camarasDisponibles.length - 1].deviceId;
        console.log('Usando última cámara:', camarasDisponibles[camarasDisponibles.length - 1].label);
    }
}

function mostrarSelectorCamaras(container, previewVideo) { // <- ACEPTAR previewVideo
    const selectorDiv = document.createElement('div');
    selectorDiv.className = 'selector-camaras';
    selectorDiv.innerHTML = '<label>📹 Seleccionar cámara:</label>';
    
    const select = document.createElement('select');
    select.className = 'select-camara';
    
    camarasDisponibles.forEach((camera, index) => {
        const option = document.createElement('option');
        option.value = camera.deviceId;
        option.textContent = camera.label || `Cámara ${index + 1}`;
        
        if (camera.deviceId === camaraSeleccionada) {
            option.selected = true;
        }
        
        select.appendChild(option);
    });
    
    select.onchange = (e) => {
        const nuevoDeviceId = e.target.value; // Capturar el nuevo ID
        
        camaraSeleccionada = nuevoDeviceId;
        console.log('Cámara cambiada a:', camarasDisponibles.find(c => c.deviceId === camaraSeleccionada).label);
        sonidoTransicion.play();

        // 🟢 ¡LLAMADA A LA FUNCIÓN DE CAMBIO DE CÁMARA! 🟢
        cambiarCamara(nuevoDeviceId, previewVideo); 
    };
    
    selectorDiv.appendChild(select);
    container.appendChild(selectorDiv);
}

// ============================================
// PERMISOS 2
// ============================================

async function verificarYSolicitarPermisos() {
    const botonComenzar = document.querySelector('.boton-comenzar');
    const instruccionesBox = document.querySelector('.instrucciones-box');
    
    // Limpiar cualquier elemento previo de configuración de cámara
    const elementosPrevios = instruccionesBox.querySelectorAll('.mensaje-estado-camara, .preview-camara-container, .selector-camaras');
    elementosPrevios.forEach(el => el.remove());
    
    // Deshabilitar botón inicialmente
    botonComenzar.disabled = true;
    botonComenzar.style.opacity = '0.5';
    botonComenzar.style.cursor = 'not-allowed';
    
    // Agregar mensaje de estado
    let mensajeEstado = document.createElement('div');
    mensajeEstado.className = 'mensaje-estado-camara';
    mensajeEstado.innerHTML = '📹 Solicitando acceso a la cámara...';
    instruccionesBox.appendChild(mensajeEstado);
    
    // Crear contenedor wrapper para layout responsive
    let wrapperCamara = document.createElement('div');
    wrapperCamara.className = 'wrapper-camara-config';
    
    // Crear contenedor para preview de cámara
    let previewContainer = document.createElement('div');
    previewContainer.className = 'preview-camara-container';
    previewContainer.style.display = 'none';
    
    let previewVideo = document.createElement('video');
    previewVideo.className = 'preview-camara-video';
    previewVideo.autoplay = true;
    previewVideo.playsinline = true;
    previewVideo.muted = true;
    previewVideo.setAttribute('playsinline', '');
    previewVideo.setAttribute('webkit-playsinline', '');
    
    previewContainer.appendChild(previewVideo);
    wrapperCamara.appendChild(previewContainer);
    instruccionesBox.appendChild(wrapperCamara);
    
    try {
        // Solicitar permisos de cámara
        console.log('Solicitando permisos de cámara...');
        let stream = await navigator.mediaDevices.getUserMedia({ 
            video: true, 
            audio: false 
        });
        
        // Obtener lista de cámaras disponibles
        const devices = await navigator.mediaDevices.enumerateDevices();
        camarasDisponibles = devices.filter(device => device.kind === 'videoinput');
        
        console.log('Cámaras disponibles:', camarasDisponibles);
        
        if (camarasDisponibles.length === 0) {
            throw new Error('No se encontraron cámaras');
        }
        
        // Detectar qué cámara está funcionando actualmente
        const trackSettings = stream.getVideoTracks()[0].getSettings();
        const camaraActual = trackSettings.deviceId;
        
        console.log('Cámara detectada funcionando:', camaraActual);
        
        // Si hay cámara guardada en localStorage, intentar usarla
        const camaraGuardada = localStorage.getItem('camaraSeleccionada');
        if (camaraGuardada && camarasDisponibles.some(c => c.deviceId === camaraGuardada)) {
            camaraSeleccionada = camaraGuardada;
            console.log('Usando cámara guardada:', camaraSeleccionada);
        } else {
            // Si no hay guardada, usar la que está funcionando
            camaraSeleccionada = camaraActual;
            console.log('Usando cámara detectada:', camaraSeleccionada);
        }
        
        // Detener el stream inicial
        stream.getTracks().forEach(track => track.stop());
        
        // Iniciar stream con la cámara seleccionada
        stream = await navigator.mediaDevices.getUserMedia({
            video: { 
                deviceId: { exact: camaraSeleccionada },
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        });
        
        previewVideo.srcObject = stream;
        await previewVideo.play();
        previewContainer.style.display = 'block';
        
        // Actualizar mensaje
        mensajeEstado.innerHTML = '✅ Cámara lista - Vista previa activa';
        mensajeEstado.style.color = '#4CAF50';
        
        // Si hay múltiples cámaras, mostrar selector
        if (camarasDisponibles.length > 1) {
            mostrarSelectorCamaras(wrapperCamara, previewVideo);
        }
        
        // Marcar permisos como otorgados
        permisosCamaraOtorgados = true;
        
        // Habilitar botón
        botonComenzar.disabled = false;
        botonComenzar.style.opacity = '1';
        botonComenzar.style.cursor = 'pointer';
        
        // Guardar el stream para limpiarlo después
        window.previewStream = stream;
        
    } catch (error) {
        console.error('Error al solicitar permisos:', error);
        
        let mensajeError = '';
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            mensajeError = '❌ Permiso denegado<br><small>Por favor, permite el acceso a la cámara y recarga la página</small>';
        } else if (error.name === 'NotFoundError') {
            mensajeError = '❌ No se encontró cámara<br><small>Conecta una cámara y recarga la página</small>';
        } else if (error.name === 'NotReadableError') {
            mensajeError = '❌ Cámara en uso<br><small>Cierra otras aplicaciones que usen la cámara</small>';
        } else {
            mensajeError = '❌ Error al acceder a la cámara<br><small>' + error.message + '</small>';
        }
        
        mensajeEstado.innerHTML = mensajeError;
        mensajeEstado.style.color = '#f44336';
        
        // Agregar botón para reintentar
        const botonReintentar = document.createElement('button');
        botonReintentar.textContent = '🔄 Reintentar';
        botonReintentar.className = 'boton-reintentar';
        botonReintentar.onclick = () => {
            // Limpiar todo antes de recargar
            if (window.previewStream) {
                window.previewStream.getTracks().forEach(track => track.stop());
                window.previewStream = null;
            }
            permisosCamaraOtorgados = false;
            
            // Limpiar elementos de UI
            elementosPrevios.forEach(el => el.remove());
            wrapperCamara.remove();
            mensajeEstado.remove();
            
            // Volver a solicitar permisos
            verificarYSolicitarPermisos();
        };
        mensajeEstado.appendChild(document.createElement('br'));
        mensajeEstado.appendChild(botonReintentar);
    }
}

/**
 * Detiene el stream actual, solicita un nuevo stream con el deviceId proporcionado
 * y lo asigna al elemento de video de la vista previa.
 * @param {string} nuevoDeviceId - El deviceId de la cámara a seleccionar.
 * @param {HTMLVideoElement} previewVideo - El elemento <video> de la vista previa.
 */
async function cambiarCamara(nuevoDeviceId, previewVideo) {

    // Detener el stream del preview si existe
    if (window.previewStream) {
        window.previewStream.getTracks().forEach(track => track.stop());
        window.previewStream = null;
    }

    // Detener stream de la etapa práctica si existe
    if (window.videoStream) {
        window.videoStream.getTracks().forEach(track => track.stop());
        window.videoStream = null;
    }

    try {
        // Solicitar el nuevo stream
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                deviceId: { exact: nuevoDeviceId },
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        });

        console.log("Nuevo stream obtenido");

        // ASIGNAR EL STREAM AL PREVIEW
        previewVideo.srcObject = stream;
        await previewVideo.play();

        // ASIGNAR TAMBIÉN AL VIDEO DE LA ETAPA PRÁCTICA
        const videoPractica = document.getElementById("video-camara");
        if (videoPractica) {
            videoPractica.srcObject = stream;
            await videoPractica.play();
        }

        // Guardar referencias globales
        window.previewStream = stream;
        window.videoStream = stream;

        camaraSeleccionada = nuevoDeviceId;
        localStorage.setItem('camaraSeleccionada', nuevoDeviceId);

        console.log(`Cámara cambiada exitosamente a: ${nuevoDeviceId}`);

    } catch (error) {
        console.error('Error al cambiar de cámara:', error);
    }
}
// ============================================
// FUNCIONES PRINCIPALES
// ============================================

function iniciarNivel() {
    if (!permisosCamaraOtorgados) {
        alert('Por favor, permite el acceso a la cámara para continuar.');
        return;
    }
    
    sonidoTransicion.play();
    vibrar(100);
    cambiarEtapa('etapa-instrucciones', 'etapa-presentacion');
    indiceActual = 0;
    palabrasUsadas = [];
    cargarPalabra();
}

function cargarPalabra() {
    const disponibles = modulos[moduloActual].filter(p => !palabrasUsadas.includes(p));
    
    if (disponibles.length === 0) {
        mostrarPantallaFinal();
        return;
    }

    const index = Math.floor(Math.random() * disponibles.length);
    palabraActual = disponibles[index];
    palabrasUsadas.push(palabraActual);

    // Actualizar palabra en presentación
    document.getElementById('palabra-titulo').textContent = palabraActual.toUpperCase();
    
    // Cargar GIF según el módulo
    const rutaGif = moduloActual === 'emociones' 
        ? `/senas/${moduloActual}/sena_${palabraActual}.gif`
        : `/senas/${moduloActual}/sena_${palabraActual}.png`;
    
    const gifElement = document.getElementById('gif-sena');
    const imagenApoyo = document.getElementById('imagen-apoyo');
    
    // Resetear estado de carga
    let gifCargado = false;
    let imagenCargada = false;
    
    // Función para verificar si todo está cargado
    const verificarCargaCompleta = () => {
        if (gifCargado && imagenCargada) {
            reproducirGifConContador();
        }
    };
    
    // Cargar GIF/PNG
    gifElement.onload = () => {
        console.log('GIF/PNG cargado');
        gifCargado = true;
        verificarCargaCompleta();
    };
    
    gifElement.onerror = () => {
        console.error('Error al cargar GIF/PNG');
        gifCargado = true;
        verificarCargaCompleta();
    };
    
    gifElement.src = rutaGif;
    
    // Cargar imagen de apoyo
    imagenApoyo.onload = () => {
        console.log('Imagen de apoyo cargada');
        imagenCargada = true;
        verificarCargaCompleta();
    };
    
    imagenApoyo.onerror = () => {
        console.error('Error al cargar imagen de apoyo');
        imagenCargada = true;
        verificarCargaCompleta();
    };
    
    imagenApoyo.src = `/img/${moduloActual}/${palabraActual}.png`;
}

function reproducirGifConContador() {
    let repeticion = 1;
    const maxRepeticiones = 3;
    const tiempoRepeticion = 2000; // 5 segundos por repetición
    
    document.getElementById('repeticion-actual').textContent = repeticion;

    const intervalo = setInterval(() => {
        repeticion++;
        document.getElementById('repeticion-actual').textContent = repeticion;
        
        if (repeticion >= maxRepeticiones) {
            clearInterval(intervalo);
            setTimeout(() => {
                iniciarCuentaRegresiva();
            }, 1000);
        }
    }, tiempoRepeticion);
}

function iniciarCuentaRegresiva() {
    sonidoTransicion.play();
    cambiarEtapa('etapa-presentacion', 'etapa-cuenta');
    
    let cuenta = 3;
    const numeroCuenta = document.getElementById('numero-cuenta');
    numeroCuenta.textContent = cuenta;

    const intervalo = setInterval(() => {
        vibrar(cuenta === 1 ? 300 : 100);
        cuenta--;
        
        if (cuenta > 0) {
            numeroCuenta.textContent = cuenta;
            numeroCuenta.style.animation = 'none';
            setTimeout(() => {
                numeroCuenta.style.animation = 'pulso 1s ease-in-out';
            }, 10);
        } else {
            clearInterval(intervalo);
            setTimeout(() => {
                activarCamara();
            }, 500);
        }
    }, 1000);
}

async function activarCamara() {
    cambiarEtapa('etapa-cuenta', 'etapa-camara');
    
    document.getElementById('palabra-camara').textContent = palabraActual.toUpperCase();
    
    const rutaGif = moduloActual === 'emociones' 
        ? `/senas/${moduloActual}/sena_${palabraActual}.gif`
        : `/senas/${moduloActual}/sena_${palabraActual}.png`;
    
    document.getElementById('gif-mini').src = rutaGif;
    document.getElementById('gif-ampliado').src = rutaGif;

    configurarModalGif();

    const videoElement = document.getElementById('video-camara');
    
    try {
        console.log('Activando cámara seleccionada:', camaraSeleccionada);
        
        // 🔥 REUTILIZAR EL STREAM DE LA VISTA PREVIA SI EXISTE
        if (window.previewStream && window.previewStream.active) {
            console.log('✅ Reutilizando stream de vista previa');
            videoStream = window.previewStream;
        } else {
            // Si no hay stream previo, crear uno nuevo
            if (videoStream) {
                videoStream.getTracks().forEach(track => track.stop());
            }

            const constraints = {
                video: {
                    deviceId: camaraSeleccionada ? { exact: camaraSeleccionada } : undefined,
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: camaraSeleccionada ? undefined : 'user'
                },
                audio: false
            };

            videoStream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log('Stream de cámara obtenido');
        }
        
        videoElement.srcObject = videoStream;
        videoElement.muted = true;
        videoElement.playsInline = true;
        videoElement.setAttribute('playsinline', '');
        videoElement.setAttribute('webkit-playsinline', '');
        
        // Esperar a que el video esté listo
        await new Promise((resolve, reject) => {
            videoElement.onloadedmetadata = () => {
                console.log('Metadatos cargados:', videoElement.videoWidth, 'x', videoElement.videoHeight);
                resolve();
            };
            videoElement.onerror = reject;
            setTimeout(() => reject(new Error('Timeout esperando metadatos')), 5000);
        });
        
        await videoElement.play();
        console.log('✅ Video reproduciéndose');
        
        // Esperar un frame para asegurar que el video está realmente activo
        await new Promise(resolve => requestAnimationFrame(resolve));
        
        // **INICIAR DETECCIÓN DE SEÑAS**
        if (typeof iniciarCamaraConDeteccion === 'function') {
            console.log('Iniciando detección de señas...');
            await iniciarCamaraConDeteccion();
        } else {
            console.error('⚠️ iniciarCamaraConDeteccion no está definida');
        }
        
        // Verificación adicional
        setTimeout(() => {
            if (videoElement.paused) {
                console.warn('Video pausado, reintentando...');
                videoElement.play();
            }
            if (!videoElement.srcObject) {
                console.error('⚠️ Video sin srcObject');
            }
        }, 200);

    } catch (error) {
        console.error('❌ Error al activar cámara:', error);
        
        let mensajeError = 'No se pudo activar la cámara.\n\n';
        
        if (error.name === 'NotAllowedError') {
            mensajeError += 'Permiso denegado. Recarga la página y permite el acceso.';
        } else if (error.name === 'NotFoundError') {
            mensajeError += 'No se encontró la cámara seleccionada.';
        } else if (error.name === 'NotReadableError') {
            mensajeError += 'La cámara está en uso por otra aplicación.';
        } else if (error.name === 'OverconstrainedError') {
            mensajeError += 'La cámara no soporta la configuración solicitada.';
            
            try {
                console.log('Intentando con configuración básica...');
                videoStream = await navigator.mediaDevices.getUserMedia({ 
                    video: { deviceId: camaraSeleccionada }, 
                    audio: false 
                });
                videoElement.srcObject = videoStream;
                videoElement.muted = true;
                videoElement.playsInline = true;
                await videoElement.play();
                console.log('✅ Funcionó con configuración básica');
                
                if (typeof iniciarCamaraConDeteccion === 'function') {
                    await iniciarCamaraConDeteccion();
                }
                
                return;
            } catch (err2) {
                console.error('Tampoco funcionó con configuración básica:', err2);
            }
        } else {
            mensajeError += error.message;
        }
        
        alert(mensajeError);
        setTimeout(() => mostrarBotonSiguiente(), 1000);
    }
}

function configurarModalGif() {
    const gifReferencia = document.getElementById('gif-referencia');
    const modal = document.getElementById('modal-gif');
    const cerrarModal = document.getElementById('cerrar-modal');

    gifReferencia.onclick = () => {
        modal.classList.add('activo');
        sonidoTransicion.play();
        
        setTimeout(() => {
            modal.classList.remove('activo');
        }, 6000);
    };

    cerrarModal.onclick = (e) => {
        e.stopPropagation();
        modal.classList.remove('activo');
    };

    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.classList.remove('activo');
        }
    };
}

function mostrarMensajeAliento() {
    const mensaje = document.getElementById('mensaje-aliento');
    mensaje.classList.add('mostrar');
    
    setTimeout(() => {
        mensaje.classList.remove('mostrar');
    }, 2000);
}

function mostrarBotonSiguiente() {
    const boton = document.getElementById('boton-siguiente');
    boton.classList.remove('oculto');
    boton.style.animation = 'aparecer 0.5s ease forwards';
}

function siguientePalabra() {
    sonidoTransicion.play();
    vibrar(100);
    
    // Detener detección
    if (typeof detenerDeteccion === 'function') {
        detenerDeteccion();
    }
    
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
    }

    document.getElementById('boton-siguiente').classList.add('oculto');
    document.getElementById('mensaje-aliento').classList.remove('mostrar');

    const disponibles = modulos[moduloActual].filter(p => !palabrasUsadas.includes(p));

    if (disponibles.length === 0) {
        mostrarPantallaFinal();
        return;
    }

    cambiarEtapa('etapa-camara', 'etapa-presentacion');
    cargarPalabra();
}

// Tu función mostrarPantallaFinal (ya optimizada en la respuesta anterior, pero concisa)

function mostrarPantallaFinal() {
    sonidoConfeti.play();
    lanzarConfeti();
    
    const video = document.getElementById('video-camara');
    
    // Detener y limpiar el stream de video
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
    }

    if (video) {
        try {
            video.pause();
            video.srcObject = null;
            video.removeAttribute('src'); 
            video.load(); 
            // Ocultar estrictamente el video
            video.style.display = 'none'; 
            video.style.opacity = '0';
        } catch (e) {
            console.warn('Error limpiando video:', e);
        }
    }
    
    // Limpieza de UI de cámara
    if (document.getElementById('palabra-camara')) {
        document.getElementById('palabra-camara').textContent = '';
    }

    // Transición a la pantalla final
    cambiarEtapa('etapa-camara', 'etapa-final'); 
}

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================

function cambiarEtapa(etapaActual, etapaNueva) {
    document.getElementById(etapaActual).classList.remove('activa');
    
    setTimeout(() => {
        document.getElementById(etapaNueva).classList.add('activa');
    }, 300);
}

function vibrar(duracion) {
    if (navigator.vibrate) {
        navigator.vibrate(duracion);
    }
}

function lanzarConfeti() {
    if (typeof confetti !== 'undefined') {
        confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 }
        });

        setTimeout(() => {
            confetti({
                particleCount: 100,
                angle: 60,
                spread: 55,
                origin: { x: 0 }
            });
        }, 200);

        setTimeout(() => {
            confetti({
                particleCount: 100,
                angle: 120,
                spread: 55,
                origin: { x: 1 }
            });
        }, 400);
    }
}

function reiniciarNivel() {
    sonidoTransicion.play();
    palabrasUsadas = [];
    indiceActual = 0;
    
    // 1. Cambiar a la etapa de instrucciones (donde se pide la cámara)
    cambiarEtapa('etapa-final', 'etapa-instrucciones');
    
    // 2. Limpiar el estado de los permisos (ya que vamos a re-ejecutar)
    permisosCamaraOtorgados = false;
    
    // 3. Volver a ejecutar la lógica de verificación de permisos
    // Esto re-habilita el botón "Comenzar" y limpia el estado.
    // **IMPORTANTE:** Esto asume que tienes los contenedores de la etapa 1 listos.
    verificarYSolicitarPermisos();
}

function volverMenu() {
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
    }
    window.location.href = "SeleccionarModulo.html";
}

// ============================================
// LIMPIEZA AL SALIR
// ============================================

window.addEventListener('beforeunload', () => {
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
    }
});

document.addEventListener('visibilitychange', () => {
    if (document.hidden && videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
    }
});