const express = require('express');
const app = express();
const dotenv = require('dotenv');
const cors = require('cors');
const authRouter = require('./routers/authRoutes');
const userRouter = require('./routers/userRoutes');
const demandesRouter = require('./routers/demandesRoutes');
const serviceRoutes = require('./routers/serviceRoutes');
const aiRoutes = require('./routers/aiRoutes');
const commentsRoutes = require('./routers/CommentsRoutes');

const path = require('path');

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
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
app.use('/api/ai', aiRoutes);
app.use('/api/comments', commentsRoutes);

app.listen(port, () => console.log(`Server running on http://localhost:${port}`));





