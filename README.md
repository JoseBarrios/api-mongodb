# api-mongodb
A non-relational database wrapper for MongoDB

#### Requirements:
1. mongodb 2.2.10

#### Getting started
Make sure your database is running and listening on port 27017. You can do that by running ```bash $ mongod```.

Once the database is running, and your configuration is in place, you can run this package:
```bash
$ npm install;
$ npm test;
$ npm start;

```

#### Basic usage
```javascript
const MongoClient = require("api-mongodb");
const url = 'mongodb://localhost:27017/test';
const mongo = new MongoClient(url);

let person = {};
person.givenName = 'Jose';
person.familyName = 'Barrios';

//Insert document to collection
mongo.insertDocument('people', data)
    .then(res => {
        //Do something with DB response
        console.log(res);
    })
    .catch(err =>{
        //Handle error response
        console.error(err);
    })
```


#### Public Methods
Operation  | Parameters | Unit test
------------- | ------------- | --------------
[insertDocument](http://mongodb.github.io/node-mongodb-native/2.2/api/Collection.html?_ga=2.100217182.1931688347.1510228797-1513901012.1503908404#insertOne) |  **collection**:String, **data**:Object | ✓ 
[getDocumentByID](http://mongodb.github.io/node-mongodb-native/2.2/api/Collection.html#findOne)   | **id**:ObjectID | ✓
[updateDocument](http://mongodb.github.io/node-mongodb-native/2.2/api/Collection.html#findOneAndUpdate) | **collection**:String, **id**:ObjectID, **data**:Object | ✓ 
[deleteDocument](http://mongodb.github.io/node-mongodb-native/2.2/api/Collection.html#deleteOne) | { **collection**:String, **id**:ObjectID } | ✓

#### Tests

```bash
$ npm test
```

```bash
  Mongo API
    Methods
      ✓ insertDocument
      ✓ getDocumentByID
      ✓ searchCollectionsForDocumentWithID
      ✓ updateDocument
      ✓ deleteDocument
      ✓ createCollectionWithUniqueIndices
      ✓ createCollectionWithTemporaryDocuments
      ✓ done

  8 passing (89ms)
```