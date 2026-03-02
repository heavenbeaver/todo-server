import express, { type Request, type Response } from 'express';
import cors from 'cors';
import todosRouter from './routes/todos.js';
import usersRouter from './routes/users.js';
import authRouter from './routes/auth.js';

const app = express();

app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());

const PORT = process.env.PORT ?? 3000;

app.get("/", (req: Request, res: Response) => res.send("OK"));

// API
app.use('/auth', authRouter);
app.use('/todos', todosRouter);
app.use('/users', usersRouter);

app.listen(PORT, () => {
    console.log(`Server listening: http://localhost:${PORT}`);
});