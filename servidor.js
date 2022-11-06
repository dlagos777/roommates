const http = require('http')
const url = require('url')
const fs = require('fs')
const { v4: uuidv4 } = require('uuid')

const { newUser, addroommate, addGasto, modGasto } = require('./roommates.js')
const enviar = require('./mailer.js')

const PORT = 3000

http
    .createServer(async (req, res) => {

        //Se especifica ruta principal y metodo
        //Se utiliza fs para manipulacion de archivo index
        if ((req.url == '/') && (req.method == 'GET')) {

            //Se capturan los errores con Try Catch
            try {
                res.setHeader('content-type', 'text/html')
                res.end(fs.readFileSync('index.html', 'utf-8'))    
            } catch (error) {
                res.statusCode = 500;
                res.end("error", error)
            }
        }

        //Se parsea archivo roommates.json
        let roommatesJSON = JSON.parse(fs.readFileSync("roommates.json", "utf-8"))
        let roommates = roommatesJSON.roommates

        if ((req.url == '/roommates') && (req.method == 'GET')) {

            try {
                res.setHeader('content-type', 'application/json')
                //Se utiliza fs para devolver roommates almacenados
                res.end(fs.readFileSync('roommates.json', 'utf-8'))   
            } catch (error) {
                res.statusCode = 500;
                res.end();
                console.log("Error al registrar el Roommate", error)
            }
        }
        //Se almacena un nuevo roommate con metodo POST
        else if (req.url.includes('/roommate') && req.method == 'POST') {

            res.setHeader('content-type', 'application/json')

            newUser().then(async (roommate) => {
                addroommate(roommate)
                res.writeHead(201).end(JSON.stringify(roommate))
            })
                .catch((error) => {res.writeHead(500).end("Error al agregar usuario.", error)})
        }
        //Se elimina el gasto del roommate con metodo DELETE
        else if (req.url.includes("/roommates") && req.method == "DELETE") {

            try {
                //Se parsea y se filtra usuario por id
                const { id } = url.parse(req.url, true).query
                roommatesJSON.roommates = roommates.filter((i) => i.id !== id)
                fs.writeFileSync("roommates.json", JSON.stringify(roommatesJSON))
                res.writeHead(200).end("Gasto eliminado.")
            } catch (error) {
                res.statusCode = 500;
                res.end("Error al eliminar el gasto", error)
            }
        }

        //Se registran gastos 
        let gastosJSON = JSON.parse(fs.readFileSync('gastos.json', 'utf-8'))
        let gastos = gastosJSON.gastos

        //Se devuelve el historial con los gastos registrados
        if (req.url.includes('/gastos') && req.method == 'GET') {
            try {
                res.end(JSON.stringify(gastosJSON))  
            } catch (error) {
                res.statusCode = 500;
                res.end("error",error)
            }
        }
        //Agrega gastos asociados al usuario
        else if (req.url.includes('/gasto') && req.method == 'POST') {
            let data = "";
            req.on('data', (payload) => {
                data += payload
            })
            req.on('end', () => {
                body = JSON.parse(data)
                gasto = {
                    //El objeto correspondiente al usuario que se almacenará debe tener un id generado con el paquete UUID
                    id: uuidv4().slice(20),
                    roommate: body.roommate,
                    descripcion: body.descripcion,
                    monto: body.monto
                }
                gastos.push(gasto)
                addGasto(body)
                let roommate = JSON.parse(fs.readFileSync("roommates.json", "utf-8"))
                let datosRm = roommate.roommates
                let nombre = gastos.map((r) => r.roommate)
                let descripcion = gastos.map((r) => r.descripcion)
                let monto = gastos.map((r) => r.monto)
                let correos = datosRm.map((r) => r.correo)

                //Ocupar el módulo File System para la manipulación de archivos alojados en el servidor
                //Envío de correos electrónicos
                enviar(nombre, descripcion, monto, correos)
                    .then(() => {
                        res.end()
                    })
                    .catch((error) => {
                        res.writeHead(500).end("Envío de correo electrónico fallido.", error)
                    })
                fs.writeFileSync("gastos.json", JSON.stringify(gastosJSON))
                res.writeHead(201).end("Los gastos han sido creados.")
            })
        }
        //Edita los datos de un gasto
        else if (req.url.includes('/gasto') && req.method == 'PUT') {

            let data = ""
            const { id } = url.parse(req.url, true).query
            req.on("data", (payload) => {
                data += payload
            })
            req.on("end", () => {
                let body = JSON.parse(data)
                body.id = id
                modGasto(body)
                gastosJSON.gastos = gastos.map((i) => {
                    if (i.id != body.id) {
                        return i
                    }
                    return body
                })
                fs.writeFileSync("gastos.json", JSON.stringify(gastosJSON), (err) => {
                    err ? console.log('Error. Ingreso de gastos.') : console.log('Ingreso de gastos exitoso.')
                })
                res.writeHead(201).end("Gastos actualizados.")
            })
        }
        //Se elimina gasto del historial.
        else if (req.url.includes("/gasto") && req.method == "DELETE") {

            try {
                const { id } = url.parse(req.url, true).query
                gastosJSON.gastos = gastos.filter((i) => i.id !== id)
                fs.writeFileSync("gastos.json", JSON.stringify(gastosJSON))
                res.writeHead(200).end("Gasto eliminado exitosamente")
            } catch (error) {
                res.statusCode = 500;
                res.end("Error al eliminar el gasto", error)
            }
        }
    })
    .listen(PORT, () => console.log("SERVER ON","http://localhost:"+PORT))