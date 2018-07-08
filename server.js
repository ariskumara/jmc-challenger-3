var express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    MongoClient = require('mongodb').MongoClient,
    engines = require('consolidate'),
    assert = require('assert'),
    ObjectId = require('mongodb').ObjectID,
    url = 'mongodb://jmc-cosmosdb:PCY7QkZjWsnZmC4mgDrbfVYwwzXld1rjay5VHYtsUnGJTs7i1ccz8hT74VwpoPDojEqgSsZgjrWfcrgXpswMZQ==@jmc-cosmosdb.documents.azure.com:10255/?ssl=true&replicaSet=globaldb';

// Application Insights initialization
//const appInsights = require("applicationinsights");

// Get AppInsights Instrumentation key via environment variable
//appInsights.setup(process.env.APPINSIGHTS_KEY);
//appInsights.start();
// Application Insights initialization

//Pagination init
const paginate = require('express-paginate');
app.use(paginate.middleware(10, 50));

app.use(express.static(__dirname + "/public"));

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.engine('html', engines.nunjucks);
app.set('view engine', 'html');
app.set('views', __dirname + '/views');

function errorHandler(err, req, res, next) {
    console.error(err.message);
    console.error(err.stack);
    res.status(500).render("error_template", { error: err});
}

MongoClient.connect(url,function(err, db){
    assert.equal(null, err);
    console.log('Successfully connected to MongoDB on Cosmos DB.');

    var records_collection = db.collection('records');
    var noOfRecords, pageCount;

    app.get('/records', function(req, res, next) {
        // console.log("Received get /records request");
        // Query only the records on current page
        results = records_collection.find({}).limit(req.query.limit).skip(req.skip);
        records_collection.count({}, function(error, noOfDocs){
            if (error) console.log(error.message);
            
            noOfRecords = noOfDocs;
            pageCount = Math.ceil(noOfRecords / req.query.limit);
        });
        
        results.toArray(function(err, records){
            if(err) throw err;

            if(records.length < 1) {
                console.log("No records found.");
            }

            // console.log(records);
            res.json({
                recs: records,
                pgCount: pageCount,
                itemCount: noOfRecords
                //pages: paginate.getArrayPages(req)(3, pageCount, req.query.page)
            });
        });
    });

    app.post('/records', function(req, res, next){
        console.log(req.body);
        records_collection.insert(req.body, function(err, doc) {
            if(err) throw err;
            console.log(doc);
            res.json(doc);
        });
    });

    app.delete('/records/:id', function(req, res, next){
        var id = req.params.id;
        console.log("delete " + id);
        records_collection.deleteOne({'_id': new ObjectId(id)}, function(err, results){
            console.log(results);
            res.json(results);
        });
    });

    app.put('/records/:id', function(req, res, next){
        var id = req.params.id;
        records_collection.updateOne(
            {'_id': new ObjectId(id)},
            { $set: {
                'name' : req.body.name,
                'email': req.body.email,
                'phone': req.body.phone
                }
            }, function(err, results){
                console.log(results);
                res.json(results);
        });
    });

    app.use(errorHandler);
    var server = app.listen(process.env.PORT || 3000, function() {
        var port = server.address().port;
        console.log('Express server listening on port %s.', port);
    })
})
