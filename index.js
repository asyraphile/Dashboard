const express = require('express');
//read json from body
const body_parser = require('body-parser');
const app = express();
const port = 3000;

//import routes
const user_routes = require('./routes/user');

app.use(body_parser.json());
app.use('/api/users', user_routes);


app.get('/', (req, res) =>{
    res.send('Hello World, GET request.');
});

app.listen(port, () =>{
    console.log(`Backend server is running on http://localhost:${port}`)
});