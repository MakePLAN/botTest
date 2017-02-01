"use strict";

let jibo = require ('jibo');
let Status = jibo.bt.Status;

var Model = require('./model');
var BookKeeper = require('./core/book-keeper');
var EmailClient = require('./core/email-client');
var Util = require('./util');

jibo.init('face', function(err) {
    if (err) {
        return console.error(err);
    }

    // Load and create the behavior tree
    let root = jibo.bt.create('../behaviors/groove');
    root.start();

    jibo.model = new Model();
    jibo.keeper = new BookKeeper();
    jibo.email = new EmailClient();

    // Listen for the jibo main update loop
    jibo.timer.on('update', function(elapsed) {
        // If the tree is in progress, keep updating
        if (root.status === Status.IN_PROGRESS) {
            root.update();
        }
    });

    var dbs = ['appointment', 'bill', 'entertainment', 'exercise', 'media', 'medication', 'patient', 'people', 'reminderQueue',
        'shopping', 'stock', 'voice'];
    for (var i = 0; i < dbs.length; i++) {
        jibo.model._clearCollection(dbs[i]);
    }
});
