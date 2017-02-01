'use strict';

var fs = require('fs');
var path = require('path');

//  Use node-imap to receive emails
var Imap = require('imap');
var inspect = require('./util').inspect;

//  Use mailparser to parse emails
var MailParser = require('mailparser').MailParser;

// Use nodemailer to send emails 
var NodeMailer = require('nodemailer');

//  TODO: there's probably a better way to be error resilient than creating a new Imap
function getFreshImap (cb) {
    //  Get email creds from email.json
    fs.readFile('./email.json', 'utf8', function (err, data) {
        if (err) {
            cb(err);
        } else {
            try {
                var creds = JSON.parse(data);   //  Can throw exception
                var hosts = {
                    'gmail.com': 'imap.gmail.com',
                    'yahoo.com': 'smtp.yahoo.com' //  Need to verify this one
                };

                //  Get the host for the email address
                var host = null;
                Object.keys(hosts).forEach(function (h) {
                    if (creds.email.includes(h)) {
                        host = hosts[h];
                    }
                });
                if (host === null) {
                    cb('We\'re sorry, currently only Gmail and Yahoo accounts are supported');
                    return;
                }

                var imap = new Imap({   //  Can throw exception
                    user: creds.email,
                    password: creds.password,
                    host: host,
                    port: 993,
                    tls: true,
                    keepalive: true
                });

                var email = creds.email;

                //construct config necessary to send email 
                var smtpConfig = { 
                    service: "Gmail",
                    auth:{
                        user: creds.email,
                        pass: creds.password
                    }
                };

                cb(null, imap, email, smtpConfig);
            } catch (e) {
                cb(e);
            }
        }
    });
}

class EmailClient {
    //constructor takes the full name of user as String
    constructor (name) {
        var self = this;
        self._name = name; 
        self._email = "";
        self._unseen = false; 

        //  Get Imap obj and check emails
        getFreshImap(function (err, imap, email, smtpConfig) {
            if (err) {
                console.log(err);
            } else {
                self._imap = imap;
                self._email = email;
                self._transporter = NodeMailer.createTransport(smtpConfig);
                self._checkEmails();
                
                
            }
        });
    }

    //method to change name of user
    _changeName(name){
        var self = this;
        self._name = name;
    }

    //attachments as array of Path
    _sendEmail(toName, toEmail, subject, text, attachments){
        var self = this;

        if (self._email == ""){
            fs.readFile('./email.json', 'utf8', function (err, data) {
                if (err) {
                    cconsole.log("Error: ", err);
                } else {
                    try {
                        var creds = JSON.parse(data);   //  Can throw exception
                        
                        var email = creds.email;

                        //construct config necessary to send email 
                        var smtpConfig = { 
                            service: "Gmail",
                            auth:{
                                user: creds.email,
                                pass: creds.password
                            }
                        };

                        self._email = email;
                        self._transporter = NodeMailer.createTransport(smtpConfig);
                        
                    } catch (e) {
                        console.log("Error: ", e);
                    }
                }

                var fromText =  '"' + self.name + '" <' + self._email + '>'; 
                var toText = '"' + toName + '" <' + toEmail + '>'; 

                var files = [];
                if (attachments != null){
                    for (var i = 0; i < attachments.length; i++){
                        
                        files.push({
                            path: attachments[i]
                        });
                    }
                }

                //mail component
                var mailOptions = {
                    from: fromText, // sender address
                    to: toText, // list of receivers
                    subject: subject, // Subject line
                    text: text, // plaintext body
                    attachments: files //attachments
                }

                // send mail with defined transport object
                self._transporter.sendMail(mailOptions, function(error, info){
                    if(error){
                        return console.log(error);
                    }
                    console.log('Message sent: ' + info.response);
                });


            });
        }
        else{
            var fromText =  '"' + self.name + '" <' + self._email + '>'; 
            var toText = '"' + toName + '" <' + toEmail + '>'; 

            var files = [];
            if (attachments != null){
                for (var i = 0; i < attachments.length; i++){
                    
                    files.push({
                        path: attachments[i]
                    });
                }
            }

            //mail component
            var mailOptions = {
                from: fromText, // sender address
                to: toText, // list of receivers
                subject: subject, // Subject line
                text: text, // plaintext body
                attachments: files //attachments
            }

            // send mail with defined transport object
            self._transporter.sendMail(mailOptions, function(error, info){
                if(error){
                    return console.log(error);
                }
                console.log('Message sent: ' + info.response);
            });
        }

        

    }

    _checkEmails () {
        var self = this;

        self._imap.on('ready', function () {
            self._imap.openBox('INBOX', false, function (err, box) {
                if (err) {
                    throw err;
                }

                //  Parses all unseen emails
                var collectUnseenEmails = function () {
                    self._imap.search(['UNSEEN'], function (err, results) {
                        if (err || results.length === 0) {
                            console.log(err || 'NO NEW MAIL');
                            self._unseen = false;
                            return;
                        }

                        //  Fetch the entire email bodies
                        var f = self._imap.fetch(results, {
                            bodies: [''],
                            markSeen: false //don't mark as seen until the user actually sees it 
                        });

                        f.on('message', function (msg, seqno) {
                            var parser = new MailParser();
                            parser.on('end', function (mail) {
                                self._unseen = true;
                                //  Done parsing
                                //  TODO: logic for sending event to event bus goes here
                                console.log('NEW MAIL!');
                                self._unseen = true;
                                console.log(
                                    'From: ' + mail.from[0].address + '\n' +
                                    'Subject: ' + mail.subject + '\n' +
                                    'Body:\n' + mail.text
                                );
                            });

                            //  Write body data to parser
                            msg.on('body', function (stream, info) {
                                stream.on('data', function (chunk) {
                                    parser.write(chunk.toString('utf8'));
                                });
                            });

                            msg.once('end', function () {
                                parser.end();
                            });
                        });
                    });
                };

                //  Collect existing unseen emails
                collectUnseenEmails();

                //  Listen for new mail coming in
                self._imap.on('mail', function (newMsgs) {
                    collectUnseenEmails();
                });
            });
        });

        self._imap.on('error', function (err) {
            console.log(err);
            console.log('Trying again in 10 seconds...');
            self._imap.end();

            //  Get a new Imap to work with
            getFreshImap(function (err, imap) {
                if (err) {
                    console.log(err);
                } else {
                    self._imap = imap;

                    //  Try again in 10 sec
                    setTimeout(function () {
                        self._imap.connect();
                    }, 10000);
                }
            });
        });

        self._imap.connect();
    }
}

module.exports = EmailClient;
