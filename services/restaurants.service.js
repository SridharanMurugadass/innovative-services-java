var config = require('config.json');
var _ = require('lodash');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var Q = require('q');
// Generate a v1 UUID (time-based)
const uuidV1 = require('uuid/v1');
var mongo = require('mongoskin');
var db = mongo.db(config.connectionString, { native_parser: true });
db.bind('restaurants');
var dbSeq = mongo.db(config.connectionString, { native_parser: true });
dbSeq.bind('counters');

var service = {};

service.authenticate = authenticate;
service.getAll = getAll;
service.getById = getById;
service.create = create;
service.createOrUpdateProduct = createOrUpdateProduct;
service.update = update;
service.delete = _delete;

module.exports = service;

function authenticate(username, password) {
    var deferred = Q.defer();
    db.restaurants.findOne({ userName: username }, function (err, user) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        if (user && bcrypt.compareSync(password, user.hash)) {
            // authentication successful
            deferred.resolve({
                _id: user._id,
                username: user.userName,
                restaurantName: user.restaurantName,
                    // "address" : "Adyar",
                    // "mobile" : "9876543211",
                    // "email" : "adyar@gmail.com",
                    // "pinzip" : "43345453",
                    // "managerName" : "Arumugam",
                    // "userName" : "arumugam",
                    // "logo" : "ORDER TAKING SOFTWARE.docx",
                    // "userId" : 1
                // firstName: user.firstName,
                // lastName: user.lastName,
                token: jwt.sign({ sub: user._id }, config.secret)
            });
        } else {
            // authentication failed
            deferred.resolve();
        }
    });

    return deferred.promise;
}

function getAll() {
    var deferred = Q.defer();

    db.restaurants.find().toArray(function (err, restaurants) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        // return restaurants (without hashed passwords)
        restaurants = _.map(restaurants, function (restaurant) {
            return _.omit(restaurant, 'hash');
        });

        deferred.resolve(restaurants);
    });

    return deferred.promise;
}

function getById(restaurantId) {
    // console.log("getById : "+restaurantId);
    var deferred = Q.defer();


    // db.restaurants.findById(_id, function (err, restaurant) {
    db.restaurants.findOne({ restaurantId: restaurantId },function (err, restaurant) {
        if (err) deferred.reject(err.name + ': ' + err.message);
        
        if (restaurant) {
            // return restaurant (without hashed password)
            deferred.resolve(_.omit(restaurant, 'hash'));
        } else {
            // restaurant not found
            deferred.resolve();
        }
    });

    return deferred.promise;
}

function create(restaurantParam) {
    var deferred = Q.defer();

    // // validation
    db.restaurants.find().sort({_id:-1}).limit(1).toArray(function(err,restaurants){
        if (err) deferred.reject(err.name + ': ' + err.message);
        if(restaurants[0] == null)
            var restaurantId = 1;
        else
            restaurantId = parseInt(String(restaurants[0].restaurantId).match(/\d+/g).map(Number))+1
        console.log("restaurantId : "+restaurantId);
        createRestaurant(restaurantId);

    });

    function createRestaurant(restaurantId) {
        // set restaurant object to restaurantParam without the cleartext password
        var restaurant = _.omit(restaurantParam, 'password');
        restaurant.restaurantId = restaurantId;
        restaurant.restaurantName = restaurantParam.restaurantName;
        restaurant.createdBy = restaurantParam.createdBy;
        restaurant.createdDate = new Date();
        restaurant.deleteFlag = false;

        db.restaurants.insert(restaurant,function (err, doc) {
                if (err) deferred.reject(err.name + ': ' + err.message);
                console.log("restaurant created successfully");
                deferred.resolve();
            });
    }

    return deferred.promise;
}



