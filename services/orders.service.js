var config = require('config.json');
var _ = require('lodash');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var Q = require('q');
const uuidV1 = require('uuid/v1');
var mongo = require('mongoskin');
var db = mongo.db(config.connectionString, { native_parser: true });
db.bind('orders');

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
    db.orders.findOne({ userName: username }, function (err, user) {
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

    db.orders.find().toArray(function (err, orderDetails) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        // return orders (without hashed passwords)
        orders = _.map(orders, function (order) {
            return _.omit(order, 'hash');
        });

        deferred.resolve(orders);
    });

    return deferred.promise;
}

function getById(restaurantId) {
    var deferred = Q.defer();
    console.log("get By Id method called : "+restaurantId);
    db.orders.findOne({ restaurantId: restaurantId }, function (err, order) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        if (order) {
            // console.log("order from getById :: "+JSON.stringify(order));
            // return order (without hashed password)
            deferred.resolve(_.omit(order, 'hash'));
        } else {
            // order not found
            deferred.resolve();
        }
    });

    return deferred.promise;
}

function create(orderParam) {
    var deferred = Q.defer();
    // console.log("create orderdetails orderParam : ");
    console.log(orderParam.restaurantId);

    var createdDate = new Date();
    var orderUID =  uuidV1(); // -> '6c84fb90-12c4-11e1-840d-7b25c5ee775a'

    var orderdata = {
            "orderUID" : orderUID,
            "orderId" : 0,
            "employeeId" : orderParam.employeeId,
            "noOfCust" : orderParam.noOfCust,
            "tableNumber" : orderParam.tableNumber,
            "tableStatus" : orderParam.tableStatus,
            "seatNumber" : orderParam.seatNumber,
            "orderStatus" : orderParam.orderStatus,
            "createdBy" : orderParam.createdBy,
            "createdDate" : createdDate
    };
    // // validation
    console.log(JSON.stringify({restaurantId:orderParam.restaurantId}));

    db.orders.findOne({restaurantId:orderParam.restaurantId},function(err,result){
        if (err) deferred.reject(err.name + ': ' + err.message);
        console.log((result));
        if(result){
            console.log("record found, so push additional records");
            pushOrderDetails(orderdata); // Restaurant pushing second, third.... order
        }else{
            console.log("record not found, so creating"); 
            createOrderDoc(orderdata);  // New Restaurant first order
        }
       
        // if(orderdetails[0] == null)
        //     var neworderId = 1;
        // else
        //     neworderId = parseInt(String(orderdetails[0].orderId).match(/\d+/g).map(Number))+1
        // // console.log("neworderId : "+neworderId);
        // //createUser(neworderId);

    });

    function createOrderDoc(orderdata) {
       
        // set order object to userParam without the cleartext password
        var order = _.omit(orderParam, 'password');
        var createdDate = new Date();

        console.log(order);

        order.restaurantId = orderParam.restaurantId;
        order.restaurantName = orderParam.restaurantName;
        order.createdBy = orderParam.createdBy;
        order.createdDate = createdDate;
        order.orderDetails = [orderdata];

        console.log(order);

        db.orders.insert(
            order,
            function (err, doc) {
                if (err) deferred.reject(err.name + ': ' + err.message);
                console.log("First order created successfully");
                deferred.resolve();
            });
    }

    function pushOrderDetails(orderdata) {
        // set order object to userParam without the cleartext password
        var order = _.omit(orderParam, 'password');
        // add hashed password to order object
        // order.hash = bcrypt.hashSync(userParam.password, 10);

        db.orders.update({"restaurantId":orderParam.restaurantId},
            {"$push":
                {"orderDetails": orderdata}
             },
            function (err, doc) {
                if (err) deferred.reject(err.name + ': ' + err.message);
                console.log("orderDetails pushed successfully");
                deferred.resolve();
        });
    }

    return deferred.promise;
}

function update(_id, orderParam) {
    var deferred = Q.defer();
    // console.log("orderParam"+JSON.stringify(orderParam));
    // validation
    db.orders.findById(_id, function (err, user) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        if (orderParam.deleteFlag) {
            // console.log("orderParam.deleteFlag if condition");
            // if order details set to deleteFlag = true then call updateDeleteFlag() method.
            updateDeleteFlag();
        } else {
            updateUser();
        }
    });

    function updateUser() {
        orderParam.modifiedDate = new Date();
        // fields to update
        var set = {
            orderName: orderParam.orderName,
            category: orderParam.category,
            subCategory: orderParam.subCategory,
            quantity : orderParam.quantity,
            price : orderParam.price,
            foodSession : orderParam.foodSession,
            modifiedDate : orderParam.modifiedDate
        };

        db.orders.update(
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
        // console.log("updateDeleteFlag :: orderParam.deleteFlag : "+_id + " : "+orderParam.deleteFlag);
        var set = {
            modifiedDate: modifiedDate,
            deleteFlag: orderParam.deleteFlag,
        };

        db.orders.update(
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

    db.orders.remove(
        { _id: mongo.helper.toObjectID(_id) },
        function (err) {
            if (err) deferred.reject(err.name + ': ' + err.message);

            deferred.resolve();
        });

    return deferred.promise;
}