'use strict';

const AWS = require('aws-sdk');
const ses = new AWS.SES({ region: `${process.env.REGION}` })
const axios = require('axios').default;

module.exports.handler = async event => {

  var params = {
    Destination: {
      ToAddresses: [`${process.env.NOTIFY_EMAIL}`]
    },
    Message: {
    Body: {
    Text: { Data: "Blank test message. If this message was recived check with admin. This result should not be returned."     
      }  
    },
    Subject: { Data: "Test Subject"  
      }
    },
    Source: `${process.env.SOURCE_EMAIL}`
  };
    
  try {
    const response = await axios.get(`${process.env.ENDPOINT}`);

    const getRes = {
      statusCode: 200,
      res: response.data
    }

    const emailRes = {
      statusCode: 503,
      res: 'Default email res'
    }

    if (response.status == 500) {
      console.log('Email Sent, error 500 response from backend');
      params.Message.Body.Text.Data = 'Error processing output return. Backend responded with ' + `${response.data.message}`+'.';
      params.Message.Subject.Data = 'UPS Error Processing Backend Return';

      var email = await ses.sendEmail(params).promise();

      emailRes.statusCode = 201
      emailRes.res = email
    
    }

    if (response.status == 200 && response.data.message == 'Battery Power'){
      console.log('Email sent, UPS on Battery Power');
      console
      params.Message.Body.Text.Data = 'UPS Error, POWER LOST! Returned Output ' + `${response.data.message}`;
      params.Message.Subject.Data = 'UPS Error, Power Lose';

      var email = await ses.sendEmail(params).promise();

      emailRes.statusCode = 201
      emailRes.res = email
    }

    if (!email){
      emailRes.statusCode = 204
      emailRes.res = 'Email NOT sent based on conditions returned'
    }

    return {
      getRes: getRes,
      emailRes: emailRes
    }

  } catch (error) {
    return {
      statusCode: 400,
      errBody: error
    }

  }

};
