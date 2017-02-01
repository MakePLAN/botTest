var emailClient = require('./src/core/email-client');

var email_client = new emailClient("Roy Kim");
email_client._checkEmails();
email_client._sendEmail("Ben Lee", "sangwoon@usc.edu", "Hi", "Hello", null);