'use strict'

/* global describe, it */

const Boom = require('boom')
const Joi = require('joi')

let expect = require('chai').expect
let hws = require('./index')

function generateMethodWithFunc (name, meth, authRequirement) {
  // returns a generic method given name and method
  return new hws.Method(name,
    Joi.object().keys({
      name: Joi.string().min(3).max(10)
    }),
    Joi.string(),
    meth,
    null,
    authRequirement
  )
}

describe('Basic Auth Requirement', function () {
  it('calls the callback granting access', function () {
    let req = new hws.BasicAuthRequirement()
    req.check(null, null, (err, grant) => {
      expect(err).to.not.be.ok
      expect(grant.isGranted()).to.be.true
      expect(grant.refusedNoConnection()).to.be.false
    })
  })
})

describe('Granted Auth', function () {
  it('accepts a valid access', function () {
    let grant = new hws.Grant(hws.grantTypes.granted)
    expect(grant.isGranted()).to.be.true
    expect(grant.refusedNoConnection()).to.be.false
  })

  it('refuses an invalid access', function () {
    let grant = new hws.Grant(hws.grantTypes.refused)
    expect(grant.isGranted()).to.be.false
    expect(grant.refusedNoConnection()).to.be.false
  })

  it('informs of a no connection when a connection is required', function () {
    let grant = new hws.Grant(hws.grantTypes.notConnected)
    expect(grant.isGranted()).to.be.false
    expect(grant.refusedNoConnection()).to.be.true
  })
})

describe('Method', function () {
  let basicMethod = new hws.Method('test',
    Joi.object().keys({
      name: Joi.string().min(3).max(10)
    }),
    Joi.string(),
    function (args, session, callback) {
      callback(null, args.name.toUpperCase())
    }
  )

  it('uses GET as a default HTTP method', function () {
    let method = new hws.Method()
    expect(method.httpMethod).to.be.equal('GET')
  })

  describe('Authorization', function () {
    let authReq = new hws.BasicAuthRequirement()
    authReq.check = function (args, session, callback) {
      if (args.name === 'unknown') return new hws.Grant(hws.grantTypes.notConnected, 'Not connected')
      if (args.name === 'no key') return new hws.Grant(hws.grantTypes.notConnected)
      if (args.name === 'smith') return new hws.Grant(hws.grantTypes.refused, 'john smith is forbidden')
      if (args.name === 'appleseed') return new hws.Grant(hws.grantTypes.refused)
      else return new hws.Grant(hws.grantTypes.granted)
    }
    let acceptingOrRefusingMethod = generateMethodWithFunc('test', (args, session, cb) => { cb(null, true) }, authReq)
    it('Accepts a valid authorization', function () {
      acceptingOrRefusingMethod.callMethod({ name: 'obama' }, null, (err) => {
        expect(err).to.be.null
      })
    })

    it('Refuses a forbidden access', function () {
      var forbiddenCallback = (err) => {
        expect(err).to.be.ok
        expect(err.isBoom).to.be.true
        expect(err.output.statusCode).to.be.equal(403)
      }
      acceptingOrRefusingMethod.callMethod({ name: 'smith' }, null, forbiddenCallback)
      acceptingOrRefusingMethod.callMethod({ name: 'appleseed' }, null, forbiddenCallback)
    })

    it('Refuses a non-connected access', function () {
      var notConnectedCallback = (err) => {
        expect(err).to.be.ok
        expect(err.isBoom).to.be.true
        expect(err.output.statusCode).to.be.equal(401)
      }
      acceptingOrRefusingMethod.callMethod({ name: 'unknown' }, null, notConnectedCallback)
      acceptingOrRefusingMethod.callMethod({ name: 'no key' }, null, notConnectedCallback)
    })
  })

  describe('Input validation', function () {
    it('rejects an invalid input', function () {
      basicMethod.callMethod({ name: 'jj' }, null, function (err) {
        expect(err).to.be.ok
        expect(err.isBoom).to.be.true
        expect(err.output.statusCode).to.be.equal(400)
      })
    })

    it('accepts a valid input', function () {
      basicMethod.callMethod({ name: 'jjjj' }, null, function (err, data) {
        expect(err).to.be.null
        expect(data).to.be.ok
      })
    })
  })

  describe('Error management', function () {
    it('renders a Boom error as expected', function () {
      let method = generateMethodWithFunc('test', (args, session, cb) => { cb(Boom.notImplemented()) })
      method.callMethod(null, null, (err) => {
        expect(err.isBoom).to.be.true
      })
    })

    it('wraps a normal error around a Boom error', function () {
      let method = generateMethodWithFunc('test', (args, session, cb) => { cb('test') })
      method.callMethod(null, null, (err) => {
        expect(err.isBoom).to.be.true
      })
    })
  })

  describe('JSON output', function () {
    let inputOutput = Joi.object().keys({ name: Joi.string().min(3).max(10) })
    let objectOutputMethod = new hws.Method('test',
      inputOutput,
      inputOutput,
      function (args, session, callback) {
        callback(null, { name: args.name.toUpperCase() })
      }
    )

    it('converts an object to JSON', function () {
      objectOutputMethod.callMethod({ name: 'Appleseed' }, null, function (err, data) {
        expect(err).to.be.null
        expect(data.name).to.be.equal('APPLESEED')
      })
    })
  })
})

describe('Service', function () {
  let serv = new hws.Service('testServ')

  let basicMethod = generateMethodWithFunc('test', function (args, session, callback) {
    callback(null, { jj: 'test' })
  })
  serv.registerMethod(basicMethod)

  function NewFakeServ () {
    this.routes = []
    this.route = function (r) {
      this.routes.push(r)
    }
  }

  describe('Registering', function () {
    it('registers correctly a route', function () {
      let fakeServ = new NewFakeServ()
      serv.registerMethod(basicMethod)
      serv.registerToServer(fakeServ)
      expect(fakeServ.routes[0].path).to.be.equal('/testServ/test')
    })

    it('accepts a method', function () {
      let nbMethods = serv.methods.length
      let m = 'hello'
      serv.registerMethod(m)
      expect(serv.methods.length).to.be.equal(nbMethods + 1)
      expect(serv.methods[nbMethods]).to.be.equal(m)
    })
  })
})

describe('Grant', function () {
  describe('Grant types', function () {
    let g1 = new hws.Grant(hws.grantTypes.granted)
    let g2 = new hws.Grant(hws.grantTypes.refused)
    let g3 = new hws.Grant(hws.grantTypes.notConnected)
    it('accepts correct grants', function () {
      expect(g1.isGranted()).to.be.true
    })

    it('refuses incorrect grants', function () {
      expect(g2.isGranted()).to.be.false
      expect(g3.isGranted()).to.be.false
    })

    it('indicates correctly if connection was refused because of no authentication', function () {
      expect(g1.refusedNoConnection()).to.be.false
      expect(g2.refusedNoConnection()).to.be.false
      expect(g3.refusedNoConnection()).to.be.true
    })
  })
})

describe('Basic Auth Requirement', function () {
  it('returns a grant to the route', function () {
    let authReq = new hws.BasicAuthRequirement()
    authReq.check(null, null, (err, data) => {
      expect(err).to.be.null
      expect(data.isGranted()).to.be.true
    })
  })
})
