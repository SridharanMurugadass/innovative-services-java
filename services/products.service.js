var config = require('config.json');
var _ = require('lodash');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var Q = require('q');
var mongo = require('mongoskin');
var db = mongo.db(config.connectionString, { native_parser: true });
db.bind('foodproducts');

var service = {};

service.authenticate = authenticate;
service.getAll = getAll;
service.getById = getById;
service.create = create;
service.update = update;
service.delete = _delete;

module.exports = service;

function authenticate(username, password) {
    var deferred = Q.defer();
    db.foodproducts.findOne({ userName: username }, function (err, user) {
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

    db.foodproducts.find().toArray(function (err, foodproducts) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        // return foodproducts (without hashed passwords)
        foodproducts = _.map(foodproducts, function (product) {
            return _.omit(product, 'hash');
        });

        deferred.resolve(foodproducts);
    });

    return deferred.promise;
}

function getById(_id) {
    var deferred = Q.defer();

    db.foodproducts.findById(_id, function (err, product) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        if (product) {
            // return product (without hashed password)
            deferred.resolve(_.omit(product, 'hash'));
        } else {
            // product not found
            deferred.resolve();
        }
    });

    return deferred.promise;
}

function create(userParam) {
    var deferred = Q.defer();

    // // validation
    db.foodproducts.find().sort({_id:-1}).limit(1).toArray(function(err,foodproducts){
        if (err) deferred.reject(err.name + ': ' + err.message);
        if(foodproducts[0] == null)
            var productId = 1;
        else
            productId = parseInt(String(foodproducts[0].productId).match(/\d+/g).map(Number))+1
        // console.log("productId : "+productId);
        createUser(productId);

    });

    function createUser(productId) {
        // set product object to userParam without the cleartext password
        var product = _.omit(userParam, 'password');
        // console.log("userParam : "+JSON.stringify(userParam));
        // add hashed password to product object
        // product.hash = bcrypt.hashSync(userParam.password, 10);
        product.productId = productId;
        product.productName = userParam.productName;
        product.category = userParam.category;
        product.subCategory = userParam.subCategory;
        product.quantity = userParam.quantity;
        product.foodSession = userParam.foodSession;
        product.createdDate = new Date();
        product.deleteFlag = false;

        db.foodproducts.insert(
            product,
            function (err, doc) {
                if (err) deferred.reject(err.name + ': ' + err.message);
                console.log("User created successfully");
                deferred.resolve();
            });
    }

    return deferred.promise;
}

function update(_id, productParam) {
    var deferred = Q.defer();
    // console.log("productParam"+JSON.stringify(productParam));
    // validation
    db.foodproducts.findById(_id, function (err, user) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        if (productParam.deleteFlag) {
            // console.log("productParam.deleteFlag if condition");
            // if employee details set to deleteFlag = true then call updateDeleteFlag() method.
            updateDeleteFlag();
        } else {
            updateUser();
        }
    });

    function updateUser() {
        productParam.modifiedDate = new Date();
        // fields to update
        var set = {
            productName: productParam.productName,
            category: productParam.category,
            subCategory: productParam.subCategory,
            quantity : productParam.quantity,
            price : productParam.price,
            foodSession : productParam.foodSession,
            modifiedDate : productParam.modifiedDate
        };

        db.foodproducts.update(
            { _id: mongo.helper.toObjectID(_id) },
            { $set: set },
            function (err, doc) {
                if (err) deferred.reject(err.name + ': ' + err.message);

                deferred.resolve();
            });
    }

    /** This method is used to set the softDeleteFlag = true*/
    function updateDeleteFlag() {
        // fields to update
        var modifiedDate = new Date();
        // console.log("updateDeleteFlag :: productParam.deleteFlag : "+_id + " : "+productParam.deleteFlag);
        var set = {
            modifiedDate: modifiedDate,
            deleteFlag: productParam.deleteFlag,
        };

        db.foodproducts.update(
            { _id: mongo.helper.toObjectID(_id) },
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

    db.foodproducts.remove(
        { _id: mongo.helper.toObjectID(_id) },
        function (err) {
            if (err) deferred.reject(err.name + ': ' + err.message);

            deferred.resolve();
        });

    return deferred.promise;
}