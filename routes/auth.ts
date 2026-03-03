import { Router, type Request, type Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET must be defined');
const JWT_EXP = '7d';

interface SignupRequest {
    name: string;
    lastName: string;
    patronymic?: string;
    login: string;
    password: string;
    head?: string;
}

interface LoginRequest {
    login: string;
    password: string;
}

// Регистрация нового пользователя
router.post('/signup', async (req: Request<{}, {}, SignupRequest>, res: Response) => {
    const { name, lastName, patronymic, login, password, head } = req.body;
    if (!login || !password) return res.status(400).json({ error: 'login и password required' });

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const { data, error } = await supabase
        .from('users')
        .insert([{ name, lastName, patronymic, login, password: password_hash, head, isAdmin: false }])
        .select()
        .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });
    // res.status(201).json({ id: data.id });

    const token = jwt.sign({sub: data.id, login: data.login}, JWT_SECRET, {expiresIn: JWT_EXP});
    res.status(201).json({
        token,
        id: data.id,
        name: data.name,
        lastName: data.lastName,
        patronymic: data.patronymic,
        login: data.login,
        isAdmin: data.isAdmin
    });
});

// Вход в систему
router.post('/login', async (req: Request<{}, {}, LoginRequest>, res: Response) => {
    const { login, password } = req.body;
    if (!login || !password) return res.status(400).json({ error: 'Введите логин и пароль' });

    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('login', login)
        .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });
    
    if (!user) return res.status(401).json({ error: 'Пользователя с таким логином не существует' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Вы ввели неверный пароль' });

    const token = jwt.sign({ sub: user.id, login: user.login }, JWT_SECRET, { expiresIn: JWT_EXP });
    res.json({ token, id: user.id, name: user.name, lastName: user.lastName, patronymic: user.patronymic, login: user.login, isAdmin: user.isAdmin });
});

// Получение информации о текущем пользователе
router.get('/me', requireAuth, async (req: Request, res: Response) => {
    try {
        console.log('User from middleware:', req.user);

        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized'});
            return;
        }

        const userId = req.user.id;

        const { data: user, error } = await supabase
            .from('users')
            .select('id, login, name, lastName, patronymic, isAdmin')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: error.message });
        }

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        console.log('Found user:', user);
        res.json(user);

    } catch (error) {
        console.error('Server error in /me:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Выход из системы
router.post('/logout', (req: Request, res: Response) => {
    res.status(204).end();
});

export default router;