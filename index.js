// este app esta en https://chat-wpc.herokuapp.com/webhook
// para pruebas cambiar config_test y esta en heroku con juan.c...gmail.com y la app es chat-wpc 
// para produccion cambiar config_test y esta en heroku con monitor@heros.com.ve y la app es  https://chat-cajas.herokuapp.com/webhook 
// y despues del 15 de cada mes en dialogflow https://conversacion.herokuapp.com/webhook con promo...@gma
const uuid = require('uuid');
const wppconnect = require('@wppconnect-team/wppconnect');
const express = require('express')
// var express = require('express')
// , cors = require('cors')
// , app = express();
const app = express()
const {WebhookClient} = require('dialogflow-fulfillment');
const url_api = "https://www.heros.com.ve/cajaapp/api/";
const axios = require('axios');

const { phoneNumberFormatter } = require('./helpers/formatter');

const dialogflow = require('./dialogflow');

const chequea_token = require('./chequear_token.js');

const sessionIds = new Map();

const PORT = process.env.PORT || 3000;


// const log = require("log");


const gtts = require('gtts')
// Imports the Google Cloud client library
// const textToSpeech = require('@google-cloud/text-to-speech');
// Creates a client
// const client_voice = new textToSpeech.TextToSpeechClient();


// Import other required libraries
const util = require('util');

var total_ahorros = 0;
var total_prestamos = 0;
var total_fianzas = 0;
var idempresa = "";
var lacedula = "";
var cuento2 = "ℹ️ Si desea información más detallada ";
var botones = [];
var instance; //variable that the client will receive to be called in other lib functions
var obtuverespuesta = "0";
var cuento_audio ='';
var cuento_audio_cobranza = '';


var mantenimiento = 1;
const telefono_personal = process.env.telefono_personal || 0;

// const errorLog = require('./util/logger').errorlog;
// const successlog = require('./util/logger').successlog;
// const logger = require('./util/logger').logger;


// logger.info('Revisando token');
const fs = require('fs'); // used to read files

const ARCHIVO_TOKEN = './tokens/whatsbot.data.json';
const ARCHIVO_TOKEN_BACKUP = './tokens/whatsbot.data_backup.json';

// let hacer_chequeo = 'Si'; // en  NO para generar qr SI para copiar
let hacer_chequeo = 'No'; // en  NO para generar qr SI para copiar

if (hacer_chequeo == 'Si')
{
  let chequear = chequea_token.revisar_token();
  // console.log('chequear ',chequear)

    if (! fs.existsSync(ARCHIVO_TOKEN)) 
    {
      fs.copyFile(ARCHIVO_TOKEN_BACKUP, ARCHIVO_TOKEN, (err) => {
        if (err) throw err;
          console.log(ARCHIVO_TOKEN_BACKUP + ' was copied to '+ARCHIVO_TOKEN);
      });
      // no existe token, copio el backup
      // try {
      //   fs.copyFile(ARCHIVO_TOKEN_BACKUP, ARCHIVO_TOKEN);
      //   console.log(ARCHIVO_TOKEN + ' was copied to '+ARCHIVO_TOKEN_BACKUP);
      // } catch (error) {
      //   console.log('The file could not be copied ',error);
      // }    
    }
  // logger.info('Fin revision token');
}


/*
// https://ttsmp3.com/
*/

wppconnect.create({
    session: 'whatsbot',
    autoClose: false,
    // restartOnAuthFail: true,
    // puppeteerOptions: { args: ['--no-sandbox'] }
    // const browser = await puppeteer.launch({
    puppeteerOptions: {
    'args' : [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process', // <- this one doesn't works in Windows
      '--disable-gpu'
    ]
  }
// });
})
  .then((client) => start(client))
  .catch((erro) => {
    console.log('-------------------- sali por error ------------------')
    console.log(erro);
});


app.get('/', function (req, res) {
  res.send('Ejecutando ChatBot para Caja de Ahorro')
});


app.post('/webhook', express.json(), function (req, res) {
  webhook(req, res);
});

