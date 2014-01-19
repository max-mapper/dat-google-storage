var request = require('request')
var gapitoken = require('gapitoken')

module.exports = function(opts, cb) {
  createClient(opts, cb)
}

function createClient(opts, cb) {
  var gAPIOptions = {
    iss: opts.email,
    scope: 'https://www.googleapis.com/auth/devstorage.read_write',
    keyFile: opts.pem
  }
  
  var gapi = new gapitoken(gAPIOptions, function(err) {
    if (err) return cb(err)
    return cb(false, clientRequest)
  })
  
  function clientRequest(opts, cb) { 
    gapi.getToken(function(err, token) {
      if (err) return cb(err)  
      opts.headers = opts.headers || {}
      opts.headers.Authorization = 'Bearer ' + token
      opts.headers.Date = new Date().toString()
      opts.headers.Host = 'www.googleapis.com'
      opts.headers['Content-Length'] = 0
      opts.headers['x-goog-api-version'] = 2
      opts.json = true
      request(opts, cb)
    })
  }
}