function createOrUpdateProduct(restaurantParam) {
    var deferred = Q.defer();
    console.log("restaurantParam :: "+JSON.stringify(restaurantParam)); 
    // // validation
    // db.restaurants.find({restaurantId:restaurantParam.restaurantId},function(err,restaurants){
    //     if (err) deferred.reject(err.name + ': ' + err.message);

        // if(restaurants.$.productDetails == null)
        //     var productId = 1;
        // else{
        //     console.log("len : "+restaurants[0].productDetails.length);
        //     console.log(restaurants[0].productDetails[restaurants[0].productDetails.length-1].productId);
        //     productId = parseInt(String(restaurants[0].productDetails[restaurants[0].productDetails.length-1].productId).match(/\d+/g).map(Number))+1
        // }
        //console.log("productId : "+productId);
        createProducts();

    // });


    function createProducts() {
        var productId = uuidV1(); // -> '6c84fb90-12c4-11e1-840d-7b25c5ee775a'
        console.log("productId : "+productId);
        // set product object to restaurantParam without the cleartext password
        var product = _.omit(restaurantParam, 'password');
        // add hashed password to product object
        // product.hash = bcrypt.hashSync(restaurantParam.password, 10);
        product.productId = productId;
        product.productName = restaurantParam.productName;
        product.category = restaurantParam.category;
        product.subCategory = restaurantParam.subCategory;
        product.quantity = restaurantParam.quantity;
        product.foodSession = restaurantParam.foodSession;
        product.price = restaurantParam.price;
        product.createdBy = restaurantParam.createdBy;
        product.createdDate = new Date();
        product.deleteFlag = false;
        console.log("res Id : "+restaurantParam.restaurantId);
        console.log("res product : "+JSON.stringify(product));

        db.restaurants.update({"restaurantId":restaurantParam.restaurantId},
            {"$push":
                {"productDetails": product}
             },
            function (err, doc) {
                if (err) deferred.reject(err.name + ': ' + err.message);
                console.log("productDetails created successfully");
                deferred.resolve();
            });
    }

    return deferred.promise;
}

function update(_id, restaurantParam) {
    var deferred = Q.defer();
    console.log("_id : "+_id);
    console.log("restaurantParam"+JSON.stringify(restaurantParam));
    // validation
    db.restaurants.findById(_id, function (err, user) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        if (restaurantParam.deleteFlag) {
            // console.log("restaurantParam.deleteFlag if condition");
            // if employee details set to deleteFlag = true then call updateDeleteFlag() method.
            updateDeleteFlag();
        } else {
            console.log("else part");
            updateProduct();
        }
    });

    function updateProduct() {
        console.log("this is updateProduct");
        restaurantParam.modifiedDate = new Date();
        // fields to update
        var set = {
            "productDetails.$.productName": restaurantParam.productName,
            "productDetails.$.category": restaurantParam.category,
            "productDetails.$.subCategory": restaurantParam.subCategory,
            "productDetails.$.quantity" : restaurantParam.quantity,
            "productDetails.$.price" : restaurantParam.price,
            "productDetails.$.foodSession" : restaurantParam.foodSession,
            "productDetails.$.modifiedDate" : restaurantParam.modifiedDate,
            "productDetails.$.modifiedBy" : restaurantParam.modifiedBy
        };

        console.log("ids : "+_id + " : "+restaurantParam.productId);
        console.log("set value : "+JSON.stringify(set));
        db.restaurants.update(
            { _id: mongo.helper.toObjectID(_id), "productDetails.productId" : restaurantParam.productId },
            { $set: set },
            function (err, doc) {
                if (err) deferred.reject(err.name + ': ' + err.message);
                // console.log("doc : "+JSON.stringify(doc));
                deferred.resolve();
            });
    }

    /** This method is used to set the softDeleteFlag = true*/
    function updateDeleteFlag() {
        // fields to update
        var modifiedDate = new Date();
        // console.log("updateDeleteFlag :: restaurantParam.deleteFlag : "+_id + " : "+restaurantParam.deleteFlag);
        var set = {
            "productDetails.$.modifiedDate" : restaurantParam.modifiedDate,
            "productDetails.$.modifiedBy" : restaurantParam.modifiedBy,
            "productDetails.$.deleteFlag" : restaurantParam.deleteFlag
        };

        db.restaurants.update(
            { _id: mongo.helper.toObjectID(_id), "productDetails.productId" : restaurantParam.productId },
            { $set: set },
            function (err, doc) {
                if (err) deferred.reject(err.name + ': ' + err.message);

                deferred.resolve();
            });
    }


    return deferred.promise;
}

function _delete(_id) {
    var deferred = Q.defer();

    db.restaurants.remove(
        { _id: mongo.helper.toObjectID(_id) },
        function (err) {
            if (err) deferred.reject(err.name + ': ' + err.message);

            deferred.resolve();
        });

    return deferred.promise;
}