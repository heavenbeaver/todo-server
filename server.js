import express from 'express';
import cors from 'cors';
import todosRouter from './routes/todos.js';
import usersRouter from './routes/users.js';
import authRouter from './routes/auth.js';
import cookieParser from 'cookie-parser';

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => res.send("OK"));

// API
app.use('/auth', authRouter);
app.use('/todos', todosRouter);
app.use('/users', usersRouter);

app.listen(PORT, () => console.log(`Server listening: http://localhost:${PORT}`));