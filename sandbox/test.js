var emailClient = require('./email-client');

var email_client = new emailClient("Roy Kim");
email_client._sendEmail("Ben Lee", "sangwoon@usc.edu", "Hi", "Hello", null);