// 1. Importar el framework Express y File System
const express = require('express');
const fs = require("fs");

let estudiantes = [];
let calificaciones = [];

// Función para leer la base de datos JSON
function leerbd() {
    try {
        let textJson = fs.readFileSync("bd.json", "utf8");
        let data = JSON.parse(textJson);
        estudiantes = data.estudiantes || [];
        calificaciones = data.calificaciones || [];
    } catch (e) {
        estudiantes = [];
        calificaciones = [];
    }
}

// Función para guardar en la base de datos JSON
function guardarbd() {
    let obj = JSON.stringify({ estudiantes: estudiantes, calificaciones: calificaciones }, null, 2);
    fs.writeFileSync("bd.json", obj);
}

// Funciones auxiliares
function existeEstudiante(ci) {
    return estudiantes.some(estudiante => estudiante.ci == ci);
}

// Buscar por ci
function buscarEstudiante(ci) {
    return estudiantes.find(estudiante => estudiante.ci == ci);
}

function buscarCalificaciones(ci) {
    return calificaciones.find(calif => calif.ci == ci);
}

function modificarEstudiante(ci, nombre, apellido) {
    let estudiante = buscarEstudiante(ci);
    if (estudiante) {
        estudiante.nombre = nombre;
        estudiante.apellido = apellido;
    }
}

function modificarCalificaciones(ci, nota1, nota2, nota3, nota4) {
    let calif = buscarCalificaciones(ci);
    if (calif) {
        calif.nota1 = nota1;
        calif.nota2 = nota2;
        calif.nota3 = nota3;
        calif.nota4 = nota4;
    } else {
        calificaciones.push({ ci: ci, nota1: nota1, nota2: nota2, nota3: nota3, nota4: nota4 });
    }
}

function eliminarEstudiante(ci) {
    // Eliminar estudiante
    let i = estudiantes.findIndex(estudiante => estudiante.ci == ci);
    if (i !== -1) {
        estudiantes.splice(i, 1);
    }
    // Eliminar calificaciones (Eliminación en cascada)
    let j = calificaciones.findIndex(calif => calif.ci == ci);
    if (j !== -1) {
        calificaciones.splice(j, 1);
    }
}

// 2. Instanciar la aplicación (Crear el servidor)
const app = express();

// 3. Configurar Middleware para servir archivos estáticos
app.use(express.static('public'));

// Middleware para leer los datos que vienen de un formulario HTML (req.body)
app.use(express.urlencoded({ extended: true }));

// 5. Configurar el motor de plantillas EJS
app.set('view engine', 'ejs');

// --- RUTAS DE LA APLICACIÓN ---

// 1. Registrar Estudiante (GET)
app.get('/nuevo-estudiante', (req, res) => {
    res.render('formulario');
});

// 2. Guardar Estudiante (POST)
app.post('/guardar-estudiante', (req, res) => {
    leerbd(); // Leer BD actual
    
    let ci = Number(req.body.ci);
    let nombre = req.body.nombre;
    let apellido = req.body.apellido;
    
    // Validación de Cédula Única
    if (existeEstudiante(ci)) {
        return res.render('error', { mensaje: `La cédula ${ci} ya se encuentra registrada para otro estudiante.` });
    }
    
    // Guardar estudiante
    estudiantes.push({ ci: ci, nombre: nombre, apellido: apellido });
    
    // Inicializar calificaciones en 0 (valores por defecto)
    calificaciones.push({ ci: ci, nota1: 0, nota2: 0, nota3: 0, nota4: 0 });
    
    guardarbd();
    
    res.render('exito', { ci: ci, nombre: nombre, apellido: apellido });
});

// 3. Ver todos los estudiantes (GET)
app.get('/ver-estudiantes', (req, res) => {
    leerbd();
    
    // Combinar estudiantes con sus calificaciones correspondientes
    let listaEstudiantes = estudiantes.map(est => {
        let cal = buscarCalificaciones(est.ci) || { nota1: 0, nota2: 0, nota3: 0, nota4: 0 };
        return {
            ci: est.ci,
            nombre: est.nombre,
            apellido: est.apellido,
            nota1: cal.nota1,
            nota2: cal.nota2,
            nota3: cal.nota3,
            nota4: cal.nota4
        };
    });
    
    res.render('verEstudiantes', { estudiantes: listaEstudiantes });
});

