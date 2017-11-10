"use strict"

const config = require('../config/example.json');
const MongoClient = require("../index.js");
const mongo = new MongoClient(config.url);
const assert = require('assert');
let tempID = null;

describe("Mongo API", function() {

  describe("Methods", function() {

    it("#insertDocument", function(done) {
      let data = {};
      data.givenName = 'Jose';
      data.familyName = 'Barrios';
      data.email = 'jose@barrios.io';
      data.additionalName = "Luis";
      mongo.insertDocument('people', data).then(res => {
        tempID = res._id;
        done()
      }).catch(err =>{ done(err) })
    })

    it("#getDocumentByID", function(done) {
      mongo.getDocumentByID('people', tempID)
        .then(res => {
          done()
        })
        .catch(err =>{
          done(err)
        })
    })


    it("#searchCollectionsForDocumentWithID", function(done) {
      mongo.searchCollectionsForDocumentWithID(['x','y','z','people'], tempID)
        .then(res => { done() })
        .catch(err =>{ done(err) })
    })

    it("#updateDocument", function(done) {
      mongo.getDocumentByID('people', tempID).then(personData => {
				let updates = personData;
        updates.email = 'updated@email.com'
        mongo.updateDocument('people', tempID, updates)
          .then(res => { done(); })
          .catch(done)
      }).catch(done)
    })

		it("#deleteDocument", function(done) {
			mongo.deleteDocument('people', tempID)
				.then(res => { done() })
				.catch(err =>{ done(err) })
		})

    it("#createCollectionWithUniqueIndices", function(done) {
      mongo.createCollectionWithUniqueIndices('users', {email: 1})
        .then(res => { done() })
        .catch(err =>{ done(err) })
    })

    it("#createCollectionWithTemporaryDocuments", function(done) {
      const delay = 10;
      const COLLECTION = 'tests.temp'
      const timestampKey = 'dateSent'
      mongo.createCollectionWithTemporaryDocuments(COLLECTION, timestampKey, delay)
        .then(res => {
          let document = {};
          document[timestampKey] = new Date();
          mongo.insertDocument(COLLECTION, document)
            .then(documentID => {
              done();
            }).catch(err =>{
              console.log('MAILER ERROR:', err)
              done(err)
            })
        }).catch(err =>{
          console.error('MAILER ERROR:', err)
          done(err)
        })
    })

    it("#done", function(done) {
      mongo.disconnect()
        .then(res => {
          assert(res, true)
          done();
        })
        .catch(done)
    })



  });
});