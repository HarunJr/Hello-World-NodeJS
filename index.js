/*
 * Primary file for the API
 *
 */

 // Dependencies
 var http = require('http');
 var https = require('https');
 var url = require('url');
 var StringDecoder = require('string_decoder').StringDecoder;
 var config = require('./config');
 var fs = require('fs');


 // Instantiating the HTTP server
 var httpServer = http.createServer(function(req, res){
 	unifiedServer(req, res);
 
 });
 // Start the httpServer, and have it listen to a port in config
 httpServer.listen(config.httpPort, function(){
 	 console.log("The server is listening on port "+config.httpPort+" in "+config.envName+" mode");
 });

  // Instantiating the HTTPS server
  var httpsServerOptions = {
  	'key' : fs.readFileSync('./https/key.pem'),
  	'cert' : fs.readFileSync('./https/cert.pem')
  };
  var httpsServer = https.createServer(httpsServerOptions, function(req, res){
 	unifiedServer(req, res);
 
 });
  // Start the HTTPS server
 httpsServer.listen(config.httpsPort, function(){
 	 console.log("The server is listening on port "+config.httpsPort+" in "+config.envName+" mode");
 });


 // All the server logic for both http and https
 var unifiedServer = function(req, res){
 	// Get the URL and parse it
 	var parsedUrl = url.parse(req.url, true);

 	// Get the path
 	var path = parsedUrl.pathname;
    var trimmedPath = path.replace(/^\/+|\/+$/g, '');

    // Get the query string as an object
    var queryStringObject = parsedUrl.query;

    // Get the HTTP method
    var method = req.method.toLowerCase();

  	// Get the headers as an object
    var headers = req.headers;

    // Get the payload, if any
    var decoder = new StringDecoder('utf-8');
    var buffer = '';
    req.on('data',function(data){
    	buffer += decoder.write(data);
    });
    req.on('end',function(){
    	buffer += decoder.end();

    	// Choose the handler this request should go to. If one is not found, use the not found handler
    	var chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

    	// Construct the data object to send to the handler
    	var data = {
    		'trimmedPath' : trimmedPath,
    		'queryStringObject' : queryStringObject,
    		'method' : method,
    		'headers' : headers,
    		'payload' : buffer
    	};

    	// Route the request to the handler specifies in the router
    	chosenHandler(data, function(statusCode, payload){
    		// Use the status code called back by the handler, or default to 200
    		statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

    		// Use the payload called back by the handler, or default to 200
    		payload = typeof(payload) == 'object' ? payload : {};

    		// Convert the payload to a string
    		var payloadString = JSON.stringify(payload);

    		// Return the response
    		res.setHeader('Content-Type', 'application/json')
    		res.writeHead(statusCode);
	 		res.end(payloadString);

	  		// Log the request/response
 			// console.log('Request received on path: '+trimmedPath+' with method: '+method+' and this query string: ',queryStringObject);
    		// console.log('Request received eith these headers: ',headers);
        	console.log('Returning this response: ',statusCode,payloadString);
		});

    });	
 };


 // Define the handlers
 var handlers = {};

 // Sample handler
 handlers.ping = function(data, callback){
 	// Callback a http status code and a payload object
 	// callback(406,{'name': 'sample handler'});
 	 	callback(200);
 };

 handlers.hello = function(data, callback){
 	// Callback a http status code and a payload object
 	callback(200,{'message': 'Hello World!'});
 };

 // Not found handler
 handlers.notFound =  function(data, callback){
 	callback(404);
 };
 // Define a request router 
 var router = {
 	'ping' : handlers.ping,
 	'hello' : handlers.hello
 };