require('rootpath')();
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var cors = require('cors');
var bodyParser = require('body-parser');
var expressJwt = require('express-jwt');
var config = require('config.json');

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// make express look in the public directory for assets (css/js/img)
app.use(express.static(__dirname + '/public'));

// set the home page route
app.get('/', function(req, res) {

    // ejs render automatically looks in the views folder
    res.render('index');
});

//use JWT auth to secure the api, the token can be passed in the authorization header or querystring
app.use(expressJwt({
    secret: config.secret,
    getToken: function (req) {
        if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
            return req.headers.authorization.split(' ')[1];
        } else if (req.query && req.query.token) {
            return req.query.token;
        }
        return null;
    }
}).unless({ path: ['/users/authenticate', '/users/register','/employees/register',
                    '/employees/getAll','/employees/current','/products/register',
                    '/products/getAll','/restaurant/register','/restaurant/getAll',
                    '/restaurant/current','/orderdetails/register','/orderdetails/getAll',
                    '/orderdetails/current'] }));

// routes
app.use('/users', require('./controllers/users.controller'));
app.use('/employees', require('./controllers/employee.controller'));
app.use('/products', require('./controllers/products.controller'));
app.use('/restaurant', require('./controllers/restaurants.controller'));
app.use('/orderdetails', require('./controllers/orders.controller'));


// socket.io communication
io.on('connection', (socket) => {
  console.log('user connected');
  
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
  
  socket.on('add-message', (message) => {
  	console.log(message);
    io.emit('message', {type:'new-message', text: message});    
  });
});

// start server
var port = process.env.NODE_ENV === 'production' ? 80 : 4001;
var server = http.listen(port, function () {
    console.log('Server listening on port ' + port);
});