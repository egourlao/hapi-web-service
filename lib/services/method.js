'use strict'

const Boom = require('boom')
const Joi = require('joi')

let BasicAuthRequirement = require('../auth/AuthRequirement')

class Method {
  /* Class representing a Method

  Every Method instance must contain:
  - a `method` function, that takes in parameters:
    - `args`: an object of parameters
    - `session`: a reference to the `request.session` object
    - `hapiCallback`: the Hapi `reply()` function
    and that will execute the given task or render the wanted document.
  - an `args` Joi object, with defined keys (according to the Joi object documentation:
    https://github.com/hapijs/joi/blob/v9.2.0/API.md#object)
  - an `requiredAuth` AuthRequirement object, that will define the required authentication
    for this route

  */

  constructor (name, args, output, method, httpMethod, requiredAuth) {
    this.name = name
    this.args = args
    this.outputArgs = output
    this.method = method
    this.httpMethod = httpMethod || 'GET'
    this._auth = requiredAuth || new BasicAuthRequirement()
  }

  checkRequirement (args, session, callback) {
    return this._auth.check(args, session, callback)
  }

  output (hapiCallback, err, val) {
    if (err) {
      if (err.isBoom !== true) {
        // wrapping the error
        err = Boom.wrap(err)
      }
      hapiCallback(err)
    } else {
      let response = hapiCallback(null, JSON.stringify(val))
      response.header('Content-Type', 'application/json')
    }
  }

  callMethod (args, session, hapiCallback) {
    // method with an Args object representing a key-value
    var calledMethod = this
    Joi.validate(args, this.args, function (err) {
      if (err) {
        calledMethod.output(hapiCallback, Boom.badRequest(err.name, err.details.message), null)
      } else {
        calledMethod.checkRequirement(args, session, (err, grant) => {
          if (err) {
            calledMethod.output(hapiCallback, err)
          } else if (grant.isGranted()) {
            calledMethod.method(args, session, (err, data) => {
              console.log(calledMethod)
              console.log(calledMethod.output)
              calledMethod.output(hapiCallback, err, data)
            })
          } else if (grant.refusedNoConnection()) {
            calledMethod.output(hapiCallback, Boom.unauthorized(grant.description || 'User not connected'))
          } else {
            calledMethod.output(hapiCallback, Boom.forbidden(grant.description || 'Access refused'))
          }
        })
      }
    })
  }
}

module.exports = Method
