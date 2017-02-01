'use strict';

var EventEmitter = require('events');
var _ = require('lodash');

class EventBus extends EventEmitter {
    constructor () {

    }

    /**
     * Register a listener (function) to be triggered by the event
     * @param event String value of the event
     * @param listener The function to be called
     */
    addEventListener (event, listener) {

    }

    /**
     * Register a listener (function) to be triggered by the event ONCE
     * @param event String value of the event
     * @param listener The function to be called
     */
    addOnceEventListener (event, listener) {

    }

    /**
     * Deregister listener from the event
     * @param event String value of the event
     * @param listener The function to deregister
     */
    removeEventListener (event, listener) {

    }

    /**
     * Removes all event listeners
     */
    clear () {

    }

    /**
     * Fires the event with specified params
     * @param event String value of the event
     * @param params JS object with event params
     */
    emit (event, params) {

    }
}
