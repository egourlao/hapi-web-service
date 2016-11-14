'use strict'

const grant = require('./grantedAuth')

class AuthRequirement {
  check (args, session, callback) {
    // function to override
    callback(null, new grant.Grant(grant.messages.granted))
  }
}

module.exports = AuthRequirement
