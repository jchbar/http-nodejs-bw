// const dialogflow = require("dialogflow");
const dialogflow = require('@google-cloud/dialogflow');
// const sessionId = uuid.v4();
const uuid = require('uuid');
// const logger = require('./util/logger').logger;

const config = require("./config_test");

/**
 * Send a query to the dialogflow agent, and return the query result.
 * @param {string} projectId The project to be used
 */
async function sendToDialogFlow(msg, session, params) {
  // console.log('msg en sendToDialogFlow ', msg)
  // A unique identifier for the given session
  const sessionId = uuid.v4();

  let textToDialogFlow = msg;
  // try {
    const sessionClient = new dialogflow.SessionsClient(
      {
        // keyFilename:"./chat-test-yvjw-2e6829f46225.json" // 
        keyFilename:"botwhatsappcajav2-ucyo-39b52b7ccbbc-test.json" // v2
        // keyFilename:"botwhatsappcajav2-promo-phkn-0671d373fec2.json" // v2-promo
      }
      );
    const sessionPath = sessionClient.projectAgentSessionPath(
      config.GOOGLE_PROJECT_ID,
      sessionId
    );

    const request = {
      session: sessionPath,
      queryInput: {
        text: {
          text: textToDialogFlow,
          languageCode: config.DF_LANGUAGE_CODE,
        },
      },
      // queryParams: {
      //   payload: {
      //     data: params,
      //   },
      // },
    };
    // console.log('sessionPath ',sessionPath, ' request ', request)
    // logger.info('sessionPath ',sessionPath, ' request ', request);
    // original 
    const responses = await sessionClient.detectIntent(request);
    // console.log('responses ',responses)
    // logger.info('responses ',responses);
    const result = responses[0].queryResult; 
    // console.log('result ', result)
    // nuevo   
    // handleDialogFlowResponse(sender, result);
    // console.log("INTENT EMPAREJADO: ", result.intent.displayName);
    let defaultResponses = [];
    // console.log('result.intent ',result.intent)
    if (result.action !== "input.unknown") {
      result.fulfillmentMessages.forEach((element) => {
      });
    }
    if (defaultResponses.length === 0) {
      result.fulfillmentMessages.forEach((element) => {
        if (element.platform === "PLATFORM_UNSPECIFIED") {
          defaultResponses.push(element);
        }
      });
    }
    result.fulfillmentMessages = defaultResponses;
    // console.log(JSON.stringify(result,null," "))
    return result;
    // console.log("se enviara el resultado: ", result);
  // } catch (e) {
  //   console.log("error");
  //   console.log(e);
  // }


}

module.exports = {
  sendToDialogFlow,
};

// sendToDialogFlow("Hola", '1131231');
