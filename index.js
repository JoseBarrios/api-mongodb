'use strict'

const MongoClient = require('mongodb').MongoClient;
const Server = require('mongodb').Server
const ObjectID = require('mongodb').ObjectID;
const assert = require('assert');


class MongoAPI {

  static ObjectID(id){
    return ObjectID(id);
  }

  static isObjectID(id){
    return ObjectID.isValid(id);
  }

  constructor(url) {

    const _mongo = {};
    _mongo.state = {};
    _mongo.state.connecting = true;
    _mongo.state.connected = false;

    _mongo.connection = () => {
      return new Promise((resolve, reject) => {
      //if already exists
        if(_mongo.state.connected){
          //return database
          resolve(_mongo.db)
        }
        else{
          //Connect and send database
          MongoClient.connect(url, (err, db) => {
            assert.ifError(err);
            _mongo.state.connecting = false;
            _mongo.state.connected = true;
            _mongo.db = db;
            resolve(_mongo.db);
          });
        }
      })
    }

    //PRIVATE CONNECTION
    this.close = () => {
      return new Promise((resolve, reject)=>{
        if(_mongo.state.connected){
          _mongo.connection().then(db => {
            db.close();
            _mongo.state.connected = false;
            _mongo.state.connecting = false;
            resolve(true)
          }).catch(reject)
        } else { resolve(true) }
      })
    }

    // Attach _mongo props to this
    _mongo.properties = new Map();
    _mongo.properties.set(this, _mongo);


    // Priviledged method
    this.state = {};
    this.state.connecting = () => {
      return _mongo.properties.get(this).connecting;
    }
    this.state.connected = () => {
      return _mongo.properties.get(this).connected;
    }

    ///////////////////////////////////////////////////////
    //
    //  1.0 READY
    //
    ///////////////////////////////////////////////////////


    //Inserts one, or multiple documents to a collection
    this.insertOne = (collectionName, document, options) => {
      return new Promise((resolve, reject) => {
        _mongo.connection().then(db => {
          const collection = db.collection(collectionName)
          collection.insertOne(document, options, function(err, result){
            if(err){ reject(err); }
            else{
              let response = result.ops[0];
              resolve(response)
            }
          })
        })
      })
    }

    //Selects documents in a collection and returns a cursor to the selected documents.
    this.find = (collectionName, query, projection) => {
      return new Promise((resolve, reject) => {
        _mongo.connection().then(db => {
          const collection = db.collection(collectionName)
          collection.find(query, projection, function(err, result){
            if(err){ reject(err) }
            else{ resolve(result) }
          })
        })
      })
    }

    //Returns the first document that satisfies the specified query criteria
    this.findOne = (collectionName, query, projection) => {
      return new Promise((resolve, reject) =>{
        _mongo.connection().then(db => {
          const collection = db.collection(collectionName)
          collection.findOne(query, projection, function(err, result){
            if(err){ reject(err)}
            else if(!result) {
              let msg = `Query into '${collectionName}' collection returned no documents: ${JSON.stringify(query)}`;
              reject(new Error(msg))
            } else{
              resolve(result)
            }
          })
        });
      })
    }

    //Updates a single document based on the filter and sort criteria.
    this.findOneAndUpdate = (collectionName, filter, update, options) => {
      return new Promise((resolve, reject) =>{
        _mongo.connection().then(db => {
          const collection = db.collection(collectionName)
          collection.findOneAndUpdate(filter, update, options, function(err,res){
            if(err){ reject(err)}
            else { resolve(res) }
          })
        });
      })
    }

    //Finds the first document that matches the filter, deletes it.
    this.findOneAndDelete = (collectionName, filter, options) => {
      return new Promise((resolve, reject) =>{
        _mongo.connection().then(db => {
          const collection = db.collection(collectionName);
          collection.findOneAndDelete(filter, options, function(err, res){
            if(err){ reject(err)}
            else{ resolve(res)}
          })
        });
      })
    }

    this.createIndex = (collectionName, keys, options) => {
      return new Promise((resolve, reject) =>{
        _mongo.connection().then(db => {
          const collection = db.collection(collectionName);
          collection.createIndex(keys, options)
            .then(resolve)
            .catch(reject)
        });
      })
    }


  } //END OF CONSTRUCTOR