var bodyParser = require("body-parser");
// app.use(cors());
const cors = require('cors');
app.use(cors({
    // origin: 'https://www.heros.com.ve',
    origin: '*',
    methods: ['GET','POST']
    // origin: 'https://www.heros.com.ve/cajaapp/api/web-ws/',
    // methods: ['GET','POST','DELETE','UPDATE','PUT','PATCH']
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/send-message', async function (req, res, next) {

    const url = 'https://www.heros.com.ve/cajaapp/api/web-ws/';
    //parameters coming in the request
    var number = phoneNumberFormatter(req.body.number);
    // var number = (req.body.number);
    // var message = spin(req.body.message);
    var message = (req.body.message);
    var enviar_imagen = (req.body.enviar_imagen);
    var idempresa = (req.body.idempresa);
    var imagen = url + req.body.imagen;
    // console.log('enviar_imagen ',enviar_imagen, 'la imagen ',imagen)
    //***********/

    var return_message =''; //request return message
    var success = false; //If the request was successful
    var return_object;

    const executa = async()=>{

            if (typeof(instance) === "object"){ //Validating if lib is started
                status = await instance.getConnectionState(); //whats connection status validated 
                                                                
                if(status === 'CONNECTED'){
                    let numberExists = await instance.checkNumberStatus(number);  //Validating if the number exists
                 
                    if(numberExists.canReceiveMessage===true){
                        if (message.length > 0)
                         await instance
                              .sendText(numberExists.id._serialized, 'Información enviada desde '+idempresa + '\n\n'+message)
                              // .sendText(numberExists.id._serialized, message)
                              .then((result) => {
                                  //console.log('Result: ', result); //return object success
                                  success=true;
                                  return_message=result.id;
                              })
                              .catch((erro) => {
                                  console.error('Error when sending: ', erro); //return object error
                              });
                        else 
                          await instance
                            .sendText(numberExists.id._serialized, '_Información enviada desde_ *'+idempresa+'*')
                            // .sendText(numberExists.id._serialized, message)
                            .then((result) => {
                                //console.log('Result: ', result); //return object success
                                success=true;
                                return_message=result.id;
                            })
                            .catch((erro) => {
                                console.error('Error when sending: ', erro); //return object error
                            });
                        if (enviar_imagen == true)
                        {
                          await instance
                            .sendImage(numberExists.id._serialized, 
                              imagen,
                              '', '')
                            .then((result) => {
                                //console.log('Result: ', result); //return object success
                                success=true;
                                return_message=result.id;
                            })
                            .catch((erro) => {
                                console.error('Error when sending: ', erro); //return object error
                            });
                        }

                    }else{
                        return_message='The number is not registered.';
                    }
                }else{                          
                    return_message = 'Validate your internet connection or QRCODE';
                }
            }else{
                return_message = 'The instance was not initialized';               
            }
            return_object = {
                status : success,
                message :return_message,           
            };
            res.send(return_object); 
    };
    executa();

  });


function webhook(req, res)
{
  const agent = new WebhookClient({ request: req, response:res });
  // plog.info('req.headers',JSON.stringify(req.headers));
  // plog.info('body ',JSON.stringify(req.body));
  // console.log('Dialogflow Request headers: ' + JSON.stringify(req.headers));
  // console.log('Dialogflow Request body: ' + JSON.stringify(req.body));
 
  function welcome(agent) {
    agent.add(`Welcome to my agent!`);
  }
 
  function fallback(agent) {
    agent.add(`I didn't understand`);
    agent.add(`I'm sorry, can you try again?`);
  }

  function probarwebhook(agent) {
    agent.add(`Esta en agente`);
  }
  
  function PedirCedula(agent)
  {
    console.log('estoy en PedirCedula');
    const cedula = agent.parameters.number;
    // parametros
    const parametros = {"cedula":cedula};
    const headers = {"content-type": "application/json"};
    
    // const url = url_api + "resumen_socio.php?cedula="+cedula;
    const url = url_api + "resumen_socio.php";

    return axios.post(url, parametros, headers).
    then ((response) =>
    {
          console.log('respuesta antes del parse');
          response.data.map((wordObj) => {
            // console.log('wordObj', wordObj);
            // nombre = wordObj.usuario.nombre;
            let informacion = JSON.parse(JSON.stringify(wordObj));
            // console.log(informacion)
            if (informacion.respuesta == 200)
            {
              sleep(3)
              let usuario = informacion.usuario;
              // console.log(informacion.usuario)
              // agent.add("Bienvenido(a) *" + usuario.nombre+"*");

              let mensajes = 5;

              // agent.add(QuickReplies(quick_replies=['Happy :)', 'Sad :(']));
              if (telefono_personal == 1)
                agent.add('🚨 Disculpe, si recibe este mensaje estoy realizando pruebas con ChatBot, _no se alarme_ mas tarde le contacto 🚨\n')
              if (usuario.servicio_whatsapp == 'No')
                agent.add('\n\n🚧 Saludos, le estare ofreciendo información limitada puesto que no tiene servicio contratado 🚧\n\n');
              if (usuario.servicio_whatsapp_prueba == 'Si')
              {
                mantenimiento = 1;
                agent.add('🚧 Estamos realizando cambios en la plataforma. 🚧\n🚧 La información que reciba puede ser incorrecta 🚧\n')
              }

              var obtuverespuesta = "1"; 
              // console.log('obtuverespuesta en PedirCedula ', obtuverespuesta)

              idempresa = usuario.idempresa;
              // console.log('idempresa ',idempresa)

              if (idempresa == 'CAPUCLA')
              {
                cuento_audio = ' '
                encabeza_usuario(agent, "👋 Bienvenido(a)",usuario.nombre);
                agent.add("💳 Total Disponibilidad " + usuario.disponibilidads);
                cuento_audio += " Total Disponibilidad " + usuario.disponibilidads
                if (usuario.deuda_pendiente > 0)
                {
                  mensajes++;
                  agent.add("* ***TIENE CUOTAS PENDIENTE POR PAGAR*** *")
                  agent.add  ("=======================================")
                  cuento_audio += " TIENE CUOTAS PENDIENTE POR PAGAR" 
                  mensajes++;
                  agent.add("Por un monto de " + usuario.deuda_pendientes);
                  cuento_audio += " Por un monto de " + usuario.deuda_pendientes
                  mensajes++;
                  agent.add  ("=======================================")
                  agent.add("* ***TIENE CUOTAS PENDIENTE POR PAGAR*** *")
                  mensajes++;
                  agent.add("\n *Puede realizar el pago a cuenta de la institución, enviar el soporte de la transferencia por esta vía y seguir los pasos para _REPORTAR PAGO_*")
                  agent.add("\n *ESTA OPCIÓN ESTARÁ DISPONIBLE A PARTIR DEL LUNES 23/05/2022*")
                  agent.add("\n Si desea saber donde realizar el pago puede escribir DEPÓSITO BANCO\n")
                  // agent.add("\n En caso de duda consulte nuestro video ejemplo https://youtu.be/WcQQrshfu7g")

                  cuento_audio += "Puede realizar el pago a cuenta de la institución, enviar el soporte de la transferencia por esta vía y seguir los pasos para REPORTAR PAGO"
                  cuento_audio += "Si desea donde realizar el pago puede escribir DEPÓSITO BANCO"

                  cuento_audio_cobranza = 'Si en la consulta aparece reflejada una cuota rechazada considere la siguiente explicacion. ';
                  cuento_audio_cobranza += '1.- La cuota rechazada se deriva porque la cantidad de salario destinada para dicho descuento no cubre el monto en su totalidad y eso es debido a que lo último que se deduce es lo relacionado a la CAPUCLA, luego de descontar lo correspondiente a otras instituciones como por ejemplo. El IPSPUCO, generando esto una diferencia. ' 
                  cuento_audio_cobranza += '2.- Es necesario señalar que las cuotas enviadas al cobro aplicadas por la UCLA en algunos casos el disponible del asociado no es suficiente para la cancelación en su totalidad y en su recibo de nómina no se les hace la aclaratoria que el monto que allí se refleja es solo monto parcial a la cuota relacionada '
                  cuento_audio_cobranza += '3.- El remanente del disponible para el pago es abonado a la cuota pendiente por pagar lo que genera una diferencia que es el monto se les está cobrando denominada (cuotas rechazadas).'
                  cuento_audio_cobranza += '4.-El monto de la cuota allí reflejada debe ser en bolívares digitales y la no cancelación de la misma les impide la solicitud del nuevo préstamo.'
                }
              }
              else  
              {
                encabeza_usuario(agent, "👋 Bienvenido(a)",usuario.nombre);
                cuento_audio = 'Resumen Estado de Cuenta Actualizado al '+ usuario.ultima_actualizacion;
                agent.add("📰 *Resumen Estado de Cuenta* Actualizado al *"+ usuario.ultima_actualizacion+"*");
                // agent.add("-----------------------------------------" ); ⚖️
                agent.add("🏛️ Total Ahorros " + usuario.ahorros);
                cuento_audio += " Total Ahorros " + usuario.ahorros
                if (usuario.deuda_pres_cotidiano > 0)
                {
                  mensajes++;
                  agent.add("🧾 Total Préstamos " + usuario.deuda_pres_cotidianos);
                  cuento_audio += " Total Préstamos " + usuario.deuda_pres_cotidianos
                }
                if (usuario.deuda_pres_bonos > 0)
                {
                  mensajes++;
                  agent.add("🗳️ Total Préstamos con Bonos " + usuario.deuda_pres_bonoss);
                  cuento_audio += " Total Préstamos con Bonos " + usuario.deuda_pres_bonoss
                }
                if (usuario.fianzas_recibidas > 0)
                {
                  mensajes++;
                  agent.add("📊 Total Fianzas Recibidas " + usuario.fianzas_recibidass);
                  cuento_audio += " Total Fianzas Recibidas " + usuario.fianzas_recibidass
                }
                if (usuario.fianzas_otorgadas > 0)
                {
                  mensajes++;
                  agent.add("💰 Total Fianzas Otorgadas " + usuario.fianzas_otorgadass);
                  cuento_audio += " Total Fianzas Otorgadas " + usuario.fianzas_otorgadass
                }
                // agent.add("-----------------------------------------" );
                agent.add("💳 Total Disponibilidad " + usuario.disponibilidads);
                cuento_audio += " Total Disponibilidad " + usuario.disponibilidads
                // agent.add(" " );
                total_ahorros = usuario.ahorros;
                total_prestamos = usuario.deuda_pres_cotidiano+usuario.deuda_pres_bonos;
                total_fianzas = usuario.fianzas_recibidas+usuario.fianzas_otorgadas;
                lacedula = cedula;
                detalle(agent, (total_prestamos), (total_fianzas), total_ahorros);
              }
            }
            else 
              agent.add(informacion.mensaje);
            });
    });
  }

  function encabeza_usuario(agent, titulo, nombre)
  {
    let cuento = "*"+titulo+"* ";
    cuento = cuento + "_" + nombre + "_";
    agent.add(cuento);
  }

  function detalle(agent, prestamos, fiadores, ahorros)
  {
    /*
    let cuento = "ℹ️ Si desea información más detallada puede escribir *Ahorros*";
    if (parseFloat(prestamos) > 0)
      cuento = cuento + ", *Préstamos*";
    if (parseFloat(fiadores) > 0)
        cuento = cuento + ", *Fiadores*";
    cuento = cuento + " ó *Salir* para cerrar ésta sesión ";
    // agent.add(" " );
    */
    // agent.add(cuento);
    let cuento2 = "ℹ️ Si desea información más detallada ";
    var botones = [];
    if (parseFloat(ahorros) > 0)
    {
      cuento2 = cuento2 + " puede escribir *Ahorros*";
      botones.push({body: 'Ahorros'})
    }
    if (parseFloat(prestamos) > 0)
    {
      cuento2 = cuento2 + ", *Préstamos*";
      botones.push({body: 'Préstamos'})
    }
    if (parseFloat(fiadores) > 0)
    {
        cuento2 = cuento2 + ", *Fiadores*";
        botones.push({body: 'Fiadores'})
    }
    cuento2 = cuento2 + " ó *Salir* para cerrar ésta sesión ";
    cuento2='';
    botones.push({body: 'Salir'})
    // console.log(botones)
  }

  function DetalleAhorros(agent)
  {
    const cedula = lacedula; // agent.parameters.cedula;
    // logger.info('cedula que llego ',cedula)
    if (cedula != '')
    {
      const parametros = {"cedula":cedula};
      const headers = {"content-type": "application/json"};
      
      const url = url_api + "detalle_ahorros.php";

      return axios.post(url, parametros, headers).
      then ((response2) =>
      {
        // console.log(response2);
            response2.data.map((wordObj) => {
              let informacion = JSON.parse(JSON.stringify(wordObj));
              if (informacion.respuesta == 200)
              {
                let usuario = informacion.usuario;
                // console.log(informacion.usuario.nombre)
                // agent.add("*Detalle Ahorros* " + usuario.nombre);
                encabeza_usuario(agent, "🏛️ Detalle Ahorros",usuario.nombre);
                cuento_audio = "Detalle Ahorros"
                let retenciones = informacion.retenciones;
                agent.add(retenciones.titulo + ' al '+retenciones.fecha+ ': '+ retenciones.montos);
                cuento_audio = cuento_audio + retenciones.titulo + ' al '+retenciones.fecha+ ': '+ retenciones.montos
                retenciones = informacion.aportes;
                agent.add(retenciones.titulo + ' al '+retenciones.fecha+ ': '+ retenciones.montos);
                cuento_audio = cuento_audio + retenciones.titulo + ' al '+retenciones.fecha+ ': '+ retenciones.montos
                retenciones = informacion.extras;
                if (retenciones.monto > 0)
                {
                  agent.add(retenciones.titulo + ' al '+retenciones.fecha+ ': '+ retenciones.montos);
                  cuento_audio = cuento_audio + retenciones.titulo + ' al '+retenciones.fecha+ ': '+ retenciones.montos
                }
                retenciones = informacion.dividendos;
                if (retenciones.monto > 0)
                {
                  agent.add(retenciones.titulo + ' al '+retenciones.fecha+ ': '+ retenciones.montos);
                  cuento_audio = cuento_audio + retenciones.titulo + ' al '+retenciones.fecha+ ': '+ retenciones.montos
                }
                retenciones = informacion.otros;
                if (retenciones.monto > 0)
                {
                  agent.add(retenciones.titulo + ' al '+retenciones.fecha+ ': '+ retenciones.montos);
                  cuento_audio = cuento_audio + retenciones.titulo + ' al '+retenciones.fecha+ ': '+ retenciones.montos
                }
                agent.add("*Total Ahorros        " + usuario.total_ahorrado+'*');
                // detalle(agent, (total_prestamos), (total_fianzas), total_ahorros);
              }
              else 
                agent.add(informacion.mensaje);
              });
      });
    }
    else 
      agent.add('Lo siento mucho, no estoy capacitado para saber su número de cédula');
  }


  function DetallePrestamos(agent)
  {
    if (total_prestamos <= 0)
    {
      return agent.add("🚨 Disculpe, no posee *Préstamos* registrados actualmente");
      cuento_audio = "Disculpe, no posee *Préstamos* registrados actualmente"
    }
    // 🔴
    const cedula = lacedula; // agent.parameters.cedula;
    const parametros = {"cedula":cedula};
    const headers = {"content-type": "application/json"};
    
    const url = url_api + "detalle_prestamos.php";
    let cuento = "";

    return axios.post(url, parametros, headers).
    then ((response) =>
    {
      // console.log(response2);
          response.data.map((wordObj) => {
            let informacion = JSON.parse(JSON.stringify(wordObj));
            if (informacion.respuesta == 200)
            {
              let usuario = informacion.usuario;
              // console.log(usuario)
              // agent.add("*Detalle Préstamos* _" + usuario+"_");
              encabeza_usuario(agent, "🧾 Detalle Préstamos",usuario);

              cuento = 'Descripción | Saldo | CC-NC | Cuota';
              agent.add(cuento)
              // cuento_audio = cuento
              let prestamos = informacion.prestamos;
              prestamos.forEach(element => {
                // debugger
                // console.dir(element)
                cuento = element.descripcion+' | '+ element.saldo+' | '+ element.cuotas + ' | '+ element.cuota;
                agent.add(cuento)
                cuento_audio = cuento_audio + cuento
                // agent.add(retenciones.titulo + ' al '+retenciones.fecha+ ': '+ retenciones.monto);
                // var arr_from_json = JSON.parse(element);
                // for (var clave in arr_from_json) {
                //   if (arr_from_json[clave] === "true") {
                //     if (clave === "estadorPagoLinea") {
                //       debugger
                //       $("#datosLinea").show();
                //       $("#botonLinea").show();
                //       trans2 = true;
                //     }
              });
              detalle(agent, (total_prestamos), (total_fianzas), total_ahorros);
            }
            else 
              agent.add(informacion.mensaje);
            });
    });
  }

  function DetalleFiadores(agent)
  {
    if (total_fianzas <= 0)
      return agent.add("🚨 Disculpe, no posee *Fianzas* registradas actualmente");
    // 🔴
    const cedula = lacedula; // agent.parameters.cedula;
    const parametros = {"cedula":cedula};
    const headers = {"content-type": "application/json"};
    
    const url = url_api + "detalle_fiadores.php";
    let titulo = false;
    let cuento_titulo = "";
    let cuento = "";
    cuento_audio = '';

    return axios.post(url, parametros, headers).
    then ((response) =>
    {
      // console.log(response2);
          response.data.map((wordObj) => {
            let informacion = JSON.parse(JSON.stringify(wordObj));
            if (informacion.respuesta == 200)
            {
              let usuario = informacion.usuario;

              // console.log(informacion.usuario.nombre)
              // agent.add("*Detalle Fianzas Otorgadas* " + usuario.nombre);
              encabeza_usuario(agent, "💰 Detalle Fianzas Otorgadas",usuario.nombre);

              titulo = false;
              cuento_titulo = 'Préstamo | Socio Receptor | Saldo ';
              let fiadores = informacion.fiadores;
              // console.log(fiadores)
              fiadores.forEach(element => {
                // debugger
                // console.dir(element)
                if (element.codigo_otorgante == usuario.codigo)
                {
                  if (titulo == false)
                  {
                    agent.add(cuento_titulo);
                    titulo = true;
                  }

                  cuento = element.numero_prestamo+' | '+element.nombre+' | '+ element.saldo_fianza;
                  agent.add(cuento)
                }
                // agent.add(retenciones.titulo + ' al '+retenciones.fecha+ ': '+ retenciones.monto);
                // var arr_from_json = JSON.parse(element);
                // for (var clave in arr_from_json) {
                //   if (arr_from_json[clave] === "true") {
                //     if (clave === "estadorPagoLinea") {
                //       debugger
                //       $("#datosLinea").show();
                //       $("#botonLinea").show();
                //       trans2 = true;
                //     }
              });

              // console.log(informacion.usuario.nombre)
              // agent.add("*Detalle Fianzas Recibidas* " + usuario.nombre);
              encabeza_usuario(agent, "📊 Detalle Fianzas Recibidas",usuario.nombre);

              titulo = false;
              cuento_titulo = 'Préstamo | Socio Otorgante | Saldo ';
              fiadores.forEach(element => {
                // debugger
                // console.dir(element)
                if (element.codigo_receptor == usuario.codigo)
                {
                  if (titulo == false)
                  {
                    agent.add(cuento_titulo);
                    titulo = true;
                  }

                  cuento = element.numero_prestamo+' | '+element.nombre+' | '+ element.saldo_fianza;
                  agent.add(cuento)
                }
                // agent.add(retenciones.titulo + ' al '+retenciones.fecha+ ': '+ retenciones.monto);
                // var arr_from_json = JSON.parse(element);
                // for (var clave in arr_from_json) {
                //   if (arr_from_json[clave] === "true") {
                //     if (clave === "estadorPagoLinea") {
                //       debugger
                //       $("#datosLinea").show();
                //       $("#botonLinea").show();
                //       trans2 = true;
                //     }
              });
              detalle(agent, (total_prestamos), (total_fianzas), total_ahorros);
            }
            else 
              agent.add(informacion.mensaje);
            });
    });
  }

  
  let intentMap = new Map();
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Default Fallback Intent', fallback);
  intentMap.set('PedirCedula', PedirCedula);
  intentMap.set('probarwebhook', probarwebhook);
  intentMap.set('DetalleAhorrosIntent', DetalleAhorros);
  intentMap.set('DetallePrestamosIntent', DetallePrestamos);
  intentMap.set('DetalleFiadoresIntent', DetalleFiadores);

  // intentMap.set('responder_image', enviarImagen);

  agent.handleRequest(intentMap);

}

function start(client) {
    // console.log(client)
    var obtuverespuesta = "esta"; 
    // logger.info('Iniciando instancia');
    console.log('Iniciando instancia')
    instance = client; //It will be used in REST requests
    // logger.info('Creada instancia');
    console.log('Creada instancia');

    // logger.info('Iniciando Log');
    console.log('Iniciando log');
    const tiempoTranscurrido = Date.now();
    const hoy = new Date(tiempoTranscurrido);
    // logger.info(hoy.toUTCString());
    console.log(hoy.toUTCString());
    client.onMessage(async (message) => {
        console.log('from ',message.from, 'type ', message.type, 'body ', message.body, 'group ',message.isGroupMsg, 'broadcast ',message.broadcast)
        // logger.info('from ',message.from, 'type ', message.type, 'body ', message.body, 'group ',message.isGroupMsg, 'broadcast ',message.broadcast)
        // console.log('message ',message.from.substr(0,6))
        if (message.isGroupMsg == false)
          // if ((message.from.substr(0,6) != "status") && ((message.from == '584125150054@c.us') || (message.from == '584164532653@c.us'))) 
          if ((message.from.substr(0,6) != "status")) // && ((message.from == '584125150054@c.us'))) //  && (telefono_personal == 1)))
          {
            // console.log('entre por telefono_personal')
            await procesar_mensaje(message, client)
          }
          // else  
          // {
          //   console.log('entre por cualquier telefono ')
          //   await procesar_mensaje(message, client)
          // }
    });
}

async function procesar_mensaje(message, client)
{
    // if (message.from == '584125150054@c.us')
        if (
            ((message.type == 'chat') || (message.type == 'buttons_response')) && 
            (message.isGroupMsg == false) && 
            (message.broadcast == false)
            )
          {
              setSessionAndUser(message.from)
              // logger.info('antes del dialogflow ----------------------', message);
              let session = sessionIds.get(message.from);
              let payload = await dialogflow.sendToDialogFlow(message.body, session)
              // console.log('payload ----------------------', payload);

              // console.log('sesion ', session)
              // console.log('payload ',payload)
              try
              {
                  if (message.body == '!info') {
                      let info = await client.getHostDevice();
                      let cuento = `_*Connection info*_\n\n`;
                      cuento += `*User name:* ${info.pushname}\n`;
                      cuento += `*Number:* ${info.wid.user}\n`;
                      cuento += `*Battery:* ${info.battery}\n`;
                      cuento += `*Plugged:* ${info.plugged}\n`;
                      cuento += `*Device Manufacturer:* ${info.phone.device_manufacturer}\n`;
                      cuento += `*WhatsApp version:* ${info.phone.wa_version}\n`;
                      await SendMsgToWAUnique(client, message, cuento);
                  }
                  /*
                  if (message.body == '!send_audio_custom') {
                      // enviar_msg_audio(client, message)
                      const headers = {"content-type": "application/json"};
    
                      const url = url_api + "numeros_para_audio.php";
                      return axios.post(url, parametros, headers).
                      then ((response) =>
                      {
                        console.log('respuesta antes de audio');
                        // response.data.map((wordObj) => {
                        //   let informacion = JSON.parse(JSON.stringify(wordObj));
                        //   console.log(informacion)
                        // })
                      })

                      const loscelulares = [0]
                      for (cuantos  = 0; cuantos < loscelulares.length; cuantos++) {
                        loscelulares[cuantos]
                      }

                      let celular = usuario.celular
                      let cuento = `_*Información Importante de CAPUCLA*_ para el asociado Cedula xxxx \n`;
                      console.log('el celular ',celular)
                      message.from = '+584145268967'

                      SendMsgToWAUnique(client, message, cuento);

                      completo = 'https://www.heros.com.ve/cajaapp/audios/presentacion.mp3'

                      await client
                        .sendFile(
                          '+584145268967',
                          completo,
                          'respuesta',
                          ''
                        )
                        .then((result) => {
                          // console.log('Result: ', result); //return object success
                          // fs.unlinkSync('./'+textoresponseaudio)
                        })
                        .catch((erro) => {
                          console.error('Error when sending: ', erro); //return object error
                      });
                      sleep(3)

                  }
                  */
                  await client.startTyping(message.from);
                  let responses = payload.fulfillmentMessages;
                  let mensajes = 0;
                  let cuento = "";
                  for (const response of responses) 
                  {
                      // console.log('response ', response)
                      // log.info(response)
                      if (response.message == 'text')
                          cuento = cuento + '\n' + response.text.text[0];
                          // await SendMsgToWA(client, message, response);
                      mensajes++;
                  }
                  await SendMsgToWAUnique(client, message, cuento);
                  // console.log('cuento_audio' , cuento_audio)

                  var colocaraudio='Si';
                  if ((colocaraudio == 'Si') && (cuento_audio != ''))
                  {
                      // let textoresponseaudio = await execute_query_audio(message.from, cuento);
                      let textoresponseaudio = await text2audio(cuento_audio, 'es-us', message.from)
                      let completo = textoresponseaudio

                      console.log(textoresponseaudio)

                      await sleep(3)

                      if (
                        (payload.intent.displayName == 'PedirCedula') ||
                        (payload.intent.displayName == 'DetalleAhorrosIntent') ||
                        (payload.intent.displayName == 'DetallePrestamosIntent') ||
                        (payload.intent.displayName == 'DetalleFiadoresIntent')
                      )

                        await client
                          .sendFile(
                            message.from,
                            completo,
                            'respuesta',
                            ''
                          )
                          .then((result) => {
                            // console.log('Result: ', result); //return object success
                            // fs.unlinkSync('./'+textoresponseaudio)
                          })
                          .catch((erro) => {
                            console.error('Error when sending: ', erro); //return object error
                        });
                        /*
                      if (cuento_audio_cobranza != '')
                      {
                        
                        // const arreglo_cuento_audio_cobranza = []
                        // arreglo_cuento_audio_cobranza.push('Si en la consulta aparece reflejada una cuota rechazada considere la siguiente explicacion. ')
                        // arreglo_cuento_audio_cobranza.push('1.- La cuota rechazada se deriva porque la cantidad de salario destinada para dicho descuento no cubre el monto en su totalidad y eso es debido a que lo último que se deduce es lo relacionado a la CAPUCLA, luego de descontar lo correspondiente a otras instituciones como por ejemplo. El IPSPUCO, generando esto una diferencia. ' )
                        // arreglo_cuento_audio_cobranza.push('2. Es necesario indicar que las cuotas enviadas al cobro aplicadas por la Universidad en algunos casos el disponible del asociado no es suficiente para la cancelación en su totalidad y en su recibo de nómina no se les hace la aclaratoria que el monto que allí se refleja es solo monto parcial a la cuota relacionada ')
                        // arreglo_cuento_audio_cobranza.push('3. El remanente del disponible para el pago es abonado a la cuota pendiente por pagar, lo que genera una diferencia que es el monto que se les está cobrando, denominada cuotas rechazadas.')
                        // arreglo_cuento_audio_cobranza.push('4.-El monto de la cuota allí reflejada debe ser en bolívares digitales y la no cancelación de la misma les impide la solicitud del nuevo préstamo.')

                        // for(let i=0; i<arreglo_cuento_audio_cobranza.length; i++) {
                        //   await sleep(3)
                        //   let textoresponseaudio = await text2audio(arreglo_cuento_audio_cobranza[i], 'es-us', message.from)
                        //   let completo = textoresponseaudio
                        //   console.log(textoresponseaudio)
                        //   await client
                        //     .sendFile(
                        //       message.from,
                        //       completo,
                        //       'respuesta',
                        //       ''
                        //     )
                        //     .then((result) => {
                        //       // console.log('Result: ', result); //return object success
                        //       // fs.unlinkSync('./'+textoresponseaudio)
                        //     })
                        //     .catch((erro) => {
                        //       console.error('Error when sending: ', erro); //return object error
                        //   });
                        // }
                        
                        // varias notas de voz
                        let varias_notas = 0 
                        if (varias_notas == 1)
                        {
                          const ac = [0, 1, 2, 3, 4]
                          for(let i=0; i<ac.length; i++) {
                            completo = './audios/0' + i + ".mp3"

                            await client
                              .sendFile(
                                message.from,
                                completo,
                                'respuesta',
                                ''
                              )
                              .then((result) => {
                                // console.log('Result: ', result); //return object success
                                // fs.unlinkSync('./'+textoresponseaudio)
                              })
                              .catch((erro) => {
                                console.error('Error when sending: ', erro); //return object error
                            });
                            sleep(3)
                          }
                        }
                        else 
                        {
                          const ac = [0]
                          for(let i=0; i<ac.length; i++) {
                            completo = './audios/audio_cobranza.mp3'

                            await client
                              .sendFile(
                                message.from,
                                completo,
                                'respuesta',
                                ''
                              )
                              .then((result) => {
                                // console.log('Result: ', result); //return object success
                                // fs.unlinkSync('./'+textoresponseaudio)
                              })
                              .catch((erro) => {
                                console.error('Error when sending: ', erro); //return object error
                            });
                            sleep(3)
                          }

                        }


                      }
                      */

                      await client.stopTyping(message.from);

                  }

                  // console.log('cuento final ', cuento)

                  // console.log('payload ',payload)
                  console.log('displayName ' ,payload.intent.displayName)
                  if (payload.intent.displayName == 'Salir')
                    lacedula='';
                  if (
                      (payload.intent.displayName == 'PedirCedula') ||
                      (payload.intent.displayName == 'DetalleAhorrosIntent') ||
                      (payload.intent.displayName == 'DetallePrestamosIntent') ||
                      (payload.intent.displayName == 'DetalleFiadoresIntent')
                      )
                  {
                    console.log('obtuverespuesta regreso ',obtuverespuesta)
                    // if (obtuverespuesta == "1")
                    if (cuento_audio != '')
                    {
                      detalle2((total_prestamos), (total_fianzas), total_ahorros);
                      // console.log(botones)
                      // console.log(cuento2)
                      await sendbotones(client, message, botones, cuento2, 'Que desea hacer?', idempresa);
                    }
                  }
                  // https://www.heros.com.ve/cajaapp/api/media/CAPUCLA/soporte/584125150054@c.us.jpg
                  // ReportedePago
                  if (payload.intent.displayName == 'pagardeuda')
                  {
                    envio = message.type
                    await client.startTyping(message.from);
                    // cuento = '🥺 Lo siento.. no he entendido lo que enviaste ('+envio+')';
                    // await SendMsgToWAUnique(client, message, cuento);
                    imagen = 'transferencia_capucla.jpeg';
                    try {
                        await SendImgToWA(session, message, client, imagen);
                    
                        await client.startTyping(message.from);
                        cuento = '*I M P O R T A N T E   L E E R   E S T A  I N F O R M A C I O N*\n'
                        cuento += '*I M P O R T A N T E   L E E R   E S T A  I N F O R M A C I O N*\n'
                        cuento += 'Al enviar una *transferencia* por favor la frase *Reportar Pago* luego copie/pegue el siguiente texto indicando la informacion solicitada  \n\n';
                        cuento += '*I M P O R T A N T E   L E E R   E S T A  I N F O R M A C I O N*\n'
                        cuento += '*I M P O R T A N T E   L E E R   E S T A  I N F O R M A C I O N*\n'
                        await SendMsgToWAUnique(client, message, cuento);

                        await sleep(3)
                        cuento = '*Reportar Pago* (debe anexar la siguiente información) \n'
                        cuento += '*Nro. de Identificacion* de la persona que *realiza el deposito* \n';
                        cuento += '*Nro. de Identificacion* del *Asociado* \n';
                        cuento += 'Monto depositado \n';
                        cuento += 'Fecha del deposito \n\n'
                        await SendMsgToWAUnique(client, message, cuento);

                        // await sleep(3)
                        // cuento = 'Si tiene dudas puede visualizar el video de ejemplo en https://youtu.be/WcQQrshfu7g'
                        // await SendMsgToWAUnique(client, message, cuento);

                        await client.stopTyping(message.from);

                    }
                    catch (error) {
                        // await SendMsgToWAUnique(client, message, cuento);
                        // console.log('no definida imagen '+imagen)
                    }
                    guardar_peticion(lacedula, message.from, message.body, idempresa, message.type, 1, message.sender.pushname, cuento)
                    await client.stopTyping(message.from);
                  }

                  if (payload.intent.displayName == 'ReportedePago') // 'soportepago')
                  {
                    envio = message.type
                    await client.startTyping(message.from);
                    cuento = '👍🏼 He recibido la información suministrada y enviado al departamento correspondiente. De requerirse mayor información se le solicitara nuevamente que suministre la misma ';
                    await SendMsgToWAUnique(client, message, cuento);

                    // enviar email con el soporte
                    const mail_img = require('./enviar_mail_imagen.js');
                    let enviar = mail_img.enviar_email(message.from, message.body);
                    console.log('envio enviar_mail', enviar)

                    guardar_peticion(lacedula, message.from, message.body, idempresa, message.type, 1, message.sender.pushname, cuento)
                    await client.stopTyping(message.from);
                  }

                  await client.stopTyping(message.from);

                  // guardar_peticion(lacedula, message.from, message.body, idempresa, message.type, mensajes, message.sender.pushname, cuento)
              }
              catch (error) {
                  envio = message.type
                  await client.startTyping(message.from);
                  cuento = '🥺 Lo siento.. no he entendido lo que enviaste ('+envio+')';
                  await SendMsgToWAUnique(client, message, cuento);
                  imagen = 'nada1.jpeg';
                  try {
                      await SendImgToWA(session, message, client, imagen);
                  }
                  catch (error) {
                      // await SendMsgToWAUnique(client, message, cuento);
                      // console.log('no definida imagen '+imagen)
                  }
                  guardar_peticion(lacedula, message.from, message.body, idempresa, message.type, 1, message.sender.pushname, cuento)
                  await client.stopTyping(message.from);
                  // throw error;
              }
          }
        else 
          if ((message.type == 'image')) //  || (message.type == 'ciphertext'))
          {
            // instrucciones_soporte(client, message)
              await client.startTyping(message.from);
              cuento = '*I M P O R T A N T E   L E E R   E S T A  I N F O R M A C I O N*\n'
              cuento += '*I M P O R T A N T E   L E E R   E S T A  I N F O R M A C I O N*\n'
              cuento += 'Si esta enviando una *transferencia* por favor copie/pegue el siguiente texto indicando la informacion solicitada segun *Circular # 284* \n\n';
              cuento += '*I M P O R T A N T E   L E E R   E S T A  I N F O R M A C I O N*\n'
              cuento += '*I M P O R T A N T E   L E E R   E S T A  I N F O R M A C I O N*\n'
              // cuento += 'https://www.youtube.com/watch?v=G1S_Vmz40do'
              await SendMsgToWAUnique(client, message, cuento);

              await sleep(3)
              cuento = '*Reportar Pago* (debe anexar la información indicada) \n'
              cuento += '*Nro. de Identificacion* de la persona que *realiza el deposito* \n';
              cuento += '*Nro. de Identificacion* del *Asociado* \n';
              cuento += 'Monto depositado \n';
              cuento += 'Fecha del deposito'
              // cuento += 'Para informacion acerca de transferencia/deposito escriba *DEPOSITO BANCO* \n\n'
              await SendMsgToWAUnique(client, message, cuento);
              await client.stopTyping(message.from);

              // await sleep(3)
              // cuento = 'Si tiene dudas puede visualizar el video de ejemplo en https://youtu.be/WcQQrshfu7g'
              // await SendMsgToWAUnique(client, message, cuento);

              media = message.body
              media = await client.downloadMedia(message)

              const parametros = {
                "celular": message.from,
                "idempresa": 'CAPUCLA',
                "file": media
              };

              // console.log(parametros)
              await sleep(3)

              // const headers = {"content-type": "application/x-www-form-urlencoded"};
              const headers = {"content-type": "application/json"};
              const url = url_api + "add_img_64.php";

              return axios.post(url, parametros, headers).
              then ((response) =>
              {
                console.log('lista la imagen');
              });

              // imagen = `/tmp/` + message.from + '_'+ Date.now() +'recibo.jpg'
              // // fs.writeFile(`./images/${media.filename}.${ext}`, media.data, { encoding: 'base64' }, function (err) {
              // fs.writeFile(imagen, 'algo', { encoding: 'base64' }, function (err) {
              //     console.log('** Archivo Media Guardado **');
              //     // console.log('message.from ', message.from)
              //     const mail_img = require('./enviar_mail_imagen.js');
              //     let enviar = mail_img.enviar_email(imagen, message.from);
              //     console.log('envio de imagen', enviar)
              // });

          }
          else 
          if (message.type == 'ciphertext')
          {
              await client.startTyping(message.from);
              cuento = '🥺 Lo siento.. no he podido entender lo que enviaste. Si es una transferencia envie la imagen nuevamente con copiar y pegar';
              await SendMsgToWAUnique(client, message, cuento);
              await client.stopTyping(message.from);
          }
          else
          {
              envio = message.type
              await client.startTyping(message.from);
              cuento = '🥺 Lo siento.. no he entendido lo que enviaste ('+envio+')';
              await SendMsgToWAUnique(client, message, cuento);
              imagen = 'nada1.jpeg';
              try {
                  await SendImgToWA(session, message, client, imagen);
              }
              catch (error) {
                  // await SendMsgToWAUnique(client, message, cuento);
                  console.log('no definida imagen '+imagen)
              }
              guardar_peticion(lacedula, message.from, message.body, idempresa, message.type, 1, message.sender.pushname, cuento)
              await client.stopTyping(message.from);
              // throw error;
          }

}

// function instrucciones_soporte(cient, message)
// {
//   await client.startTyping(message.from);
//   cuento = '*I M P O R T A N T E   L E E R   E S T A  I N F O R M A C I O N*\n'
//   cuento += '*I M P O R T A N T E   L E E R   E S T A  I N F O R M A C I O N*\n'
//   cuento += 'Si esta enviando un *soporte de pago* por favor copie/pegue el siguiente texto indicando la informacion solicitada  \n\n';
//   cuento += '*I M P O R T A N T E   L E E R   E S T A  I N F O R M A C I O N*\n'
//   cuento += '*I M P O R T A N T E   L E E R   E S T A  I N F O R M A C I O N*\n'
//   await SendMsgToWAUnique(client, message, cuento);

//   await sleep(3)
//   cuento = '*SOPORTE DE PAGO* \n'
//   cuento += 'Cedula del titular que origina la transferencia/deposito \n';
//   cuento += 'Numero de referencia de la transferencia/deposito \n';
//   cuento += 'Fecha en que se realizo la transferencia/deposito \n\n'
//   cuento += 'Para informacion acerca de transferencia/deposito escriba *DEPOSITO BANCO* \n\n'
//   await SendMsgToWAUnique(client, message, cuento);
//   await client.stopTyping(message.from);

//   media = message.body

//   const parametros = {
//     "tokenCuenta":message.from, 
//     "celular": message.from,
//     "idempresa": idempresa,
//     "file": media
//   };
//   const headers = {"content-type": "application/json"};
//   const url = url_api + "add_img_64.php";

//   return axios.post(url, parametros, headers).
//   then ((response) =>
//   {
//     console.log('lista la imagen');
//   });

//   // imagen = `/tmp/` + message.from + '_'+ Date.now() +'recibo.jpg'
//   // // fs.writeFile(`./images/${media.filename}.${ext}`, media.data, { encoding: 'base64' }, function (err) {
//   // fs.writeFile(imagen, 'algo', { encoding: 'base64' }, function (err) {
//   //     console.log('** Archivo Media Guardado **');
//   //     // console.log('message.from ', message.from)
//   //     const mail_img = require('./enviar_mail_imagen.js');
//   //     let enviar = mail_img.enviar_email(imagen, message.from);
//   //     console.log('envio de imagen', enviar)
//   // });

// }

function text2audio(text, language, id)
{
  // version con gtt
    outputFilePath = './audios/' + id + '_'+ Date.now() + "output.mp3"

    var voice = new gtts(text,language)

    voice.save(outputFilePath,function(err,result){
        if(err){
            fs.unlinkSync(outputFilePath)
            // res.send("Unable to convert to audio")
        }
        // res.download(outputFilePath,(err) => {
        //     if(err){
        //         fs.unlinkSync(outputFilePath)
        //         // res.send("Unable to download the file")
        //     }

        // fs.unlinkSync(outputFilePath)
        // })
    })
    return outputFilePath;

  /*
  // version en prueba con google text to speach

  outputFilePath = convertir_mp3(text, language, id)

  return outputFilePath;
  */


}

async function convertir_mp3(text, language, id)
{
  // Construct the request
  outputFilePath = './audios/' + id + '_'+ Date.now() + "output.mp3"
  const request = {
    input: {text: text},
    // Select the language and SSML voice gender (optional)
    voice: {languageCode: 'es-US', ssmlGender: 'NEUTRAL'},
    // select the type of audio encoding
    audioConfig: {audioEncoding: 'MP3'},
  };

  // Performs the text-to-speech request
  const [response] = await client_voice.synthesizeSpeech(request);
  console.log(response)
  // Write the binary audio content to a local file
  const writeFile = util.promisify(fs.writeFile);
  console.log(writeFile)
  await writeFile(outputFilePath, response.audioContent, 'binary');
  console.log('termine')
  return outputFilePath;
}

function detalle2(prestamos, fiadores, ahorros)
  {
    cuento2 = "ℹ️ Si desea información más detallada ";
    botones = [];
    // cuento2 = "";
    if (parseFloat(ahorros) > 0)
    {
      cuento2 = cuento2 + " puede seleccionar o escribir *Ahorros*";
      // botones.push({body: 'Ahorros'})
        botones.push({buttonId: 'ahorros', buttonText: {displayText:'🏛️ Ahorros'}, type: 1})
        // botones.push({buttonId: 'ahorros', buttonText: {displayText:'Ahorros'}, type: 1})
        // botones.push({buttonId: 'ahorros', buttonText: {displayText:'🏛️ Ahorros'}})
    }
    if (parseFloat(prestamos) > 0)
    {
      cuento2 = cuento2 + ", *Préstamos*";
      // botones.push({body: 'Préstamos'})
        botones.push({buttonId: 'prestamos', buttonText: {displayText:'🧾 Préstamos'}, type: 1})
        // botones.push({buttonId: 'prestamos', buttonText: {displayText:'Préstamos'}, type: 1})
        // botones.push({buttonId: 'prestamos', buttonText: {displayText:'🧾 Préstamos'}})
    }
    if (parseFloat(fiadores) > 0)
    {
        cuento2 = cuento2 + ", *Fiadores*";
        botones.push({buttonId: 'fiadores', buttonText: {displayText:'📊 Fiadores'}, type: 1})
        // botones.push({buttonId: 'fiadores', buttonText: {displayText:'Fiadores'}, type: 1})
        // botones.push({buttonId: 'fiadores', buttonText: {displayText:'📊 Fiadores'}})
        // botones.push({body: 'Fiadores'})
    }
    cuento2 = cuento2 + " ó *Salir* para cerrar ésta sesión ";
    cuento2 = 'ℹ️ Puede seleccionar alguna de las opciones disponibles';
    // botones.push({buttonId: 'salir', buttonText: {displayText:'Salir'}, type: 1})
    botones.push({buttonId: 'salir', buttonText: {displayText:'👋🏼 Salir'}, type: 1})
    // botones.push({buttonId: 'salir', buttonText: {displayText:'👋🏼 Salir'}})
    // botones.push({body: 'Salir'})
  }


function guardar_peticion(cedula, celular, peticion, idempresa, tipo, mensajes, nombre, cuento)
{
    const parametros = {
      "cedula":cedula, 
      "celular": celular,
      "peticion": peticion,
      "idempresa": idempresa,
      "tipo": tipo,
      "nombre": nombre,
      "mensajes": mensajes,
      "respuesta_bot": cuento
    };
    // console.log(parametros)
    const headers = {"content-type": "application/json"};

    const url = url_api + "guardar_peticion.php";

    return axios.post(url, parametros, headers).
    then ((response) =>
    {
      // console.log('listo');
    });

}


function SendMsgToWA(client, message, response)
{
  return new Promise((resolve, reject) => {
      // console.log('SendMsgToWA ->',message.body)
        client
          .sendText(message.from, response.text.text[0])
          // .stopTyping(message.from);
          .then((result) => {
            resolve(result)
          })
          .catch((erro) => {
            console.error('Error when sending: ', erro); //return object error
            reject(error)
          });
  })
}

function sendbotones(client, message, botones, cuento2, titulo, footer)
{
  return new Promise((resolve, reject) => {
      // console.log('SendMsgToWAUnique ->',message)
        client
          // .sendText(message.from, response)
          .sendMessageOptions(message.from, cuento2, {
            title:titulo,
            footer: footer,
            isDynamicReplyButtonsMsg: true,
            dynamicReplyButtons: botones
            })
          // .stopTyping(message.from);
          .then((result) => {
            resolve(result)
          })
          .catch((erro) => {
            console.error('Error when sending: ', erro); //return object error
            reject(error)
          });
  })
}

function SendMsgToWAUnique(client, message, response)
{
  return new Promise((resolve, reject) => {
      // console.log('SendMsgToWAUnique ->',message)
        client
          .sendText(message.from, response)
          // .stopTyping(message.from);
          .then((result) => {
            resolve(result)
          })
          .catch((erro) => {
            console.error('Error when sending: ', erro); //return object error
            reject(error)
          });
  })
}

function SendImgToWA(session, message, client, imagen)
{
  return new Promise((resolve, reject) => {
      // console.log('SendImgToWA ->',message)
                     // 'https://www.heros.com.ve/wp-content/uploads/2020/10/HEROS.jpg',
        client
          .sendImage(message.from, 
                    './images/'+imagen,
                     '', '')
                     // 'https://avatars1.githubusercontent.com/u/36980416', 
          .then((result) => {
            resolve(result)
          })
          .catch((erro) => {
            console.error('Error when sending: ', erro); //return object error
            reject(error)
          });
  })
}


async function setSessionAndUser(senderId) {
  try {
    if (!sessionIds.has(senderId)) {
      sessionIds.set(senderId, uuid.v1());
    }
  } catch (error) {
    throw error;
  }
}

app.listen(PORT, () => {
    console.log(`Our app is running on port ${ PORT }`);
}); 

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms*1000);
  });
}

