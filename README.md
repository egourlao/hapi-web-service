# Hapi Web Service

Hapi Web Service is a module built to help you conceive [more standard Web Services](https://www.w3.org/TR/ws-arch/) with hapi. Whereas other modules will help you build REST-like interfaces for your application, HWS helps you build RPC-like services, allowing you to conceive your own methods while easily ensuring global QoS to your services - access protection, JSON output, error management and service description. 

## Install

Run `npm install --save hapi-web-service`.

## Usage example

```
const hws = require('hapi-web-service')
const Joi = require('joi')

const users = [{
  name: 'Johnny Appleseed'
}, {
  name: 'Kim Minjun'
}, {
  name: 'John Smith'
}]

// Creating a service
let userService = new hws.Service('users')

// Creating a method for this service
let getUsersNamesMethod = new hws.Method('getUsersNames',
  // input validation object
  Joi.object().keys({
    name: Joi.string().alphanum()
  }),
  // output format
  Joi.array().items(Joi.string().alphanum()),
  // method handler
  function (args, session, callback) {
    if (args.name) {
      callback(null, users.filter((user) => { return user.name.indexOf(args.name) !== -1 }).map((user) => { return user.name }))
    } else {
      callback(null, users)
    }
  }
)

// Registering the method to the service
userService.registerMethod(getUsersNameMethod)

// Adding the service to the server
userService.registerToServer(server)

// The service is now available at /users/getUsersNamesMethod.
```

## API

### `hws.Service(name)`

Creates a service that will be accessible via `/[name]` where:
- `name` - the name of the service in service description and the basis of endpoints in the URI.

#### `service.registerMethod(method)`

Registers an interface into the server where:
- `method` - a `hws.Method()`.

#### `service.registerToServer(server)`

Registers the service and its interfaces into the server, where:
- `server` - a `Hapi.Server()`.

### `hws.Method(name, input, output, method[, httpMethod, requiredAuth])`

Creates an interface that will be accessible via `/[service]/[name]` where:
- `name` - the name of the interface and part of the endpoint in the URI.
- `input` - a [Joi](https://github.com/hapijs/joi) object representing an object, of which the keys are input elements.
- `output` - a [Joi](https://github.com/hapijs/joi) object representing the output. This is added both for control and for description purposes.
- `method` - a function with the following parameters: `function method(args, session, callback)` where:
  - `args` - a JavaScript object with the different inputs
  - `session` - a JavaScript object representing the session contents
  - `callback` - a function with the following parameters: `function callback(err, data)` where:
    - `err` - an error. If `err` is a [Boom](https://github.com/hapijs/boom) error, it takes into account its properties.
    - `data` - a variable with the output data.
- `httpMethod` - optional parameter, default to `GET`. A string with the HTTP method (`POST`, `PUT`...) to use the service.
- `requiredAuth` - optional parameter, default to `hws.BasicAuthRequirement()` (always accepting the request), allowing an **access control** to this interface. To create a custom access control, you can create your own `hws.BasicAuthRequirement()` subclass (see API).

### `hws.BasicAuthRequirement()`

Object for controlling access to a route. Creating a subclass of `hws.BasicAuthRequirement()` allows you to create your own access control procedures.

#### `basicAuthRequirement.check(args, session, callback)`

Declares if the interface is accessible - in the default version, always accepts - where:
- `args` - a JavaScript object with the different inputs
- `session` - a JavaScript object representing the session contents
- `callback` - a function with the following parameters: `function callback(err, grant)` where:
  - `err` - an error
  - `grant` - a `hws.Grant()` object.

### `hws.Grant(type[, description])`

Object transmitted to the engine by the `hws.BasicAuthRequirement()` to signal if the access to the route has been granted, where:
- `type`: is one of the `hws.grantTypes` values - `hws.grantTypes.granted`, `hws.grantTypes.refused` or `hws.grantTypes.notConnected`. This value allows us to determine the HTTP status code to use in the answer.
- `description`: a string describing more in detail why the access has been forbidden.

#### `grant.isGranted()`

Returns a boolean equal to `true` if access has been granted - returns `false` if access has been refused.

#### `grant.refusedNoConnection()`

Returns a boolean equal to `true` if access has been refused because the user wasn't connected (inducing an error 401) - and `false` if this is because the user didn't have the rights.

## Example rewritten using a `hws.authRequirement` and a `hws.Grant`

```
const hws = require('hapi-web-service')
const Joi = require('joi')

const users = [{
  name: 'Johnny Appleseed'
}, {
  name: 'Kim Minjun'
}, {
  name: 'John Smith'
}]

const accesses = {
  iamasecretkey: 'none',
  iamamoresecretkey: 'all'
}

// Creating a service
let userService = new hws.Service('users')

// Creating an authRequirement for a route allowing to get all the users
let getAuthRequirement = new hws.basicAuthRequirement()
getAuthRequirement.check = function (args, session, callback) {
  if (args.key) {
    if (accesses[args.key] === 'all') {
      callback(null, new hws.Grant(hws.grantTypes.granted))
    } else {
      callback(null, new hws.Grant(hws.grantTypes.refused))
    }
  } else {
    callback(null, new hws.Grant(hws.grantTypes.notConnected))
  }
}

// Creating a method for this service
let getUsersNamesMethod = new hws.Method('getUsersNames',
  // input validation object
  Joi.object().keys({
    name: Joi.string().alphanum()
  }),
  // output format
  Joi.array().items(Joi.string().alphanum()),
  // method handler
  function (args, session, callback) {
    if (args.name) {
      callback(null, users.filter((user) => { return user.name.indexOf(args.name) !== -1 }).map((user) => { return user.name }))
    } else {
      callback(null, users.map((user) => { return user.name }))
    }
  },
  // HTTP method
  'GET',
  // auth requirement
  new getAuthRequirement()
)

// Registering the method to the service
userService.registerMethod(getUsersNameMethod)

// Adding the service to the server
userService.registerToServer(server)

// The service is now available at /users/getUsersNamesMethod and the route is controlled.
```

## Contributions

Feel free to contribute if you would like! Please read our current issues and pull request if you'd like to submit one. Our lint standard relies on [JS Standard](https://github.com/feross/standard).

### Objectives

+ Completing the expected behaviour of the package

+ Adding custom method URI

+ Adding testing

+ Adding WDSL
