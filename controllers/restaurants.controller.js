var config = require('config.json');
var express = require('express');
var router = express.Router();
var restaurantsService = require('services/restaurants.service');

// routes
router.post('/authenticate', authenticate);
router.post('/register', register);
router.post('/products', productsRegister);
router.get('/', getAll);
router.get('/current/:_id', getCurrent);
router.put('/:_id', update);
router.delete('/:_id', _delete);
router.post('/getproducts', getCurrent);

module.exports = router;

function authenticate(req, res) {
    restaurantsService.authenticate(req.body.username, req.body.password)
        .then(function (restaurant) {
            if (restaurant) {
                // authentication successful
                res.send(restaurant);
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
    restaurantsService.create(req.body)
        .then(function () {
            res.sendStatus(200);
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}

function productsRegister(req, res) {
    restaurantsService.createOrUpdateProduct(req.body)
        .then(function () {
            res.sendStatus(200);
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}

function getAll(req, res) {
    restaurantsService.getAll()
        .then(function (restaurant) {
            res.send(restaurant);
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}

function getCurrent(req, res) {
	// console.log(req.params);
    restaurantsService.getById(req.body.restaurantId)
        .then(function (restaurant) {
        	// console.log("rest : "+restaurant);
            if (restaurant) {
                res.send(restaurant);
            } else {
                res.sendStatus(404);
            }
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}

function update(req, res) {
    restaurantsService.update(req.params._id, req.body)
        .then(function () {
            res.sendStatus(200);
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}

function _delete(req, res) {
    restaurantsService.delete(req.params._id)
        .then(function () {
            res.sendStatus(200);
        })
        .catch(function (err) {
            res.status(400).send(err);
        });
}