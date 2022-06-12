const nodemailer = require('nodemailer');
const fs = require('fs'); // used to read files

const ARCHIVO_TOKEN = './tokens/whatsbot.data.json';

let jConfig = {
      "host":"mail.heros.com.ve", 
      "port":"465", 
      "secure":true, 
      "auth":{ 
          "type":"login", 
          "user":"info@heros.com.ve", 
          "pass":"8AlJoOT9O2WG1KSXXV0b" 
  }
};

let email ={ 
       from:"info@heros.com.ve",  //remitente
       to:"juan.hernandez@heros.com.ve",  //destinatario
       subject:"falta token para bot",  //asunto del correo
       html:` 
           <div> 
           <p>Hola amigo</p> 
           <p>Falta validar el token par ael bot </p> 
           </div> 
       ` 
   };

async function revisar_token() {
	let existe = false;
	if (! fs.existsSync(ARCHIVO_TOKEN)) 
	{
	  // no existe token, mando email
	  let createTransport = nodemailer.createTransport(jConfig);
	  createTransport.sendMail(email, function (error, info) { 
	  if(error){ 
	       console.log("Error al enviar email");
	  } else{ 
	       console.log("Correo enviado correctamente"); 
	  } 
	  createTransport.close(); 
	  });
	}
	else
		existe = true;
	return existe;
}

module.exports = {
  revisar_token,
};
