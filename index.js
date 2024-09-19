import axios from "axios";
import * as cheerio from 'cheerio';
import fs from "fs";
import { createTransport } from 'nodemailer';
import "dotenv/config";
import cron from 'node-cron';
import express from 'express';

const app = express();

// URL del sitio web
const urlDepor3 = "https://www.depor3.com";

// Función para obtener los últimos titulares y enlaces
async function obtenerTitulares() {
  console.log("Obteniendo titulares...");
  try {
    const response = await axios.get(urlDepor3);
    const $ = cheerio.load(response.data);

    const noticias = [];

    $(".cm-single-slide").each((index, element) => {
      if (index < 6) {
        // Obtener solo las últimas 5 noticias
        const category = $(element).find(".cm-post-categories").text().trim();
        console.log(category);
        const titulo = $(element).find(".cm-entry-title a").text().trim();
        const enlace = $(element).find(".cm-entry-title a").attr("href");
        noticias.push({ category, titulo, enlace });
      }
    });
    console.log(noticias);
    return noticias;
  } catch (error) {
    console.error("Error al obtener titulares:", error);
  }
}

const createEmoji = (category) => {
  switch (category) {
    case "Fútbol":
      return "⚽";
    case "Handball":
      return "🤾‍♀️";
    case "Natación":
      return "🏊‍♀️";
    case "Básquet":
    case "Basquet":
      return "🏀";
    case "Tenis":
      return "🎾";
    case "Rugby":
      return "🏉";
    case "Hockey":
      return "🏑";
    case "Footgolf":
    case "Golf":
      return "⛳";
    case "Atletismo":
      return "🤸‍♀️";
    case "Patín":
      return "⛸️";
    case "Ciclismo":
      return "🚴‍♂️";
    default:
      return "";
  }
};

const transporter = createTransport({
  service: 'gmail',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
});

async function enviarMensaje(titulares) {
  try {
    let mensaje =
      `🗞 Informate sobre el deporte de Río Tercero y zona.\n` +
      `🌐 ¡Ingresá a https://depor3.com!\n\n`;

    for (const titular of titulares) {
      mensaje += `${createEmoji(titular.category)} ${titular.titulo}\n${titular.enlace}\n\n`;
    }

    // fs.writeFileSync("./noticias.txt", mensaje, "utf-8");
    
    const gmailOptions = {
      from: process.env.EMAIL,
      to: process.env.EMAIL,
      subject: `Noticias - ${new Date().toLocaleDateString()}`,
      html: mensaje.replace(/\n/g, '<br>'), // Para que los saltos de línea se mantengan en el email
    };
    
    console.log("Enviando mensaje...");
    await transporter.sendMail(gmailOptions);
    console.log("✔ Mensaje enviado con éxito.");

    // console.log(mensaje);
  } catch (error) {
    console.error("Error al enviar mensaje:", error);
  }
}


// const proceso = async () => {
//   const titulares = await obtenerTitulares();
//   if (titulares.length > 0) {
//     await enviarMensaje(titulares);
//   } else {
//     console.log("No se encontraron titulares.");
//   }
// };

// proceso();

// Ejecutar la tarea los miércoles, jueves y sábados a las 18:00 horas
cron.schedule('0 18 * * 3,4,6', async () => {
  console.log('Ejecutando tarea programada...');
  const titulares = await obtenerTitulares();
  if (titulares.length > 0) {
    await enviarMensaje(titulares);
  } else {
    console.log("No se encontraron titulares.");
  }
});

app.get('/', (req, res) => {
  res.json({
    status: 'OK'
  })
})

const PORT = process.env.PORT || 8080;

app.listen(PORT, ()=>console.log(`Server ok en puerto ${PORT}`));

export default app;
