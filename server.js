var http = require('http');
var fs = require('fs');
var path = require('path');
var Transform = require('stream').Transform;

function createLiner() {
  var liner = new Transform( { objectMode: true } );

  liner._transform = function (chunk, encoding, done) {
    var data = chunk.toString();
    if (this._lastLineData) data = this._lastLineData + data;

    var lines = data.split('\n');
    this._lastLineData = lines.splice(lines.length-1,1)[0];

    lines.forEach(this.push.bind(this));
    done();
  }

  liner._flush = function (done) {
    if (this._lastLineData) this.push(this._lastLineData);
    this._lastLineData = null;
    done();
  }

  return liner;
}

http.createServer(function (request, response) {
    console.log('request starting...' + request.url);

    var filePath = '.' + request.url;
    if (filePath == './')
        filePath = './index.html';

    var extname = path.extname(filePath);
    var contentType = 'text/html';  // default
    switch (extname) {
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
        case '.log':
            contentType = 'text/plain';
            break;
        case '.png':
            contentType = 'image/png';
            break;  
    }

    fs.readFile(filePath, function(error, content) {
        if (error) {
            if(error.code == 'ENOENT'){
                if (extname != '.log') {
                    response.writeHead(404, { 'Content-Type': contentType });
                    response.end('Not found');
                } else
                {
                  var reqPattern = '^' + unescape(request.url.slice(1,-4))
                  //response.end('virtual file' + reqPattern);
                  var hasBeenProcessed = false;

                  function createTransformer() {
                    var transformer = new Transform( { objectMode: true } );
                    transformer._transform = function (line, encoding, done) {
                      if (hasBeenProcessed && !line.match(reqPattern)) this.emit('end');
                      if (line.match(reqPattern)) {
                        this.push( line + "\n");
                        hasBeenProcessed = true;
                      }
                      done();
                    };
                    return transformer;
                  }

                  //var home = 'C:\\Users\\Public\\server_dir'
                  var readable = fs.createReadStream(__dirname + '/exceptions.log'); //, { encoding: 'utf8', highWaterMark: 1*255});
                  response.writeHead(200, { 'Content-Type': contentType });

                  readable.pipe(createLiner()) // transform the input stream into per-line events
                    .pipe(createTransformer()) // transform the data - filters only lines starting to pattern
                    .pipe(response);
                 return;
                }
            }
            else {
                response.writeHead(500);
                response.end('Sorry, check with the site admin for error: '+error.code+' ..\n');
                response.end(); 
            }
        }
        else {
            response.writeHead(200, { 'Content-Type': contentType });
            response.end(content, 'utf-8');
        }
    });

}).listen(80);

