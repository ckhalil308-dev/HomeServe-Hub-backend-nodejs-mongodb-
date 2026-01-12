const express = require('express');
const app = express();
const dotenv = require('dotenv');
dotenv.config();
const port = process.env.port ;
const connectDB = require('./config/db');
connectDB();
 
app.get('/test', (req, res) => {
  res.send('test');
});

app.listen(port, () => console.log(`Server running on http://localhost:${port}`));





