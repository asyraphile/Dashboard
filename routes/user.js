const express = require('express');
//mysql library
const mysql = require('mysql2');
//uuid library
const {v4:uuidv4} = require('uuid');
const router = express.Router();
//json web token lib
const jwt = require('jsonwebtoken');
//password encryptor and decryptor
const password_encryptor = require('../password/password');

//create mysql connection
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root', //User@123
    database: 'dashboard',
});

//json web token secret key
const secretKey = 'hello_world';

function json_token_generator(user){
    const token = jwt.sign(user, secretKey, { expiresIn: '1h' });
    return token
}

function verify_token(token){
    // Verify JWT
    var decoded = jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            // Token is invalid or has expired
            console.error('Invalid token:', err);
            return 0;
        }
        
        // Token is valid, decoded payload contains the user data
        console.log('Decoded token:', decoded);
    });
    return decoded
}

connection.connect((err) =>{
    if (err){
        console.log(`Error connecting to MySQL: ${err}`);
    } else {
        console.log('Connected to MySQL');
    }
});
function create_uuid(){
    const uuid = uuidv4();
    const uuid_no_hyphens = uuid.replace(/-/g, '');
    return uuid_no_hyphens;
}

function getCurrentDateTime() {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(currentDate.getDate()).padStart(2, '0');
    const hours = String(currentDate.getHours()).padStart(2, '0');
    const minutes = String(currentDate.getMinutes()).padStart(2, '0');
    const seconds = String(currentDate.getSeconds()).padStart(2, '0');
  
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
//Create User
router.post('/create', (req, res) => {
    const request_data = req.body;

    // Validate email format
    if (request_data['email'].includes('@')) {
        // Proceed to create user
        // Create PK
        const id = create_uuid();
        const email = request_data['email'];
        const password = password_encryptor.encryptPassword(request_data['password']);
        const username = request_data['username'];

        const sql_query = `
            INSERT INTO \`dashboard\`.\`user\` (\`id\`, \`email\`, \`password\`, \`username\`, \`date_created\`, \`date_modified\`)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        connection.query(sql_query, [id, email, password, username, getCurrentDateTime(), getCurrentDateTime()], (err, result) => {
            if(!err){
                // Success case
                res.status(201).json({
                    message: 'User has been successfully created.',
                    data: request_data,
                });
                //send email notification
            }
            else if (err.code === 'ER_DUP_ENTRY') {
                // Handle the error within the callback
                res.status(400).json({
                    message: 'Duplicate entry. User with this email already exists.',
                    data: request_data,
                });
            } else if (err){
                res.status(400).json({
                    message: `${err}`,
                    data: request_data,
                });
            }
        });

    } else {
        res.status(400).json({
            message: 'Wrong Email format',
            data: request_data,
        });
    }
});
//Read All User
router.get('/read_all_users', (req, res) =>{
    connection.query('SELECT * FROM dashboard.user', (err, results) => {
        if (err) {
            // Handle the error
            console.error('Error executing query:', err);
            res.status(500).json({
              message: 'Internal Server Error',
              data: request_data,
            });
        } else {
            if (results.length > 0) {
                res.status(200).json({
                    message: 'All User Data is retrieved.',
                    data: results, // You might want to send user data in the response
                  });
            } else {
                res.status(404).json({
                    message: 'User not found',
                    data: request_data,
                  });
            }
        }
    });
});
//Read one user
router.get('/read_user/:id',(req, res) => {
    const id = req.params.id;
    connection.query('SELECT * FROM dashboard.user WHERE id=?', [id], (err, results) => {
        if (err) {
            // Handle the error
            console.error('Error executing query:', err);
            res.status(500).json({
              message: 'Internal Server Error',
              data: request_data,
            });
        } else {
            if (results.length > 0) {
                res.status(200).json({
                    message: 'User Data is retrieved.',
                    data: results[0], // You might want to send user data in the response
                  });
            } else {
                res.status(404).json({
                    message: 'User not found',
                    data: request_data,
                  });
            }
        }
    })
});
//Login
router.post('/login', (req, res) =>{
    const request_data = req.body;
    //validate email
    if (request_data['email'].includes('@')){
        //proceed with login
        const email = request_data['email']
        const entered_password = request_data['password']
        connection.query('SELECT * FROM dashboard.user WHERE email = ?', [email], (err, results) => {
            if (err) {
              // Handle the error
              console.error('Error executing query:', err);
              res.status(500).json({
                message: 'Internal Server Error',
                data: request_data,
              });
            } else {
              if (results.length > 0) {
                // User found, check the password
                const storedPassword = results[0].password; // Assuming there is a 'password' column
          
                // Compare entered_password with storedPassword (use your password comparison method)
                const isPasswordMatch = password_encryptor.comparePasswords(entered_password, storedPassword);
          
                if (isPasswordMatch) {
                  // Passwords match, you can proceed with your logic
                  res.status(200).json({
                    message: 'Login successful',
                    data: results[0], // You might want to send user data in the response
                    token: json_token_generator(results[0])
                  });
                } else {
                  // Passwords do not match
                  res.status(401).json({
                    message: 'Invalid credentials',
                    data: request_data,
                  });
                }
              } else {
                // No user found with the given email
                res.status(404).json({
                  message: 'User not found',
                  data: request_data,
                });
              }
            }
          });
    } else {
        res.json({
            message: "Wrong Email format",
            data: request_data,
        })
    }
    console.log('Received POST data:', request_data['email']);
    // Send a response
    //res.json({ message: 'POST request received successfully', data: request_data});
});

router.get('/get_id/:id', (req, res) =>{
    const user_id = req.params.id;
    res.json({
        id: user_id,
        name: "Asyraf"
    })
});

router.post('/logout', (req, res) =>{
    //check bearer token
    try{
        //slice from index 6 until the end
        const token = req.headers['authorization'].slice(7,)
        console.log(token);
        const decoded = verify_token(token);
        if(decoded != 0){
            res.json({
                "message":"Logout successful!",
            })
        }
        else{
            res.status(400).json({
                message: 'Token is invalid',
              });
        }
        
    }catch(e){
        res.status(400).json({
            message: 'Error',
            data: e,
          });
    }
    
});

module.exports = router;