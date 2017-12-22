var config = require('config.json');
var express = require('express');
var router = express.Router();
var empService = require('services/employee.service');

// routes
router.post('/authenticate', authenticate);
router.post('/register', register);
router.get('/', getAll);
router.get('/current/:_id', getCurrent);
router.put('/:_id', update);
router.delete('/:_id', _delete);
router.post('/getemployees', getCurrent);

module.exports = router;

function authenticate(req, res) {
    empService.authenticate(req.body.username, req.body.password)
        .then(function (user) {
            if (user) {
                // authentication successful
                res.send(user);
            } else {
                // authentication failed
                res.status(400).send('Username or password is incorrect');
            }
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}

function register(req, res) {
    console.log('register req '+req);
    empService.create(req.body)
        .then(function () {
            console.log('register');
            console.log(res);
            res.sendStatus(200);
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}

function getAll(req, res) {
    empService.getAll()
        .then(function (employees) {
            res.send(employees);
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}

function getCurrent(req, res) {
    // console.log(req.params._id);
    empService.getById(req.body.restaurantId)
        .then(function (employee) {
            if (employee) {
                // console.log("employee from getCurrent :: "+JSON.stringify(employee));
                res.send(employee);
            } else {
                res.sendStatus(404);
            }
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}

function update(req, res) {
    empService.update(req.params._id, req.body)
        .then(function () {
            res.sendStatus(200);
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}

function _delete(req, res) {
    empService.delete(req.params._id)
        .then(function () {
            res.sendStatus(200);
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}