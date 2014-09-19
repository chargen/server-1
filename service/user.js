var
  _ = require('lodash'),

  bcrypt = require('bcrypt-nodejs'),

  db = require('../db'),
  table = db.User,

  errors = require('../helper/errors'),
  C = require('../helper/constants')
;

module.exports = {
  isPermitted: function (action, data, author) {
    if (action === C.CREATE && !author && data.type === 'owner') {
      return true;
    }

    if (action === C.UPDATE && data.type === 'owner') {
      return false;
    }

    if (action === C.DELETE && author._id === data.id) {
      return false;
    }

    return true;
  },

  findById: function (id, author) {
    var where = {id: id};
    if (author) {
      where.CompanyId = author.CompanyId;
    }

    return table.find({
      where: where,
      attributes: [ 'id', 'name', 'login', 'email', 'type', 'CompanyId', 'phone']
    });
  },

  findByCredentials: function* (credentials) {
    var request = {};
    if (credentials.email) {
      request = { email: credentials.email.toLowerCase() };
    } else {
      request = { login: credentials.login.toLowerCase() };
    }
    var user = yield table.find({ where: request });
    if (!user) {
      return null;
    }
    try {
      return bcrypt.compareSync(credentials.password, user.password) ? user : null;
    } catch (e) {
      return null;
    }
  },

  add: function* (data, author) {
    var company = yield (author ? author.getCompany() : db.Company.create());

    if (!this.isPermitted(C.CREATE, data, author)) {
      throw new errors.AccessDeniedError('Access denied');
    }
    var user;
    try {
      data.password = bcrypt.hashSync(data.password);
      user = yield table.create(data);
    } catch (e) {
      yield company.destroy();
      console.log(e);
      if (e.code === 'ER_DUP_ENTRY') {
        throw new errors.DuplicateError('Duplicate entry');
      } else {
        throw new errors.ValidationError('Validation failed', { errors: e });
      }
    }
  },

  list: function* (author) {
    return yield table.findAll({
      where: { CompanyId: author.CompanyId },
      attributes: ['id', 'login', 'type', 'name']
    });
  },

  update: function* (id, data, author) {
    if (!this.isPermitted(C.UPDATE, data, author)) {
      throw new errors.AccessDeniedError('Access denied');
    }


    var user = yield db.Users.find({ where: { id: id, CompanyId: author.CompanyId }});
    if (data.password) {
      user.password = bcrypt.hashSync(data.password);
    }

    _.forIn(data, function(value, key) {
      user[value] = key;
    });
    user.email = data.email;
    user.phone = data.phone;

    yield user.save();
  },

  removeMultiple: function (ids, author) {
    console.log(ids);
    console.log(author.id);
    if (ids.indexOf(author.id.toString()) !== -1) {
      throw new errors.AccessDeniedError('Access denied');
    }
    return table.destroy({ id: ids, CompanyId: author.CompanyId });
  }
};
