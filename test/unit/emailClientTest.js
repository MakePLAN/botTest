/* global describe, it, before, beforeEach, after, afterEach */

'use strict';

var assert = require('assert');
var Datastore = require('nedb');
var fs = require('fs');
var async = require('async');
var moment = require('moment');
var Model = require('../../src/model');
var Errors = require('../../src/errors');
var expect = require('chai').expect;
var util = require('../../src/util');
var emailClient = require('../../src/core/email-client');

describe("Email Client test:", function() {
  var email_Client;

  before(function () {
    //Instantiate email Client class 
    email_Client = new emailClient();
    
    
    
  });

  describe("Checking email functionality:", function() {

    it("Check inbox with no new email", function(done) {
      
      email_Client._checkEmails();
      email_Client._loadStatus().done(function(status){
        expect(email_Client._notice).to.equal("No new mail");
        done();
      });
    });

    it("Check inbox with new email and sending email", function(done) {
      
      email_Client._sendEmail("Ben Lee", "kimr07175@gmail.com", "Hi", "Hello", null);
      console.log("Alert: Sending a test email");
      email_Client._loadSendCheck().done(function(check){
        //email_Client._checkEmails();
        setTimeout(function(){
          console.log("Alert: checking");
          
          expect(email_Client._notice).to.equal("New mail");
          done();
          
          
        }, 7000);
        

      });

      

    });




  });

});

