// ============================================
// DETECCIÓN DE SEÑAS CON MEDIAPIPE
// ============================================

let hands = null;
let camera = null;
let canvasCtx = null;
let videoElement = null;
let canvasElement = null;

let ultimosDatos = [];
let precisionActual = 0;
let umbralPrecision = 70;
let deteccionActiva = false;

// Patrones simplificados de señas
const patronesSenas = {
    // FAMILIA
    "papa": { tipo: "mano_unica", altura: "alta", dedosExtendidos: 2 },
    "mama": { tipo: "mano_unica", altura: "media", dedosExtendidos: 5 },
    "familia": { tipo: "dos_manos" },
    "hijo": { tipo: "mano_unica", altura: "media_baja" },
    "hombre": { tipo: "mano_unica", altura: "alta", dedosExtendidos: 1 },
    "mujer": { tipo: "mano_unica", altura: "media", dedosExtendidos: 5 },
    
    // EMOCIONES
    "alegre": { tipo: "facial_y_mano" },
    "triste": { tipo: "facial" },
    "enojado": { tipo: "facial" },
    "asustado": { tipo: "facial_y_mano" },
    "sorprendido": { tipo: "facial" },
    "nervioso": { tipo: "mano_unica", altura: "media" },
    "confundido": { tipo: "facial" },
    "avergonzado": { tipo: "facial_y_mano" },
    "decepcionado": { tipo: "facial" },
    
    // EXPRESIONES
    "buenos dias": { tipo: "mano_unica", altura: "alta" },
    "buenas noches": { tipo: "mano_unica", altura: "media" },
    "disculpa": { tipo: "mano_unica", altura: "media", dedosExtendidos: 5 }
};

function inicializarDeteccion() {
    videoElement = document.getElementById('video-camara');
    canvasElement = document.getElementById('canvas-output');
    
    if (!canvasElement) {
        console.error('Canvas no encontrado');
        return false;
    }
    
    canvasCtx = canvasElement.getContext('2d');
    
    hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });
    
    hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });
    
    hands.onResults(procesarResultados);
    deteccionActiva = true;
    return true;
}

let datosManos = null;

function procesarResultados(results) {
    datosManos = results;
    dibujarResultados();
    validarSena();
}

function dibujarResultados() {
    if (!canvasCtx || !videoElement || !canvasElement) return;
    
    canvasElement.width = videoElement.videoWidth || 1280;
    canvasElement.height = videoElement.videoHeight || 720;
    
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
    
    if (datosManos && datosManos.multiHandLandmarks) {
        for (const landmarks of datosManos.multiHandLandmarks) {
            drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
                color: '#00FF00',
                lineWidth: 3
            });
            drawLandmarks(canvasCtx, landmarks, {
                color: '#FF0000',
                lineWidth: 1,
                radius: 4
            });
        }
    }
    
    canvasCtx.restore();
}

function validarSena() {
    if (!palabraActual || !datosManos || !deteccionActiva) {
        actualizarPrecision(0);
        return;
    }
    
    const patron = patronesSenas[palabraActual];
    if (!patron) {
        actualizarPrecision(50);
        return;
    }
    
    let precision = 0;
    
    if (patron.tipo === "mano_unica") {
        precision = validarManoUnica(patron);
    } else if (patron.tipo === "dos_manos") {
        precision = validarDosManos();
    } else {
        precision = validarPresenciaBasica();
    }
    
    ultimosDatos.push(precision);
    if (ultimosDatos.length > 10) {
        ultimosDatos.shift();
    }
    
    const precisionPromedio = ultimosDatos.reduce((a, b) => a + b, 0) / ultimosDatos.length;
    actualizarPrecision(Math.round(precisionPromedio));
}

