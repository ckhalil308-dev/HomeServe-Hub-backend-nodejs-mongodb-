const express = require('express');
const app = express();
const dotenv = require('dotenv');
const authRouter = require('./routers/authRoutes');
dotenv.config();
const port = process.env.PORT || 3000;
const connectDB = require('./config/db');
connectDB();
app.use(express.json());

app.get('/test', (req, res) => {
  res.send('test');
});
app.use("/api/auth",authRouter);

app.listen(port, () => console.log(`Server running on http://localhost:${port}`));





