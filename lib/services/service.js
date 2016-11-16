'use strict'

class Service {

  constructor (name) {
    this.name = name
    this.methods = []
  }

  registerMethod (method) {
    this.methods.push(method)
  }

  registerToServer (server) {
    for (var method of this.methods) {
      server.route({
        method: method.httpMethod,
        path: '/' + this.name + '/' + method.name,
        handler: function (request, reply) {
          method.callMethod(request.query, request.session, reply)
        }
      })
    }
  }
}

module.exports = Service
