const authMessages = {
  granted: 'OK',
  refused: 'refused',
  notConnected: 'not connected'
}

class GrantedAuth {
  constructor (type) {
    this.type = type
  }

  isGranted () {
    // returns yes if access granted
    return this.type === authMessages.granted
  }

  refusedNoConnection () {
    // returns yes if refuses because of no identification
    return this.type === authMessages.notConnected
  }
}

module.exports = {
  Grant: GrantedAuth,
  messages: authMessages
}
