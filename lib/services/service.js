class Service {

  constructor () {
    this.methods = []
  }

  register (service) {
    this.methods.push(service)
  }

}

module.exports = Service
