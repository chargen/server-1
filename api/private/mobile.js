//FIXME: rewrite
var app = require('koa')(),
  db = require('../../db'),
  datauri = require('datauri'),
  parse = require('co-body'),
  route = require('koa-route'),

  mediaService = require('../../service/media'),
  mobileService = require('../../service/mobile')
;

function *data() {
  var company = yield this.user.getCompany();
  this.body = {
    motd: company.motd || '',
    data: yield mobileService.getContent(this.user)
  };
}

function *getComments(id) {
  var media = yield mediaService.findById(id, this.user),
    parentList = [],
    parentId,
    childList = [],
    sortedList = [];

  yield media.increment('views', 1);
  var commentList = yield media.getComments();
  commentList.sort(function (a, b) {
      return new Date(a.dataValues.createdAt) > new Date(b.dataValues.createdAt) ? 1 : -1;
  });
  commentList.forEach(function (item) {
    parentId = item.dataValues.parentId;
    if (parentId) {
      parentId = parentId.toString();

      if (!childList[parentId]) {
        childList[parentId] = [];
      }
      childList[parentId].push(item);
    } else {
      parentList.push(item);
    }
  });
  parentList.forEach(function (parent) {
    parentId = parent.dataValues.id.toString();
    sortedList.push(parent);
    if (childList[parentId]) {
      childList[parentId].forEach(function (child) {
        child.dataValues.reply = true;
        sortedList.push(child);
      });
    }
  });

  this.body = sortedList.map(function (item) {
    var date = item.createdAt;
    item.date = date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate();
    return item;
  });
  return sortedList;
}


function *getDetails(id) {
  var typeToExtension = {
    video: 'mp4',
    image: 'png',
    text: 'txt'
  };

  var media = yield mediaService.findById(id, this.user);
  yield media.increment('downloads', 1);
  this.body = {
    id: media.id,
    title: media.name,
    description: media.description,
    links: media.links.split('\n'),
    subtype: typeToExtension[media.type]
  };
}

function *postComments() {
  var data = yield parse(this);
  var media = yield mediaService.findById(data.id, this.user);
  delete data.id;

  this.status = 204;
  var date = new Date();
  data.date = date.toISOString().substr(0,10);
  data.author = this.user.name;
  var comment = yield db.Comment.create(data);


  yield media.addComment(comment);
}

app.use(route.get('/data', data));
app.use(route.get('/comments/:id', getComments));
app.use(route.get('/media/:id', getDetails));
app.use(route.post('/comments', postComments));
module.exports = app;
