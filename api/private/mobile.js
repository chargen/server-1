var app = require('koa')(),
  datauri = require('datauri'),
  _ = require('lodash'),
  parse = require('co-body'),
  jwt = require('koa-jwt'),
  route = require('koa-route'),
  generatePassword = require('password-generator'),

  config = require('../../config'),
  usersService = require('../../service/user'),
  errors = require('../../helper/errors')
;

function *data() {
  this.body = {
    motd: 'Welcome to Microsoft Education Delivery. This is a sample MOTD.',
    data: {
      0: { title: '/', items: [
        { id: 1, type: 'folder', title: 'Grade 5', itemsCount: 4 },
        { id: 2, type: 'folder', title: 'Grade 6', itemsCount: 4 },
        { id: 4, type: 'folder', title: 'Demo', itemsCount: 5 }
      ]},
      1: {title: 'Grade 5', items: [
        { id: 11, type: 'folder', title: 'Maths', itemsCount: 1 },
        { id: 12, type: 'folder', title: 'English', itemsCount: 1 },
        { id: 13, type: 'folder', title: 'Science', itemsCount: 1 },
        { id: 14, type: 'folder', title: 'Values', itemsCount: 1 }
      ]},
      4: {title: 'Demo', items: [
        { id: 4001, views: 15, downloads: 26, type: 'media', subtype: 'mp4', title: 'Big video file', preview: datauri('public/resources/preview/b.png') },
        { id: 4002, views: 19, downloads: 26, type: 'media', subtype: 'png', title: 'Demo Image 1', preview: datauri('public/resources/preview/4002.png') },
        { id: 4003, views: 21, downloads: 26, type: 'media', subtype: 'png', title: 'Demo Image 2', preview: datauri('public/resources/preview/4003.png') },
        { id: 4004, views: 23, downloads: 26, type: 'media', subtype: 'txt', title: 'Demo Text 1', preview: datauri('public/resources/preview/text.png') },
        { id: 4005, views: 24, downloads: 26, type: 'media', subtype: 'txt', title: 'Demo Text 2', preview: datauri('public/resources/preview/text.png') }
      ]},
      41: {title: 'General', items: [
      ]},
      11: {title: 'Maths', items: [
        { id: 1001, views: 15, downloads: 31, type: 'media', subtype: 'mp4', title: 'Grade 5 Maths', preview: datauri('public/resources/preview/b.png') }
      ]},
      12: {title: 'English', items: [
        { id: 1002, views: 15, downloads: 26, type: 'media', subtype: 'mp4', title: 'Grade 5 English', preview: datauri('public/resources/preview/a.png') }
      ]},
      13: {title: 'Science', items: [
        { id: 1003, views: 15, downloads: 26, type: 'media', subtype: 'mp4', title: 'Grade 5 Science', preview: datauri('public/resources/preview/c.png')}
      ]},
      14: {title: 'Values', items: [
        { id: 1004, views: 15, downloads: 26, type: 'media', subtype: 'mp4', title: 'Grade 5 Values', preview: datauri('public/resources/preview/d.png') }
      ]},
      21: {title: 'Maths', items: [
        { id: 2001, views: 15, downloads: 26, type: 'media', subtype: 'mp4', title: 'Grade 6 Maths', preview: datauri('public/resources/preview/b.png') }
      ]},
      22: {title: 'English', items: [
        { id: 2002, views: 15, downloads: 26, type: 'media', subtype: 'mp4', title: 'Grade 6 English', preview: datauri('public/resources/preview/a.png') }
      ]},
      23: {title: 'Science', items: [
        { id: 2003, views: 15, downloads: 26, type: 'media', subtype: 'mp4', title: 'Grade 6 Science', preview: datauri('public/resources/preview/c.png')}
      ]},
      24: {title: 'Values', items: [
        { id: 2004, views: 15, downloads: 26, type: 'media', subtype: 'mp4', title: 'Grade 6 Values', preview: datauri('public/resources/preview/d.png') }
      ]}
    }
  };
};

function *getComments(id) {
  console.log(id);
  console.log(this.params);
  var collection = require('../../config/mongo').get('comments');
  var data = yield collection.find({ id: parseInt(id,10) });
  console.log(data);
  this.body = data;
  this.status = 'ok';
};

var titles = {
  4001: 'Text2Teach Demo Teaching Observational Documentary',
  1001: 'Grade 5 Maths',
  1002: 'Grade 5 English',
  1003: 'Grade 5 Science',
  1004: 'Grade 5 Values',
  2001: 'Grade 6 Maths',
  2002: 'Grade 6 English',
  2003: 'Grade 6 Science',
  2004: 'Grade 6 Values',
  4002: 'Demo Image 1',
  4003: 'Demo Image 2',
  4004: 'Demo Text 1',
  4005: 'Demo Text 2'
};

function *getDetails(id) {
  id = +id;
  var extension = 'mp4';
  if (id === 4002 || id === 4003) { extension = 'png' }
  if (id === 4004 || id === 4005) { extension = 'txt' }
  this.status = 'ok';
  
  this.body = {
    id: id,
    title: titles[id],
    description: 'This is an example description for id ' + id + ' generated by server on ' + (new Date()).toString(),
    links: [
      'http://microsofteducationdelivery.net',
      'http://microsoft.com',
      'http://try.buildwinjs.com'
    ],
    subtype: extension
  };
};

function *postComments() {
  var data = yield parse(this);
  this.status = 'no content';
  var date = new Date();
  data.date = date.toISOString().substr(0,10);
  console.log(data);
  var collection = require('../../config/mongo').get('comments');
  yield collection.insert(data);
};


app.use(route.get('/data', data));
app.use(route.get('/comments/:id', getComments));
app.use(route.get('/media/:id', getDetails));
app.use(route.post('/comments', postComments));
module.exports = app;
