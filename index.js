// script doing gnu `cat exceptions.log | grep '^2016-08-24 16:52:49'`

var fs = require('fs');
var util = require('util');
var Transform = require('stream').Transform;
var liner = require(__dirname + '/liner.js');

var readable    = fs.createReadStream(__dirname + '/exceptions.log');

var hasBeenProcessed = false;
var reqPattern = '^2016-08-24 16:52:49';

var transformer = new Transform( { objectMode: true } );
transformer._transform = function (line, encoding, done) {
  if (hasBeenProcessed && !line.match(reqPattern)) this.emit('end');
  if (line.match(reqPattern)) {
    this.push( line + "\n");
    hasBeenProcessed = true;
  }
  done();
 };


readable.pipe(liner) // transform the input stream into per-line events
  .pipe(transformer) // transform the data
  .pipe(process.stdout); // write the data to the output stream


/* 
Resources:

https://github.com/tj/search
https://github.com/search?q=grep+nodejs
https://howtonode.org/coding-challenges-with-streams
https://www.npmjs.com/search?q=split&page=1&ranking=optimal
http://stackoverflow.com/questions/20777508/how-to-parse-lines-from-a-buffer-with-streams
http://codewinds.com/blog/2013-08-20-nodejs-transform-streams.html#creating_object_stream_which_filters_out_data

*/
