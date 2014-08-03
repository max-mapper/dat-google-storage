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
  if (err) throw err
  dat.listen(function(err, port) {
    if (err) throw err
    console.log(port)
    dgcs(options, function(err, clientRequest) {
      if (err) throw err
      importBucket()
    
      function importBucket(next) {
        console.log('importing', next ? next : '')
        var url = 'https://www.googleapis.com/storage/v1beta2/b/' + options.bucket + '/o'
        if (next) url += '?pageToken=' + next
        clientRequest({url: url}, function(err, resp, body) {
          if (err) return console.error(err)
          var ws = dat.createWriteStream({objects: true, primary: 'id'})
          body.items.map(function(i) {
            i.key = i.id
            dat.put(i, function(err){
              if (err) console.error('put err', i, err)
            })
          })
          if (body.nextPageToken) {
            importBucket(body.nextPageToken)
          } else {
            if (resp.statusCode < 299) console.log('finished import')
            else console.log(resp.statusCode, body)
          }
        })
      }
    })
  })

})