// 4. Modificar Estudiante (GET)
app.get('/modificar-estudiante', (req, res) => {
    res.render('formularioModificar');
});

// 5. Cambiar Datos de Estudiante (POST)
app.post('/cambiar-estudiante', (req, res) => {
    leerbd();
    
    let ci = Number(req.body.ci);
    let nombre = req.body.nombre;
    let apellido = req.body.apellido;
    
    // Validar si existe
    if (!existeEstudiante(ci)) {
        return res.render('error', { mensaje: `El estudiante con la cédula ${ci} no existe.` });
    }
    
    modificarEstudiante(ci, nombre, apellido);
    guardarbd();
    
    res.render('exitoModificar', { ci: ci, nombre: nombre, apellido: apellido });
});

// 6. Eliminar Estudiante (GET)
app.get('/eliminar-estudiante', (req, res) => {
    res.render('formularioEliminar');
});

// 7. Borrar Estudiante (POST)
app.post('/borrar-estudiante', (req, res) => {
    leerbd();
    
    let ci = Number(req.body.ci);
    
    if (!existeEstudiante(ci)) {
        return res.render('error', { mensaje: `El estudiante con la cédula ${ci} no existe.` });
    }
    
    eliminarEstudiante(ci);
    guardarbd();
    
    res.render('exitoEliminar', { ci: ci });
});

// 8. Calificar Estudiante - Dos Pasos (GET)
app.get('/calificar-estudiante', (req, res) => {
    let ci = req.query.ci;
    if (!ci) {
        // Paso 1: Mostrar formulario para buscar por cédula
        return res.render('formularioCalificarBuscar');
    }
    
    // Paso 2: Mostrar formulario de notas precargadas
    leerbd();
    ci = Number(ci);
    let estudiante = buscarEstudiante(ci);
    if (!estudiante) {
        return res.render('error', { mensaje: `El estudiante con la cédula ${ci} no existe en el sistema.` });
    }
    
    let calif = buscarCalificaciones(ci) || { nota1: 0, nota2: 0, nota3: 0, nota4: 0 };
    
    res.render('formularioCalificar', {
        ci: ci,
        nombre: estudiante.nombre,
        apellido: estudiante.apellido,
        nota1: calif.nota1,
        nota2: calif.nota2,
        nota3: calif.nota3,
        nota4: calif.nota4
    });
});

// 9. Guardar Calificaciones de Estudiante (POST)
app.post('/guardar-calificaciones', (req, res) => {
    leerbd();
    
    let ci = Number(req.body.ci);
    let nota1 = Number(req.body.nota1);
    let nota2 = Number(req.body.nota2);
    let nota3 = Number(req.body.nota3);
    let nota4 = Number(req.body.nota4);
    
    if (!existeEstudiante(ci)) {
        return res.render('error', { mensaje: `El estudiante con la cédula ${ci} no existe en el sistema.` });
    }
    
    // Validar notas (0 a 20)
    if ([nota1, nota2, nota3, nota4].some(nota => isNaN(nota) || nota < 0 || nota > 20)) {
        return res.render('error', { mensaje: "Las calificaciones deben ser números válidos entre 0 y 20 puntos." });
    }
    
    modificarCalificaciones(ci, nota1, nota2, nota3, nota4);
    guardarbd();
    
    let estudiante = buscarEstudiante(ci);
    
    res.render('exitoCalificaciones', {
        ci: ci,
        nombre: estudiante.nombre,
        apellido: estudiante.apellido,
        nota1: nota1,
        nota2: nota2,
        nota3: nota3,
        nota4: nota4
    });
});

// 10. Encender el servidor
const PUERTO = 3000;
app.listen(PUERTO, () => {
    console.log(`Servidor de la UPTT corriendo en http://localhost:${PUERTO}`);
});
