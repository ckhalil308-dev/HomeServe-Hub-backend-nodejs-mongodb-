const express = require('express');
const app = express();
const dotenv = require('dotenv');
const cors = require('cors');
const authRouter = require('./routers/authRoutes');
const userRouter = require('./routers/userRoutes');
const demandesRouter = require('./routers/demandesRoutes');
const serviceRoutes = require('./routers/serviceRoutes');
app.use(cors({
  origin: '*', // Allow all origins
  credentials: false // No credentials needed
}));
dotenv.config();
const port = process.env.PORT || 3000;
const connectDB = require('./config/db');
connectDB();
app.use(express.json());

app.get('/test', (req, res) => {
  res.send('test');
});
app.use("/api/auth",authRouter);
app.use("/api/users",userRouter);
app.use('/api/demandes', demandesRouter);
app.use('/api/services', serviceRoutes);

app.listen(port, () => console.log(`Server running on http://localhost:${port}`));





