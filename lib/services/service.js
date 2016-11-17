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
          let argumentsLst = request.query
          if (request.payload) {
            let listArguments = Object.keys(request.query)
            for (let p in request.payload) {
              if (listArguments.indexOf(p) === -1) {
                argumentsLst[p] = request.payload[p]
              } else {
                argumentsLst['_payload_' + p] = request.payload[p]
              }
            }
          }
          method.callMethod(argumentsLst, request.session, reply)
        }
      })
    }
  }
}

module.exports = Service
