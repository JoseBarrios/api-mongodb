"use strict"

const config = require('../config.json');
const MongoClient = require("../index.js");
const ObjectID = require('mongodb').ObjectID;
const mongo = new MongoClient(config.url);
const assert = require('assert');
const chai = require('chai');
const expect = chai.expect;
const should = require('chai').should();
const refObjectId = ObjectID();

let secondaryTempID = null;
let tempID = null;


describe("Mongo API", function() {
  this.timeout(5000);

  describe("Methods", function() {

    it("ObjectID", function() {
			assert.deepEqual(mongo.ObjectID, ObjectID)
    })

    it("#insertDocument", function(done) {
      let data = {};
      data.givenName = 'Jose';
      data.familyName = 'Barrios';
      data.email = 'jose@barrios.io';
      data.additionalName = "Luis";
      data.reference = refObjectId;
      mongo.insertDocument('people', data).then(res => {
        tempID = res._id;
        done()

        let address = {};
        address.street = "Main st";
        address._id = refObjectId;
        mongo.insertDocument("address", address);

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

    it("#getDocuments", async function() {
      let data = {};
      data.givenName = 'Sonia';
      data.familyName = 'Barrios';
      data.email = 'sonia@barrios.io';
      data.reference = refObjectId;
      mongo.insertDocument('people', data).then(res => {
        secondaryTempID = res._id;
        mongo.getDocuments('people', { reference: refObjectId})
          .then(async cursor => {
            const users = await cursor.toArray();
            users.should.have.length(2);
          })
      })
    })

    it("#aggregate", function(done) {

      const lookup = {
        "$lookup": {
          from: "address",
          localField: "reference",
          foreignField: "_id",
          as: "address"
        }
      };

      const pipeline = [];
      pipeline.push(lookup);

      mongo.aggregate("people", pipeline)
        .then(async res => {
          const people = await res.toArray();
          people.forEach( person => {
            expect(person.address[0]).to.have.property('street', "Main st");
          })
          done()
        })
        .catch(err =>{ done(err) })
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
        .then(res => {
          mongo.deleteDocument('people', secondaryTempID);
          done()
        })
				.catch(err =>{ done(err) })
		})

    it("#collectionWithUniqueIndices", function(done) {
      mongo.collectionWithUniqueIndices('users', {email: 1})
        .then(res => { done() })
        .catch(err =>{ done(err) })
    })

    it("#collectionWithTemporaryDocuments", function(done) {
      const delay = 10;
      const COLLECTION = 'tests.temp'
      const timestampKey = 'dateSent'
      mongo.collectionWithTemporaryDocuments(COLLECTION, timestampKey, delay)
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