	get ObjectID(){
		return ObjectID;
	}

  ///////////////////////////////////////
  //
  //  CONVINENCE METHODS
  //
  //////////////////////////////////////

  //Inserts a document, returns its _id
  insertDocument(collectionName, document, options){
    return new Promise((resolve, reject) => {
      this.insertOne(collectionName, document, options)
        .then(result => {
          resolve(result)
        })
        .catch(reject);
    });
  }

  //Returns first document that match query
  getDocument(collectionName, query, projection){
    return new Promise((resolve, reject) => {
      this.findOne(collectionName, query, projection)
        .then(resolve)
        .catch(reject);
    });
  }

  //Returns ALL documents that match query
  getDocuments(collectionName, query, projection){
    return new Promise((resolve, reject) => {
      this.find(collectionName, query, projection)
        .then(resolve)
        .catch(reject);
    });
  }

  //Finds document with matching ID
  getDocumentByID(collectionName, documentID, projection){
    return new Promise((resolve, reject) => {
      let _id = ObjectID(documentID);
      let query = {_id};
      this.findOne(collectionName, query, projection)
        .then(resolve)
        .catch(reject);
      });
  }

  getDocumentsByID(queries){
    return new Promise((resolve, reject) => {
      let promises = [];
      queries.forEach(query => {
        var collection = query.collection;
        var id = query.id;
        var promise = new Promise((resolve, reject) => {
          this.getDocumentByID(collection, id).then(resolve).catch(resolve);
        })
        promises.push(promise)
      })
      return Promise.all(promises).then(results => {
        let response = {};
        response.errors = [];
        results.forEach(result => {
          if(result._id){ response[result._id] = result; }
          else { response.errors.push(result) }
        })
        resolve(response)
      }).catch(reject)
    });
  }

  updateDocument(collectionName, documentID, updates, options){
    return new Promise((resolve, reject) => {
      let _id = ObjectID(documentID);
      let filter = {_id};
      this.findOneAndUpdate(collectionName, filter, updates, options)
        .then(resolve)
        .catch(reject)
    });
  }

  deleteDocument(collectionName, documentID, options){
    return new Promise((resolve, reject) => {
      let filter = {};
      filter._id = ObjectID(documentID);
      this.findOneAndDelete(collectionName, filter, options)
        .then(resolve)
        .catch(reject)
    });
  }


  ///////////////////////////////////
  //
  // ADVANCED METHODS
  //
  /////////////////////////////////

  searchCollectionsForDocumentWithID(collections, documentID){
    return new Promise((resolve, reject) => {
      let numCollections = collections.length;
      let numResponses = 0;
      collections.forEach(collection => {
        this.getDocumentByID(collection, documentID)
          .then(result =>{
            numResponses++;
            resolve(result);
          })//ERRORS:
          .catch(error => {
            numResponses++;
            //That was the last possible collection
            //Where the document could be, return error
            if(numResponses === numCollections){
              let msg = `Document ${documentID} not found in collections: ${collections}`;
              let error = new Error(msg);
              reject(error)
            }
          })
      })
    });
  }

  collectionWithUniqueIndices(collectionName, uniqueIndeces){
    return new Promise((resolve, reject) => {
      const unique = true;
      this.createIndex(collectionName, uniqueIndeces, {unique})
        .then(resolve)
        .catch(reject)
    })
  }

  collectionWithTemporaryDocuments(collectionName, timestampKey, durationInSeconds){
    return new Promise((resolve, reject) => {
      let observable = {};
      observable[timestampKey] = 1;
      let duration = {};
      duration.expireAfterSeconds = durationInSeconds
      this.createIndex(collectionName, observable, duration)
        .then(resolve)
        .catch(reject)
    })
  }

  disconnect(){ return this.close(); }
}

module.exports = MongoAPI;
