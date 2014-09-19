module.exports = function (sequelize, DataTypes) {
  var User = sequelize.define('User', {
    name: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: true
      }
    },
    login: {
      type: DataTypes.STRING,
      unique: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING
    },
    type: {
      type: DataTypes.ENUM('owner', 'admin', 'operator', 'mobile'),
      allowNull: false
    }
  }, {
    associate: function(models) {
      User.belongsTo(models.Company);
    }
  });

  return User;
};