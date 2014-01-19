var port = process.env.PORT || 8080

var Dat = require('dat')

var bucket = process.env['ARCHIVE_BUCKET']
var gcsEmail = process.env['ARCHIVE_EMAIL']
var pemPath = process.env['ARCHIVE_PEM']
var projectId = process.env['ARCHIVE_PROJECT_ID']

var options = {
  'email': gcsEmail,
  'pem': pemPath,
  'bucket': bucket,
  headers: { 'x-goog-project-id': projectId}
}

var dgcs = require('./')

var dat = new Dat('./data', function ready(err) {
  dat.init(function(err) {
    if (err) console.error(err)
    dat.serve({port: port}, function() {
      dgcs(options, function(err, clientRequest) {
        importBucket()
        
        function importBucket(next) {
          console.log('importing', next ? next : '')
          var url = 'https://www.googleapis.com/storage/v1beta2/b/' + options.bucket + '/o'
          if (next) url += '?pageToken=' + next
          clientRequest({url: url}, function(err, resp, body) {
            if (err) return console.error(err)
            var ws = dat.createWriteStream({objects: true, primary: 'id'})
            body.items.map(function(i) {
              ws.write(i)
            })
            ws.end()
            if (body.nextPageToken) {
              importBucket(body.nextPageToken)
            } else {
              if (resp.statusCode < 299) console.log('finished import')
              else console.log(resp.statusCode, body)
              setTimeout(importBucket, 60000 * 60)
            }
          })
        }
      })
    })
  })
})
