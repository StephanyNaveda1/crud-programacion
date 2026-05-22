// 1. Importar el framework Express
const express = require('express');
const fs = require("fs")

function leerbd() {
    let textJson = fs.readFileSync("bd.json", "utf8")
    pacientes = JSON.parse(textJson).pacientes
    return pacientes
}
function guardarbd() {
    let obj = JSON.stringify({ pacientes: pacientes }, null, 2)
    fs.writeFileSync("bd.json", obj)
}

function existePaciente(ci) {
    return pacientes.some(paciente => paciente.ci == ci);
}

function buscarPaciente(ci) {
    return pacientes.find(paciente => paciente.ci == ci);
}

function modificarPaciente(ci,nombre,direccion,sintomas){
        let paciente = buscarPaciente(ci);
        paciente.nombre=nombre
        paciente.direccion=direccion
        paciente.sintomas=sintomas;
}

function eliminarPaciente(ci) {
        let i = pacientes.findIndex(paciente => paciente.ci == ci);
        if (i !== -1) {
            pacientes.splice(i, 1);
        }
}

// 2. Instanciar la aplicación (Crear el servidor)
const app = express();
let pacientes = [

]
// 3. Configurar Middleware para servir archivos estáticos (Fase 1 de la arquitectura)
// Esto le dice al servidor: "Si alguien pide un archivo HTML o CSS, búscalo en la carpeta 'public'"
app.use(express.static('public'));

// Middleware para leer los datos que vienen de un formulario HTML (req.body)
app.use(express.urlencoded({ extended: true }));
// 4. Crear una Ruta Básica (Método GET)


// 5. Ejemplo de SSR Profesional usando un Motor de Plantillas (EJS)
// Pre-configuración necesaria:
app.set('view engine', 'ejs');

// --- NUEVO: FORMULARIO ---

// 1. Ruta para MOSTRAR el formulario HTML
app.get('/nuevo-paciente', (req, res) => {
    res.render('formulario');
});

// 2. Ruta (Endpoint POST) para RECIBIR y guardar los datos
app.post('/guardar-paciente', (req, res) => {
    leerbd(); // Leemos la base de datos actual
    
    // Extraemos los datos que el usuario escribió en el formulario
    let ci = Number(req.body.ci);
    let nombre = req.body.nombre;
    let direccion = req.body.direccion;
    let horaIngreso = new Date().toLocaleTimeString();
    
    // Guardamos en el arreglo y luego en el archivo JSON
    pacientes.push({ ci: ci, nombre: nombre, direccion:direccion, horaIngreso:horaIngreso });
    guardarbd();
    
    // Renderizamos la nueva vista de éxito
    res.render('exito', { ci: ci, nombre: nombre, direccion:direccion, horaIngreso:horaIngreso });
});

//ruta para modificar un paciente
app.get('/modificar-paciente', (req, res) => {
    res.render('formularioModificar');
});

//ruta (Endpoint POST) para RECIBIR y cambiar los datos
app.post('/cambiar-paciente', (req, res) => {
    leerbd(); // Leemos la base de datos actual
    
    // Extraemos los datos que el usuario escribió en el formulario
    let ci = Number(req.body.ci);
    let nombre = req.body.nombre;
    let direccion = req.body.direccion;
    let sintomas = req.body.sintomas;

    modificarPaciente(ci, nombre, direccion, sintomas)
    guardarbd();
    
    // Renderizamos la nueva vista de éxito
    res.render('exitoModificar', { ci: ci, nombre: nombre, direccion:direccion});
});


//ruta para eliminar paciente
app.get('/eliminar-paciente', (req, res) => {
    res.render('formularioEliminar');
});

//ruta (Endpoint POST) para RECIBIR y eliminar los datos
app.post('/borrar-paciente', (req, res) => {
    leerbd(); // Leemos la base de datos actual
    
    // Extraemos los datos que el usuario escribió en el formulario
    let ci = Number(req.body.ci);
    
    eliminarPaciente(ci);

    guardarbd();
    
    // Renderizamos la nueva vista de éxito
    res.render('exitoEliminar', { ci: ci});
});


// 6. Encender el servidor y ponerlo a escuchar en un puerto de red
const PUERTO = 3000;
app.listen(PUERTO, () => {
    console.log(`Servidor de la UPTT corriendo en http://localhost:${PUERTO}`);
});
