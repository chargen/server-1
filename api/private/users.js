var service = require('../../service/user'),
  app = require('../helper/crud')(service),
  route = require('koa-route'),
  fs = require('co-fs'),
  excel = require('../../service/createExcelExport'),
  user = require('../../service/user'),
  send = require('koa-send'),
  db = require('../../db')
  ;

function* userImport () {
  var creds = yield user.importUsers(this.user, this);

  if (creds) {
    var path = yield excel.createExcelFile(creds.errors, creds.fields, 'sheet1', this.user);

    yield send(this, path);
    yield fs.unlink(path);
  } else {
    this.body = 'ok';
    this.status = 200;
  }
  return this;
}

function* userInvite() {
  var data = yield parse(this);

  if(this.user) {
    yield this.user.updateAttributes({
      inviteUser: data.currentValue
    });
  }
}

function* getFileImport() {
  var path = './static/userImportTemplate.xlsx';
  var fstat = yield fs.stat(path);

  if (fstat.isFile()) {
    this.set('Content-Disposition', 'attachment; filename="userImportTemplate.xlsx"');
    this.body = yield fs.createReadStream(path);
  }
}

app.use(route.post('/userImport', userImport));
app.use(route.get('/getImportFile', getFileImport));

module.exports = app;