/*
https://three-screeching-suit.glitch.me
https://wppconnect-team.github.io/wppconnect/pages/Getting%20Started/basic-functions.html#sendimage
https://github.com/pedroslopez/whatsapp-web.js/pull/756/files

build packs

https://github.com/jontewks/puppeteer-heroku-buildpack.git
https://buildpack-registry.s3.amazonaws.com/buildpacks/jontewks/puppeteer.tgz
https://github.com/jontewks/puppeteer-heroku-buildpack

// pasos heroku
heroku login

$ heroku create --buildpack https://github.com/heroku/heroku-buildpack-nodejs.git
$ heroku buildpacks:add https://github.com/jontewks/puppeteer-heroku-buildpack.git

git init && heroku git:remote -a chat-cajas
git add . && git commit -am "version" && git push heroku master && heroku logs --tail 

heroku logs --tail 
o 
heroku logs --tail -a chat-cajas

// $ heroku buildpacks:clear
// $ heroku buildpacks:add --index 1 https://github.com/jontewks/puppeteer-heroku-buildpack 
// o
// $ heroku buildpacks:add jontewks/puppeteer
// $ heroku buildpacks:add --index 1 heroku/nodejs

heroku restart -a chat-cajas

5255626

// fin pasos heroku

git init
git add README.md
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/jchbar/caja-chat-test.git
git push -u origin main


https://stackoverflow.com/questions/8393636/configure-node-js-to-log-to-a-file-instead-of-the-console

https://www.npmjs.com/package/@google-cloud/text-to-speech
  https://www.youtube.com/watch?v=HSuwhalBGx0
    "@google-cloud/text-to-speech": "^3.4.0",

npm i @google-cloud/dialogflow
npm i @wppconnect-team/wppconnect@1.12.4
npm i actions-on-google
npm i gtts
npm i axios
npm i dialogflow-fulfillment --force
npm install express@
npm i nodemailer
npm i uuid
// npm install winston --save
// npm install winston-daily-rotate-file
npm i cors

    "winston": "^3.5.1",
    "winston-daily-rotate-file": "^4.6.0"


*/