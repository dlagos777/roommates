const nodemailer = require("nodemailer");

const enviar = (nombre, descripcion, monto) => {
    return new Promise((resolve, reject) => {

        let email = "mailernode97@gmail.com";
        let pass = "vqduzfbbciqgrtko";

        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: email,
                pass: pass
            },
            tls: {
                rejectUnauthorized: false
            }
        })

        let mailOptions = {
            from: email,
            replyTo: "no-reply@gmail.com",
            to: [
                'dlagos777@gmail.com', 'dyloud777@gmail.com', 'mailernode97@gmail.com'
            ],
            subject: `¡Se ha agregado un nuevo gasto!.`,
            text: `Los Roommates: ${nombre}\nHan realizado nuevos gastos de:\n${descripcion}\nPor un monto de: $${monto} c/u.`
        }

        transporter.sendMail(mailOptions, (error, data) => {
            if (error) {
                console.log(error);
                reject("Falló envio de correo electronico")
            } else {
                alert("Correo enviado con exito")
                resolve("Correo enviado con exito")
            }
        })
    })
}

module.exports = enviar