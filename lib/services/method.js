const Boom = require('boom')
const Joi = require('joi')

let BasicAuthRequirement = ('../auth/AuthRequirement')

class Method {
  /* Virtual class representing a Method

  Every Method sub-class must implement:
  - a `method` function, that takes in parameters:
    - `args`: an object of parameters
    - `session`: a reference to the `request.session` object
    - `callback`: a callback function, that takes in first parameter a potential error
    and that will execute the given task or render the wanted document.
  - an `args` Joi object, with defined keys (according to the Joi object documentation:
    https://github.com/hapijs/joi/blob/v9.2.0/API.md#object)
  - an `requiredAuth` AuthRequirement object, that will define the required authentication
    for this route

  */

  constructor () {
    this._auth = new BasicAuthRequirement()
  }

  checkRequirement (session, callback) {
    return this._auth.check(session, callback)
  }

  callMethod (args, session, callback) {
    // method with an Args object representing a key-value
    Joi.validate(args, this.args, function (err) {
      if (err) {
        callback(Boom.badRequest(err.name, err.details.message))
      } else {
        this.checkRequirement(session, (err, grant) => {
          if (err) {
            throw err
          }
          if (grant.isGranted()) {
            this.method(args, session, callback)
          } else if (grant.refusedNoConnection()) {
            callback(Boom.unauthorized('User not connected'))
          } else {
            callback(Boom.forbidden('Access refused'))
          }
        })
      }
    })
  }
}

module.exports = Method
