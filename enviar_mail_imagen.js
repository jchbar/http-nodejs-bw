const nodemailer = require('nodemailer');
const fs = require('fs'); // used to read files

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

async function enviar_email(enviadopor, mensaje) {
	let existe = false;

	let path = 'https://www.heros.com.ve/cajaapp/api/media/CAPUCLA/soporte/';
	let archivo = path +enviadopor+'.jpg'
	           // <p> el archivo puede visualizarlo en <a href=`+archivo+`> Aqui </a> </p> 

	let email ={ 
	       from:"info@heros.com.ve",  //remitente
	       to:"cobranza@capucla.org.ve",  //destinatario
	       cc:"juan.hernandez@heros.com.ve",  //destinatario
	       replyto: 'cobranza@capucla.org.ve', 
	       subject:"informacion deposito socio ",  //asunto del correo
	       html:` 
	           <div> 
	           <p>Soporte Recibido del telefono `+enviadopor+`</p> 
	           <p>`+mensaje+` </p>
	           </div> 
	       `
	       ,
	        attachments: [
	            {
	       // //         	// encoded string as an attachment
		            filename: 'soportepago.jpg', 
		      // //       // './images/nada1.jpeg',
		      // //       // content: 'aGVsbG8gd29ybGQh',
		      // //       // content: fs.createReadStream(archivo),
		      		contentType:  'image/jpeg',
		            path: archivo, 
		            // file: archivo, 
		            // encoding: 'base64',
		      //       // content: new Buffer.from(req.body.image.split("base64,")[1], "base64"),
		        }
	        ]
	   };

	   // console.log(email);
	// console.log('archivo ', archivo)
	// if (fs.existsSync(enviadopor, mensaje)) 
	{
	  // existe y envio
	  existe = true;
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
	return existe;

}

module.exports = {
  enviar_email,
};
