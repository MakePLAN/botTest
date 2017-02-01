'use strict';

var util = require('util');

util.JIBO_EVENT_TYPE = {
    'APPOINTMENT': 'appointment',
    'MEDICATION': 'medication',
    'EXERCISE': 'exercise',
    'EATING': 'stock',
    'SHOPPING': 'shopping',
    'BILL': 'bill'
};

module.exports = util;
