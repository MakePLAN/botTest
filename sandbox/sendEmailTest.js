var nodemailer = require('nodemailer');
var path = require('path');
var fs = require('fs');

var smtpConfig = {
    service: "Gmail",
    auth: {
        user: 'kimr07175@gmail.com',
        pass: 'Benji-1717'
    }
};

var filePath = path.join(__dirname, 'test.png');
//console.log("path: ", filePath);

// create reusable transporter object using the default SMTP transport
//var transporter = nodemailer.createTransport('smtps://kimr07175%40gmail.com:Benji-1717@smtp.gmail.com');
var transporter = nodemailer.createTransport(smtpConfig);

// setup e-mail data with unicode symbols
var mailOptions = {
    from: '"Sagar Punhani" <punhani@usc.edu>', // sender address
    to: '"Ben Lee" <sangwoon@usc.edu>', // list of receivers
    subject: 'You are idiot', // Subject line
    text: 'You are actually idiot.', // plaintext body
    attachments: [
    //     {
    //         path: filePath
    //     }
    // ]
    
};

// send mail with defined transport object

transporter.sendMail(mailOptions, function(error, info){
    if(error){
        return console.log(error);
    }
    console.log('Message sent: ' + info.response);
});





