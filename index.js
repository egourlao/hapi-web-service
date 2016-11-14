'use strict'

module.exports = {
  // Core
  Method: require('./lib/services/method'),
  Service: require('./lib/services/service'),

  // Grants and requirements
  BasicAuthRequirement: require('./lib/auth/authRequirement'),
  Grant: require('./lib/auth/grantedAuth').Grant,

  // Misc
  grantTypes: require('./lib/auth/grantedAuth').messages
}
