var restify = require('restify');
var mongodb = require('mongodb');
var request = require('request');

var server = restify.createServer();
var uri = 'mongodb://bookstore-dba:bookstore-dba@ds019482.mlab.com:19482/bookstore'
var port = process.env.PORT || 9000;

server.use(restify.bodyParser({ mapParams: true }));

var bookstoreJS = {};

bookstoreJS.prepareFind = function(req, res, next){

    var attrs = {};

    if(req.params['collection'])
        attrs['collection'] = req.params['collection'];

    if(req.params['filter'])
        attrs['filter'] = req.params['filter'];

    var params = {
        "operation": bookstoreJS.find,
        "collection": attrs['collection'],
        "filter": attrs['filter'],
        "response": res,
        "callback": undefined
    };

    bookstoreJS.dbOperations(params);
    next();
};

bookstoreJS.prepareSave = function(req, res, next){
    var params = {
        "operation": bookstoreJS.save,
        "collection": req.body.collection,
        "object": req.body.object,
        //"filter": req.body.filter,
        "response": res,
        "callback": undefined
    };

    bookstoreJS.dbOperations(params);
    next();
};

bookstoreJS.prepareUpdate = function(req, res, next){
    var params = {
        "operation": bookstoreJS.update,
        "collection": req.body.collection,
        "object": req.body.object,
        "filter": req.body.filter,
        "response": res,
        "callback": undefined
    };
    
    bookstoreJS.dbOperations(params);
    next();
};

bookstoreJS.find = function(params) {
    var collection = params.db.collection(params.collection);

    collection.find(params.filter).toArray(function(err, docs) {
        if(err) {
            params.response.json(err);
            return;
        }

        if(params.callback){
            params.docs = docs;
            params.callback(params);
        } else {
            params.response.json(docs);
        }
    });
};

bookstoreJS.save = function(params){

    var collection = params.db.collection(params.collection);

    try {
        collection.insert(params.object);
        params.response.json({"insert": true});
    } catch(ex) {
        params.response.json({"insert": false});
    }
};

bookstoreJS.update = function(params) {
    var collection = params.db.collection(params.collection);

    try {
        collection.update(params.filter, { $push: { url: params.config.url }});
        params.response.json({"success": true});
    } catch(ex) {
        params.response.json({"success": false, "err": "Error on trying to save the link."});
    }
};

bookstoreJS.dbOperations = function(params) {
    mongodb.MongoClient.connect(uri, function(err, db) {
        if(err) throw err;

        params.db = db;
        params.operation(params);
    });
};


server.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

server.get('/author/:collection', bookstoreJS.prepareFind);
server.get('/author/:collection/:filter', bookstoreJS.prepareFind);

server.listen(port, function() {
  console.log('%s listening at server port %s', 'bookstoreJS', port);
});