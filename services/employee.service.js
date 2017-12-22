var config = require('config.json');
var _ = require('lodash');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var Q = require('q');
const uuidV1 = require('uuid/v1');
var mongo = require('mongoskin');
var db = mongo.db(config.connectionString, { native_parser: true });
db.bind('employeedetails');

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
    db.employeedetails.findOne({ userName: username }, function (err, user) {
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

    db.employeedetails.find().toArray(function (err, employeedetails) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        // return employeedetails (without hashed passwords)
        employeedetails = _.map(employeedetails, function (user) {
            return _.omit(user, 'hash');
        });

        deferred.resolve(employeedetails);
    });

    return deferred.promise;
}

function getById(restaurantId) {
    var deferred = Q.defer();
    // console.log("get By Id method called : "+_id);
    db.employeedetails.findOne({ restaurantId: restaurantId }, function (err, employee) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        if (employee) {
            // console.log("employee from getById :: "+JSON.stringify(employee));
            // return employee (without hashed password)
            deferred.resolve(_.omit(employee, 'hash'));
        } else {
            // employee not found
            deferred.resolve();
        }
    });

    return deferred.promise;
}

function create(employeeParam) {
    var deferred = Q.defer();
    // console.log("create employeedetails employeeParam : ");
    console.log(employeeParam.restaurantId);

    var createdDate = new Date();
    var employeeUID =  uuidV1(); // -> '6c84fb90-12c4-11e1-840d-7b25c5ee775a'
    var hash = '';
    // add hashed password to employee object
    if(employeeParam.password != null)
        hash = bcrypt.hashSync(employeeParam.password, 10);
    var employeedata = {
            "employeeUID" : employeeUID,
            "employeeId" : 0,
            "firstName" : employeeParam.firstName,
            "lastName" : employeeParam.lastName,
            "gender" : employeeParam.gender,
            "role" : employeeParam.role,
            "mobileNumber" : employeeParam.mobileNumber,
            "email" : employeeParam.email,
            "deleteFlag" : false,
            "createdBy" : employeeParam.createdBy,
            "createdDate" : createdDate,
            "hash" : hash
    };
    // // validation
    console.log(JSON.stringify({restaurantId:employeeParam.restaurantId}));

    db.employeedetails.findOne({restaurantId:employeeParam.restaurantId},function(err,result){
        if (err) deferred.reject(err.name + ': ' + err.message);
        console.log((result));
        if(result){
            console.log("record found, so push additional records");
            pushEmployeeDetails(employeedata); // Restaurant pushing second, third.... employee
        }else{
            console.log("record not found, so creating"); 
            createEmployeeDoc(employeedata);  // New Restaurant first employee
        }
       
        // if(employeedetails[0] == null)
        //     var newEmployeeId = 1;
        // else
        //     newEmployeeId = parseInt(String(employeedetails[0].employeeId).match(/\d+/g).map(Number))+1
        // // console.log("newEmployeeId : "+newEmployeeId);
        // //createUser(newEmployeeId);

    });

    function createEmployeeDoc(employeedata) {
       
        // set employee object to userParam without the cleartext password
        var employee = _.omit(employeeParam, 'password');
        var createdDate = new Date();

        console.log(employee);

        employee.restaurantId = employeeParam.restaurantId;
        employee.restaurantName = employeeParam.restaurantName;
        employee.createdBy = employeeParam.createdBy;
        employee.createdDate = createdDate;
        employee.employeedetails = [employeedata];

        employee = _.omit(employee,'firstName');
        employee = _.omit(employee,'lastName');
        employee = _.omit(employee,'gender');
        employee = _.omit(employee,'role');
        employee = _.omit(employee,'mobileNumber');
        employee = _.omit(employee,'email');

        console.log(employee);

        db.employeedetails.insert(
            employee,
            function (err, doc) {
                if (err) deferred.reject(err.name + ': ' + err.message);
                console.log("First employee created successfully");
                deferred.resolve();
            });
    }

    function pushEmployeeDetails(employeedata) {
        // set employee object to userParam without the cleartext password
        var employee = _.omit(employeeParam, 'password');
        // add hashed password to employee object
        // employee.hash = bcrypt.hashSync(userParam.password, 10);

        db.employeedetails.update({"restaurantId":employeeParam.restaurantId},
            {"$push":
                {"employeedetails": employeedata}
             },
            function (err, doc) {
                if (err) deferred.reject(err.name + ': ' + err.message);
                console.log("employeeDetails pushed successfully");
                deferred.resolve();
        });
    }

    return deferred.promise;
}

function update(_id, employeeParam) {
    var deferred = Q.defer();
    // console.log("id and userParam :: "+_id + " : "+JSON.stringify(userParam));
    // validation
    db.employeedetails.findById(_id, function (err, user) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        if (employeeParam.deleteFlag) {
            // console.log("userParam.deleteFlag if condition");
            // if employee details set to deleteFlag = true then call updateDeleteFlag() method.
            updateDeleteFlag();
        } else {
            // console.log("else condition");
            updateEmployeeDtails();
        }
    });

    function updateEmployeeDtails() {
        // fields to update
        var modifiedDate = new Date();
        var set = {
            "employeedetails.$.firstName": employeeParam.firstName,
            "employeedetails.$.lastName": employeeParam.lastName,
            "employeedetails.$.gender" : employeeParam.gender,
            "employeedetails.$.role" : employeeParam.role,
            "employeedetails.$.mobileNumber" : employeeParam.mobileNumber,
            "employeedetails.$.email" : employeeParam.email,
            "employeedetails.$.modifiedDate" : modifiedDate,
            "employeedetails.$.modifiedBy" : employeeParam.modifiedBy       
        };

        db.employeedetails.update(
            { _id: mongo.helper.toObjectID(_id) ,"employeedetails.employeeUID" : employeeParam.employeeUID },
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
        // console.log("updateDeleteFlag :: userParam.deleteFlag : "+_id + " : "+userParam.deleteFlag);
        var set = {
            "employeedetails.$.deleteFlag" : employeeParam.deleteFlag,
            "employeedetails.$.modifiedBy" : employeeParam.modifiedBy,
            "employeedetails.$.modifiedDate" : modifiedDate
        };

        db.employeedetails.update(
            { _id: mongo.helper.toObjectID(_id),"employeedetails.employeeUID" : employeeParam.employeeUID },
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

    db.employeedetails.remove(
        { _id: mongo.helper.toObjectID(_id) },
        function (err) {
            if (err) deferred.reject(err.name + ': ' + err.message);

            deferred.resolve();
        });

    return deferred.promise;
}