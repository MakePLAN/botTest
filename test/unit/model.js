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

describe('Model', function () {
    var model = new Model();
    var tempFiles = {
        'appointment': './db/test-appointment.db',
        'bill': './db/test-bill.db',
        'entertainment': './db/test-entertainment.db',
        'exercise': './db/test-exercise.db',
        'media': './db/test-media.db',
        'medication': './db/test-medication.db',
        'patient': './db/test-patient.db',
        'people': './db/test-people.db',
        'reminderQueue': './db/test-reminderQueue.db',
        'shopping': './db/test-shopping.db',
        'stock': './db/test-stock.db',
        'voice': './db/test-voice.db'
    };

    before(function (done) {
        //  Use temporary db files for testing
        var functions = [];
        Object.keys(tempFiles).forEach(key => {
            model._db[key] = new Datastore(tempFiles[key]);
            functions.push(function (cb) {
                model._db[key].loadDatabase();
                cb();
            });
        });
        async.parallel(functions, done);
    });

    after(function () {
        //  Delete the temp db files
        Object.keys(tempFiles).forEach(key => {
            fs.unlink(tempFiles[key], err => {
                assert.equal(err, null);
            });
        });

        console.log('\n***NOTE: YOU CAN IGNORE THE DEPRECATION WARNING ABOUT ISO FORMAT');
    });

    afterEach(function (done) {
        //  Clear contents of each temp db file
        var functions = [];
        Object.keys(tempFiles).forEach(key => {
            functions.push(function (cb) {
                model._db[key].remove({}, { multi: true }, cb);
            });
        });
        async.parallel(functions, function (err, results) {
            assert.equal(err, null);
            done();
        });
    });

    var mockRepeat = {
        type: 'winning',
        startTime: moment().format(),
        endTime: moment().format(),
        interval: '10w'
    };
    var mockRemind = {
        type: 'much winning',
        numReminders: 1337,
        interval: '3y',
        startTime: moment().format()
    };

    describe('#getTodaySchedule()', function () {
        var insertManual = function (data, cb) {
            var doc = {};
            doc[data.time] = data.timeValue;

            model._db[data.col].insert(doc, function (err, doc) {
                cb(err);
            });
        };

        it('should return 4 events for today', function (done) {
            //  Manually insert the docs
            var funcs = [
                insertManual.bind(null, {
                    time: 'time',
                    timeValue: moment().toISOString(),
                    col: 'appointment'
                }),
                insertManual.bind(null, {
                    time: 'lastTaken',
                    timeValue: moment().toISOString(),
                    col: 'medication'
                }),
                insertManual.bind(null, {
                    time: 'time',
                    timeValue: moment().toISOString(),
                    col: 'exercise'
                }),
                insertManual.bind(null, {
                    time: 'time',
                    timeValue: moment().toISOString(),
                    col: 'bill'
                })
            ];

            //  Run inserts in parallel
            async.parallel(funcs, function (err, cb) {
                assert.equal(err, null);

                model.getTodaySchedule(function (err, docs) {
                    assert.equal(err, null);
                    assert.equal(docs.length, 4);
                    done();
                });
            });
        });

        it('should return 2 events for today because other 2 are not today', function (done) {
            //  Manually insert the docs
            var funcs = [
                insertManual.bind(null, {
                    time: 'time',
                    timeValue: moment().toISOString(),
                    col: 'appointment'
                }),
                insertManual.bind(null, {
                    time: 'lastTaken',
                    timeValue: moment().toISOString(),
                    col: 'medication'
                }),
                insertManual.bind(null, {
                    time: 'time',
                    timeValue: moment().add(1, 'days').toISOString(),   //  Should not be returned because tomorrow
                    col: 'exercise'
                }),
                insertManual.bind(null, {
                    time: 'time',
                    timeValue: moment().subtract(1, 'days').toISOString(),  //  Should not be returned because yesterday
                    col: 'bill'
                })
            ];

            //  Run inserts in parallel
            async.parallel(funcs, function (err, cb) {
                assert.equal(err, null);

                model.getTodaySchedule(function (err, docs) {
                    assert.equal(err, null);
                    assert.equal(docs.length, 2);
                    done();
                });
            });
        });

        it('should return 2 events for today because other 2 collections are empty', function (done) {
            //  Manually insert the docs
            var funcs = [
                insertManual.bind(null, {
                    time: 'time',
                    timeValue: moment().toISOString(),
                    col: 'appointment'
                }),
                insertManual.bind(null, {
                    time: 'lastTaken',
                    timeValue: moment().toISOString(),
                    col: 'medication'
                })
            ];

            //  Run inserts in parallel
            async.parallel(funcs, function (err, cb) {
                assert.equal(err, null);

                model.getTodaySchedule(function (err, docs) {
                    assert.equal(err, null);
                    assert.equal(docs.length, 2);
                    done();
                });
            });
        });

        it('should return 0 events because all are not today', function (done) {
            //  Manually insert the docs
            var funcs = [
                insertManual.bind(null, {
                    time: 'time',
                    timeValue: moment().subtract(1, 'days').toISOString(),  //  Should not be returned because yesterday
                    col: 'appointment'
                }),
                insertManual.bind(null, {
                    time: 'lastTaken',
                    timeValue: moment().add(1, 'days').toISOString(),   //  Should not be returned because tomorrow
                    col: 'medication'
                }),
                insertManual.bind(null, {
                    time: 'time',
                    timeValue: moment().add(1, 'days').toISOString(),   //  Should not be returned because tomorrow
                    col: 'exercise'
                }),
                insertManual.bind(null, {
                    time: 'time',
                    timeValue: moment().subtract(1, 'days').toISOString(),  //  Should not be returned because yesterday
                    col: 'bill'
                })
            ];

            //  Run inserts in parallel
            async.parallel(funcs, function (err) {
                assert.equal(err, null);

                model.getTodaySchedule(function (err, docs) {
                    assert.equal(err, null);
                    assert.equal(docs.length, 0);
                    done();
                });
            });
        });
    });

    describe('#getEntertainment()', function () {
        beforeEach(function (done) {
            //  Push in some entertainment docs
            var entertain = function (params, cb) {
                model._db.entertainment.insert(params, function (err, docs) {
                    cb(err);
                });
            };

            var funcs = [];
            var extra = ['typeA', 'typeB'];
            for (var i = 0; i < 10; i++) {
                funcs.push(entertain.bind(null, {
                    extra: extra[Math.floor(i / 5)],
                    rating: i,
                    lastUsed: moment().subtract(i, 'days').toISOString()
                }));
            }

            async.parallel(funcs, function (err) {
                assert.equal(err, null);
                done();
            });
        });


        it('should get entertainment with no custom params', function (done) {
            model.getEntertainment({
                extra: 'typeA'
            }, function (err, doc, numDocs) {
                assert.equal(err, null);
                assert.equal(doc.extra, 'typeA');
                assert.equal(numDocs, 5);
                done();
            });
        });

        it('should get entertainment with rating custom params', function (done) {
            model.getEntertainment({
                extra: 'typeB',
                custom: {
                    ratingMin: 6
                }
            }, function (err, doc, numDocs) {
                assert.equal(err, null);
                assert.equal(doc.extra, 'typeB');
                expect(doc.rating).to.be.at.least(6);
                assert.equal(numDocs, 4);

                model.getEntertainment({
                    extra: 'typeB',
                    custom: {
                        ratingMin: 6,
                        ratingMax: 8
                    }
                }, function (err, doc, numDocs) {
                    assert.equal(err, null);
                    assert.equal(doc.extra, 'typeB');
                    expect(doc.rating).to.be.at.least(6).and.at.most(8);
                    assert.equal(numDocs, 3);
                    done();
                });
            });
        });

        it('should get entertainment with lastUsed custom params', function (done) {
            model.getEntertainment({
                extra: 'typeA',
                custom: {
                    notUsedSince: moment().subtract(3, 'days').toISOString()
                }
            }, function (err, doc, numDocs) {
                assert.equal(err, null);
                assert.equal(doc.extra, 'typeA');
                assert.equal(numDocs, 2);

                model.getEntertainment({
                    extra: 'typeB',
                    custom: {
                        notUsedSince: moment().subtract(6, 'days').toISOString(),
                        notUsedBefore: moment().subtract(8, 'days').toISOString()
                    }
                }, function (err, doc, numDocs) {
                    assert.equal(err, null);
                    assert.equal(doc.extra, 'typeB');
                    assert.equal(numDocs, 2);
                    done();
                });
            });
        });

        it('should get entertainment with both lastUsed and rating', function (done) {
            model.getEntertainment({
                custom: {
                    notUsedSince: moment().subtract(4, 'days').toISOString(),
                    ratingMin: 7
                }
            }, function (err, doc, numDocs) {
                assert.equal(err, null);
                assert.equal(numDocs, 3);
                done();
            });
        });
    });

    describe('#getPatientInfo()', function () {
        it('should get docs matching the params', function (done) {
            //  Manually insert docs
            model._db.patient.insert([{
                type: 'health',
                subType: 'weight'
            }, {
                type: 'health',
                subType: 'blood pressure'
            }], function (err, docs) {
                assert.equal(err, null);

                model.getPatientInfo({
                    type: 'health'
                }, function (err, docs) {
                    assert.equal(err, null);
                    assert.equal(docs.length, 2);
                    done();
                });
            });
        });

        it('should get no docs matching the params', function (done) {
            //  Manually insert docs
            model._db.patient.insert([{
                type: 'health'
            }, {
                random: 'health'
            }], function (err, docs) {
                assert.equal(err, null);

                model.getPatientInfo({
                    random: 'param'
                }, function (err, docs) {
                    assert.equal(err, null);
                    assert.equal(docs.length, 0);
                    done();
                });
            });
        });
    });

    describe('#getPersonInfo()', function () {
        it('should get person without custom params', function (done) {
            //  Manually insert docs
            model._db.people.insert([{
                first: 'Eric',
                last: 'Dong'
            }, {
                first: 'Dave',
                last: 'Barnhart'
            }], function (err, docs) {
                assert.equal(err, null);

                model.getPersonInfo({
                    first: 'Eric'
                }, function (err, docs) {
                    assert.equal(err, null);
                    assert.equal(docs.length, 1);
                    done();
                });
            });
        });

        it('should get person with custom params', function (done) {
            //  Manually insert docs
            model._db.people.insert([{
                first: 'Eric',
                closeness: 4
            }, {
                first: 'Eric',
                closeness: 8
            }, {
                first: 'Dave',
                closeness: 10
            }, {
                first: 'Dave',
                closeness: 2
            }], function (err, docs) {
                assert.equal(err, null);

                var funcs = [
                    function (cb) {
                        model.getPersonInfo({
                            first: 'Eric',
                            custom: { closenessMin: 5 }
                        }, function (err, docs) {
                            assert.equal(err, null);
                            assert.equal(docs.length, 1);
                            cb();
                        });
                    },
                    function (cb) {
                        model.getPersonInfo({
                            custom: { closenessMax: 8 }
                        }, function (err, docs) {
                            assert.equal(err, null);
                            assert.equal(docs.length, 3);
                            cb();
                        });
                    }
                ];

                async.parallel(funcs, function () {
                    done();
                });
            });
        });
    });

    describe('#getNextReminder()', function () {
        it('should get correct reminder', function (done) {
            //  Manually insert
            model._db.reminderQueue.insert([{
                name: 'event1',
                time: moment().add(1, 'hour').toISOString()
            }, {
                name: 'event2',
                time: moment().add(2, 'hour').toISOString()
            }, {
                name: 'event3',
                time: moment().add(3, 'hour').toISOString()
            }, {
                name: 'event4',
                time: moment().add(4, 'hour').toISOString()
            }], function (err, docs) {
                assert.equal(err, null);

                model.getNextReminder(function (err, doc) {
                    assert.equal(err, null);
                    assert.equal(doc.name, 'event1');
                    done();
                });
            });
        });

        it('should get correct reminder and clear past reminders', function (done) {
            //  Manually insert
            model._db.reminderQueue.insert([{
                name: 'event1',
                time: moment().subtract(2, 'hour').toISOString()
            }, {
                name: 'event2',
                time: moment().subtract(1, 'hour').toISOString()
            }, {
                name: 'event3',
                time: moment().add(1, 'hour').toISOString()
            }], function (err, docs) {
                assert.equal(err, null);

                model.getNextReminder(function (err, doc) {
                    assert.equal(err, null);
                    assert.equal(doc.name, 'event3');
                    done();
                });
            });
        });

        it('should not break if no reminders', function (done) {
            model.getNextReminder(function (err, doc) {
                assert.equal(err, null);
                assert.equal(doc, undefined);
                done();
            });
        });
    });

    describe('#getMedia()', function () {
        it('should get media without custom params', function (done) {
            //  Manually insert
            model._db.media.insert([{
                type: 'photo',
                name: 'bottle'
            }, {
                type: 'photo',
                name: 'lamp'
            }], function (err, docs) {
                assert.equal(err, null);

                model.getMedia({
                    type: 'photo'
                }, function (err, docs) {
                    assert.equal(err, null);
                    assert.equal(docs.length, 2);
                    done();
                });
            });
        });

        it('should get media with viewed custom params', function (done) {
            //  Manually insert
            model._db.media.insert([{
                type: 'photo1',
                timesViewed: 1
            }, {
                type: 'photo2',
                timesViewed: 2
            }, {
                type: 'photo3',
                timesViewed: 3
            }, {
                type: 'photo4',
                timesViewed: 4
            }], function (err, docs) {
                assert.equal(err, null);

                model.getMedia({
                    custom: {
                        viewedMin: 2
                    }
                }, function (err, docs) {
                    assert.equal(err, null);
                    assert.equal(docs.length, 3);

                    model.getMedia({
                        custom: {
                            viewedMin: 2,
                            viewedMax: 3
                        }
                    }, function (err, docs) {
                        assert.equal(err, null);
                        assert.equal(docs.length, 2);
                        done();
                    });
                });
            });
        });

        it('should get media with timeTaken custom params', function (done) {
            //  Manually insert
            model._db.media.insert([{
                type: 'photo1',
                timeTaken: moment().add(1, 'days').toISOString()
            }, {
                type: 'photo2',
                timeTaken: moment().add(2, 'days').toISOString()
            }, {
                type: 'photo3',
                timeTaken: moment().add(3, 'days').toISOString()
            }, {
                type: 'photo4',
                timeTaken: moment().add(4, 'days').toISOString()
            }], function (err, docs) {
                assert.equal(err, null);

                model.getMedia({
                    custom: {
                        beforeDate: moment().add(3, 'days').toISOString()
                    }
                }, function (err, docs) {
                    assert.equal(err, null);
                    assert.equal(docs.length, 3);

                    model.getMedia({
                        custom: {
                            beforeDate: moment().add(4, 'days').toISOString(),
                            afterDate: moment().add(2, 'days').toISOString()
                        }
                    }, function (err, docs) {
                        assert.equal(err, null);
                        assert.equal(docs.length, 2);
                        done();
                    });
                });
            });
        });
    });

    describe('#getNextEvent()', function () {
        it('should get correct event', function (done) {
            //  Manually insert
            model._db.appointment.insert([{
                name: 'fire',
                value: 1,
                time: moment().add(1, 'days').toISOString()
            }, {
                name: 'fire',
                value: 2,
                time: moment().add(2, 'days').toISOString()
            }, {
                name: 'water',
                value: 3,
                time: moment().add(3, 'days').toISOString()
            }, {
                name: 'water',
                value: 4,
                time: moment().add(4, 'days').toISOString()
            }], function (err, docs) {
                assert.equal(err, null);

                model.getNextEvent(util.JIBO_EVENT_TYPE.APPOINTMENT, {
                    name: 'water'
                }, function (err, doc) {
                    assert.equal(err, null);
                    assert.equal(doc.name, 'water');
                    assert.equal(doc.value, 3);
                    done();
                });
            });
        });

        it('should not break for empty collection', function (done) {
            model.getNextEvent(util.JIBO_EVENT_TYPE.APPOINTMENT, {}, function (err, doc) {
                assert.equal(err, null);
                assert.equal(doc, null);
                done();
            });
        });
    });

    describe('#getVoice()', function () {
        it('should get correct voice', function (done) {
            //  Manually insert
            model._db.voice.insert([{
                type: 'greeting',
                line: 'hihihihihi'
            }, {
                type: 'goodbye',
                line: 'byebyebyebyebye'
            }], function (err, docs) {
                assert.equal(err, null);

                model.getVoice({
                    type: 'greeting'
                }, function (err, docs) {
                    assert.equal(err, null);
                    assert.equal(docs.length, 1);
                    assert.equal(docs[0].line, 'hihihihihi');
                    done();
                });
            });
        });
    });

    describe('#addAppointment()', function () {
        it('should add appointment', function (done) {
            model.addAppointment({
                type: 'dentist',
                people: ['Eddie Redmayne', 'Sarah Zhou'],
                time: moment().format(),
                repeatInfo: mockRepeat,
                reminderInfo: mockRemind
            }, function (err, doc) {
                assert.equal(err, null);
                expect(doc).to.include.keys('type', 'people', 'time', 'repeatInfo', 'reminderInfo');
                done();
            });
        });

        it('should fail to add appointment because missing key', function (done) {
            model.addAppointment({
                garbage: 'garbage'
            }, function (err, doc) {
                assert.equal(err, Errors.KEY_MISSING);
                assert.equal(doc, null);
                done();
            });
        });

        it('should fail to add appointment because invalid date', function (done) {
            model.addAppointment({
                type: 'dentist',
                people: ['Eddie Redmayne', 'Sarah Zhou'],
                time: 'nonsense',
                repeatInfo: mockRepeat,
                reminderInfo: mockRemind
            }, function (err, doc) {
                assert.equal(err, Errors.INVALID_DATE);
                assert.equal(doc, null);
                done();
            });
        });
    });

    describe('#addMedication()', function () {
        it('should add medication', function (done) {
            model.addMedication({
                name: 'Donald Trump',
                type: 'makeyougreatagain',
                lastTaken: moment().format(),
                repeatInfo: mockRepeat,
                reminderInfo: mockRemind
            }, function (err, doc) {
                assert.equal(err, null);
                expect(doc).to.include.keys('name', 'type', 'lastTaken', 'repeatInfo', 'reminderInfo');
                done();
            });
        });

        it('should fail to add medication because missing key', function (done) {
            model.addMedication({
                garbage: 'garbage'
            }, function (err, doc) {
                assert.equal(err, Errors.KEY_MISSING);
                assert.equal(doc, null);
                done();
            });
        });

        it('should fail to add medication because invalid date', function (done) {
            model.addMedication({
                name: 'Donald Trump',
                type: 'makeyougreatagain',
                lastTaken: 'nonsense',
                repeatInfo: mockRepeat,
                reminderInfo: mockRemind
            }, function (err, doc) {
                assert.equal(err, Errors.INVALID_DATE);
                assert.equal(doc, null);
                done();
            });
        });
    });

    describe('#addExercise()', function () {
        it('should add exercise', function (done) {
            model.addExercise({
                name: 'Go running',
                time: moment().format(),
                repeatInfo: mockRepeat,
                reminderInfo: mockRemind
            }, function (err, doc) {
                assert.equal(err, null);
                expect(doc).to.include.keys('name', 'repeatInfo', 'reminderInfo');
                done();
            });
        });

        it('should fail to add exercise because missing key', function (done) {
            model.addExercise({
                garbage: 'garbage'
            }, function (err, doc) {
                assert.equal(err, Errors.KEY_MISSING);
                assert.equal(doc, null);
                done();
            });
        });

        it('should fail to add exercise because invalid date', function (done) {
            model.addExercise({
                name: 'Go running',
                time: 'nonsense',
                repeatInfo: mockRepeat,
                reminderInfo: mockRemind
            }, function (err, doc) {
                assert.equal(err, Errors.INVALID_DATE);
                assert.equal(doc, null);
                done();
            });
        });
    });

    describe('#addShopping()', function () {
        it('should add shopping list', function (done) {
            model.addShopping({
                toPurchase: ['things', 'more things'],
                repeatInfo: mockRepeat,
                reminderInfo: mockRemind
            }, function (err, doc) {
                assert.equal(err, null);
                expect(doc).to.include.keys('toPurchase', 'repeatInfo', 'reminderInfo');
                done();
            });
        });

        it('should add shopping record', function (done) {
            model.addShopping({
                date: moment().format(),
                itemsBought: [{
                    name: 'eraser',
                    amount: 12
                }, {
                    name: 'scissors',
                    amount: 3
                }]
            }, function (err, doc) {
                assert.equal(err, null);
                expect(doc).to.include.keys('date', 'itemsBought');
                done();
            });
        });

        it('should fail because bad list', function (done) {
            model.addShopping({
                toPurchase: ['things', 'more things'],
                repeatInfo: 'wat'
            }, function (err, doc) {
                assert.equal(err, Errors.KEY_MISSING);
                assert.equal(doc, null);
                done();
            });
        });

        it('should fail because bad record', function (done) {
            model.addShopping({
                date: 'fake time'
            }, function (err, doc) {
                assert.equal(err, Errors.KEY_MISSING);
                assert.equal(doc, null);
                done();
            });
        });

        it('should fail because bad itemsBought', function (done) {
            model.addShopping({
                date: 'fake time',
                itemsBought: [{
                    name: 'ketchup',
                    amount: 7
                }, {
                    name: 'eyemask',
                    wat: 'wat'
                }]
            }, function (err, doc) {
                assert.equal(err, Errors.KEY_MISSING);
                assert.equal(doc, null);
                done();
            });
        });
    });

    describe('#addToStock()', function () {
        it('should add to Stock collection', function (done) {
            model.addToStock({
                type: 'technology',
                name: 'iphone',
                amount: 20
            }, function (err, doc) {
                assert.equal(err, null);
                expect(doc).to.include.keys('type', 'name', 'amount');
                done();
            });
        });

        it('should fail to add Stock', function (done) {
            model.addToStock({
                random: 'nonsense'
            }, function (err, doc) {
                assert.equal(err, Errors.KEY_MISSING);
                assert.equal(doc, null);
                done();
            });
        });
    });

    describe('#addBill()', function () {
        it('should add to Bill collection', function (done) {
            model.addBill({
                type: 'electricity',
                amount: '150',
                time: moment().format(),
                repeatInfo: mockRepeat,
                reminderInfo: mockRemind
            }, function (err, doc) {
                assert.equal(err, null);
                expect(doc).to.include.keys('type', 'amount', 'repeatInfo', 'reminderInfo');
                done();
            });
        });

        it('should fail to add to Bill', function (done) {
            model.addBill({
                random: 'nonsense'
            }, function (err, doc) {
                assert.equal(err, Errors.KEY_MISSING);
                assert.equal(doc, null);
                done();
            });
        });
    });

    describe('#addReminder()', function () {
        it('should add new Reminder to collection', function (done) {
            //  Manually insert an event
            model._db.appointment.insert({
                _id: 'alksdjhfi3j928htger'
            }, function (err, docs) {
                assert.equal(err, null);

                model.addReminder({
                    type: 'appointment',
                    event: {
                        _id: 'alksdjhfi3j928htger'
                    },
                    time: moment().format()
                }, function (err, doc) {
                    assert.equal(err, null);
                    expect(doc).to.include.keys('type', 'event', 'time');
                    done();
                });
            });
        });

        it('should fail for missing key', function (done) {
            model.addReminder({
                why: 'tho'
            }, function (err, doc) {
                assert.equal(err, Errors.KEY_MISSING);
                assert.equal(doc, null);
                done();
            });
        });

        it('should fail for bad _id', function (done) {
            //  Manually insert an event
            model._db.appointment.insert({
                _id: 'alksdjhfi3j928htger'
            }, function (err, docs) {
                assert.equal(err, null);

                model.addReminder({
                    type: 'appointment',
                    event: {
                        _id: 'such a terrible id'
                    },
                    time: moment().format()
                }, function (err, doc) {
                    assert.equal(err, Errors.BAD_DOC_ID);
                    assert.equal(doc, null);
                    done();
                });
            });
        });
    });

    describe('#addPatientInfo()', function () {
        it('should add new info', function (done) {
            model.addPatientInfo({
                type: 'favorite',
                subType: 'game',
                value: 'hopscotch'
            }, function (err, doc) {
                assert.equal(err, null);
                expect(doc).to.include.keys('type', 'subType', 'value');
                done();
            });
        });

        it('should fail to add info', function (done) {
            model.addPatientInfo({
                random: 'nonsense'
            }, function (err, doc) {
                assert.equal(err, Errors.KEY_MISSING);
                assert.equal(doc, null);
                done();
            });
        });
    });

    describe('#addPerson()', function () {
        it('should add new person', function (done) {
            model.addPerson({
                first: 'Eric',
                last: 'Dong',
                relationship: 'bff forever',
                closeness: 10,
                birthday: moment().format()
            }, function (err, doc) {
                assert.equal(err, null);
                expect(doc).to.include.keys('first', 'last', 'relationship', 'closeness', 'birthday');
                done();
            });
        });

        it('should fail to add person', function (done) {
            model.addPerson({
                utter: 'nonsense'
            }, function (err, doc) {
                assert.equal(err, Errors.KEY_MISSING);
                assert.equal(doc, null);
                done();
            });
        });
    });

    describe('#addMedia()', function () {
        it('should add new media', function (done) {
            model.addMedia({
                type: 'photo',
                occasion: 'wedding',
                file: 'media/music/banana.mp3',
                timesViewed: 0
            }, function (err, doc) {
                assert.equal(err, null);
                expect(doc).to.include.keys('type', 'occasion', 'file', 'timesViewed');
                done();
            });
        });

        it('should fail to add media', function (done) {
            model.addMedia({
                utter: 'nonsense'
            }, function (err, doc) {
                assert.equal(err, Errors.KEY_MISSING);
                assert.equal(doc, null);
                done();
            });
        });
    });

    describe('#addEntertainment()', function () {
        it('should add new entertainment', function (done) {
            model.addEntertainment({
                type: 'riddle',
                dateAdded: moment().format(),
                lastUsed: moment().format(),
                rating: 2
            }, function (err, doc) {
                assert.equal(err, null);
                expect(doc).to.include.keys('type', 'dateAdded', 'lastUsed', 'rating');
                done();
            });
        });

        it('should fail to add entertainment', function (done) {
            model.addEntertainment({
                not: 'entertaining'
            }, function (err, doc) {
                assert.equal(err, Errors.KEY_MISSING);
                assert.equal(doc, null);
                done();
            });
        });
    });

    describe('#addVoiceLine()', function () {
        it('should add new voice line', function (done) {
            model.addVoiceLine({
                type: 'greeting',
                line: 'Greetings adventurer!',
                dateAdded: moment().format()
            }, function (err, doc) {
                assert.equal(err, null);
                expect(doc).to.include.keys('type', 'line', 'dateAdded');
                done();
            });
        });

        it('should fail to add voice', function (done) {
            model.addVoiceLine({
                bad: 'voice'
            }, function (err, doc) {
                assert.equal(err, Errors.KEY_MISSING);
                assert.equal(doc, null);
                done();
            });
        });
    });

    describe('#_verifyCollectionParams()', function () {
        it('should fail because bad collection', function (done) {
            model._verifyCollectionParams('mouse', 'default', {}, true, function (err) {
                assert.equal(err, Errors.INVALID_COLLECTION);
                done();
            });
        });

        it('should fail because bad docType', function (done) {
            model._verifyCollectionParams('appointment', 'badbadbad', {}, true, function (err) {
                assert.equal(err, Errors.INVALID_DOCTYPE);
                done();
            });
        });
    });

    describe('#_checkForKeys()', function () {
        it('should be successful match', function (done) {
            assert.equal(model._checkForKeys({
                a: 'a',
                b: 'b',
                c: 'c'
            }, ['a', 'b', 'c']), true);
            done();
        });

        it('should be unsuccessful match', function (done) {
            assert.equal(model._checkForKeys({
                a: 'a',
                b: 'b',
                c: 'c'
            }, ['b', 'c', 'd']), false);
            done();
        });
    });

    describe('#_addToCollection()', function () {
        it('should be able to add single doc', function (done) {
            model._addToCollection('appointment', {
                hi: 'hi'
            }, function (err, doc) {
                assert.equal(err, null);
                expect(doc).to.include.keys('hi');
                done();
            });
        });

        it('should be able to add multiple docs', function (done) {
            model._addToCollection('appointment', [
                { how: 'are' },
                { you: 'doing' }
            ], function (err, docs) {
                assert.equal(err, null);
                assert.equal(docs.length, 2);
                done();
            });
        });
    });

    describe('#_getFromCollection()', function () {
        it('should get single doc from collection', function (done) {
            //  Manually insert a doc to test on
            model._db.appointment.insert({
                type: 'hype'
            }, function (err, docs) {
                assert.equal(err, null);

                model._getFromCollection('appointment', {
                    type: 'hype'
                }, function (err, docs) {
                    assert.equal(err, null);
                    assert.equal(docs.length, 1);
                    done();
                });
            });
        });

        it('should get multiple docs from collection', function (done) {
            //  Manually insert two docs to test on
            model._db.appointment.insert([{
                type: 'hype'
            }, {
                type: 'hype',
                level: 9000
            }], function (err, docs) {
                assert.equal(err, null);

                model._getFromCollection('appointment', {
                    type: 'hype'
                }, function (err, docs) {
                    assert.equal(err, null);
                    assert.equal(docs.length, 2);
                    done();
                });
            });
        });
    });

    describe('#_removeFromCollection()', function () {
        it('should remove multiple matching docs', function (done) {
            //  Manually insert 2 docs then remove
            model._db.appointment.insert([{
                type: 'hype'
            }, {
                type: 'hype',
                level: 9000
            }], function (err, docs) {
                assert.equal(err, null);

                model._removeFromCollection('appointment', {
                    type: 'hype'
                }, function (err, numRemoved) {
                    assert.equal(err, null);
                    assert.equal(numRemoved, 2);
                    done();
                });
            });
        });
    });

    describe('#_updateInCollection()', function () {
        it('should be able to replace with doc', function (done) {
            //  Manually insert doc to update
            model._db.appointment.insert({
                type: 'hype'
            }, function (err, docs) {
                assert.equal(err, null);

                model._updateInCollection('appointment', {
                    type: 'hype'
                }, {
                    totally: 'radically',
                    different: 'doc'
                }, function (err, numAffected, affectedDocs) {
                    assert.equal(err, null);
                    assert.equal(numAffected, 1);
                    assert.equal(affectedDocs[0].totally, 'radically');
                    assert.equal(affectedDocs[0].different, 'doc');
                    assert.equal(affectedDocs[0].type, null);
                    done();
                });
            });
        });

        it('should make specific update operations', function (done) {
            //  Manually insert doc to update
            model._db.appointment.insert({
                type: 'hype',
                level: 8999,
                wat: 'wat'
            }, function (err, docs) {
                assert.equal(err, null);

                model._updateInCollection('appointment', {
                    type: 'hype'
                }, {
                    $set: {
                        type: 'super hype'
                    },
                    $inc: {
                        level: 1
                    },
                    $unset: {
                        wat: 'wat'
                    }
                }, function (err, numAffected, affectedDocs) {
                    assert.equal(err, null);
                    assert.equal(numAffected, 1);
                    assert.equal(affectedDocs[0].type, 'super hype');
                    assert.equal(affectedDocs[0].level, 9000);
                    assert.equal(affectedDocs[0].wat, null);
                    done();
                });
            });
        });
    });

    describe('#_clearCollection()', function () {
        it('should delete everything in collection', function (done) {
            //  Manually insert a bunch of different docs
            model._db.appointment.insert([{
                cup: 'chocolate',
                fizz: 10
            }, {
                tea: {
                    type: 'bag',
                    caffeine: 'buzz buzz'
                },
                flowers: ['phone', 'mouse', 42]
            }, {
                lonely: 'object'
            }], function (err, docs) {
                assert.equal(err, null);

                model._clearCollection('appointment', function (err, numRemoved) {
                    assert.equal(err, null);
                    assert.equal(numRemoved, 3);
                    done();
                });
            });
        });
    });
});
