const bcrypt = require('bcrypt');
const saltRounds = 10;

// Function to hash a password
function encryptPassword(password) {
    return bcrypt.hashSync(password, 10);
  }
  
function comparePasswords(inputPassword, hashedPassword) {
    return bcrypt.compareSync(inputPassword, hashedPassword);
  }
  
  module.exports = { encryptPassword, comparePasswords };