function validarManoUnica(patron) {
    if (!datosManos.multiHandLandmarks || datosManos.multiHandLandmarks.length === 0) {
        return 0;
    }
    
    const mano = datosManos.multiHandLandmarks[0];
    let puntos = 30; // Base por tener mano visible
    
    // Validar altura
    if (patron.altura) {
        const muneca = mano[0];
        const alturaEsperada = {
            "alta": 0.25,
            "media": 0.5,
            "media_baja": 0.7
        }[patron.altura] || 0.5;
        
        const diferencia = Math.abs(muneca.y - alturaEsperada);
        if (diferencia < 0.2) puntos += 35;
        else if (diferencia < 0.35) puntos += 20;
    }
    
    // Validar dedos extendidos
    if (patron.dedosExtendidos) {
        const dedosExtendidos = contarDedosExtendidos(mano);
        const diferenciaDedos = Math.abs(dedosExtendidos - patron.dedosExtendidos);
        if (diferenciaDedos === 0) puntos += 35;
        else if (diferenciaDedos === 1) puntos += 20;
    } else {
        puntos += 35;
    }
    
    return Math.min(puntos, 100);
}

function validarDosManos() {
    if (!datosManos.multiHandLandmarks) return 0;
    
    const numManos = datosManos.multiHandLandmarks.length;
    if (numManos === 2) return 80 + Math.random() * 20;
    if (numManos === 1) return 40;
    return 0;
}

function validarPresenciaBasica() {
    if (datosManos && datosManos.multiHandLandmarks && datosManos.multiHandLandmarks.length > 0) {
        return 60 + (Math.random() * 20);
    }
    return 0;
}

function contarDedosExtendidos(mano) {
    let count = 0;
    const dedos = [
        { tip: 4, pip: 2 },   // Pulgar
        { tip: 8, pip: 6 },   // Índice
        { tip: 12, pip: 10 }, // Medio
        { tip: 16, pip: 14 }, // Anular
        { tip: 20, pip: 18 }  // Meñique
    ];
    
    dedos.forEach(dedo => {
        if (mano[dedo.tip].y < mano[dedo.pip].y) count++;
    });
    
    return count;
}

function actualizarPrecision(precision) {
    precisionActual = precision;
    
    const barra = document.getElementById('barra-progreso');
    const texto = document.getElementById('texto-precision');
    
    if (barra && texto) {
        barra.style.width = `${precision}%`;
        texto.textContent = `${precision}%`;
        
        barra.className = 'barra-progreso';
        if (precision < 40) {
            barra.classList.add('bajo');
        } else if (precision < 70) {
            barra.classList.add('medio');
        } else {
            barra.classList.add('alto');
        }
        
        if (precision >= umbralPrecision) {
            const botonSiguiente = document.getElementById('boton-siguiente');
            if (botonSiguiente && botonSiguiente.classList.contains('oculto')) {
                setTimeout(() => {
                    mostrarBotonSiguiente();
                    if (precision >= 85) {
                        mostrarMensajeAliento();
                        if (typeof sonidoConfeti !== 'undefined') sonidoConfeti.play();
                        if (typeof lanzarConfeti === 'function') lanzarConfeti();
                    }
                }, 500);
            }
        }
    }
}

async function iniciarCamaraConDeteccion() {
    try {
        if (!inicializarDeteccion()) {
            throw new Error('No se pudo inicializar la detección');
        }
        
        console.log('Detección inicializada, esperando stream de video...');
        
        await new Promise((resolve) => {
            const checkVideo = setInterval(() => {
                if (videoElement.readyState >= 2) {
                    clearInterval(checkVideo);
                    resolve();
                }
            }, 100);
        });
        
        console.log('Video listo, iniciando procesamiento...');
        
        camera = new Camera(videoElement, {
            onFrame: async () => {
                if (deteccionActiva) {
                    await hands.send({image: videoElement});
                }
            },
            width: 1280,
            height: 720
        });
        
        await camera.start();
        console.log('✅ Detección de señas activa');
        
    } catch (error) {
        console.error('Error al iniciar detección:', error);
        deteccionActiva = false;
    }
}

function detenerDeteccion() {
    deteccionActiva = false;
    ultimosDatos = [];
    
    if (camera) {
        camera.stop();
        camera = null;
    }
    
    if (canvasCtx && canvasElement) {
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    }
    
    console.log('Detección detenida');
}