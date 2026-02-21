import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXP = '7d';

// Регистрация (создаёт запись в users с password_hash)
router.post('/signup', async (req, res) => {
    const { name, lastName, patronymic, login, password, head } = req.body;
    if (!login || !password) return res.status(400).json({ error: 'login и password required' });

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const { data, error } = await supabase
        .from('users')
        .insert([{ name, lastName, patronymic, login, password: password_hash, head }]) // по умолчанию руководитель admin
        .select()
        .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json({ id: data.id });
});

// Логин — вернёт JWT и/или установит httpOnly cookie
router.post('/login', async (req, res) => {
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
    // res.cookie('token', token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
    res.json({ token, id: user.id, name: user.name, lastName: user.lastName, patronymic: user.patronymic, login: user.login });
});

router.get('/me', requireAuth, async (req, res) => {
    try {
        console.log('User from middleware:', req.user); // Для отладки

        const userId = req.user.id; // Используем id, а не sub
        console.log('Looking for user with ID:', userId);

        const { data: user, error } = await supabase
            .from('users')
            .select('id, login, name, lastName, patronymic')
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

// Logout
router.post('/logout', (req, res) => {
    // res.clearCookie('token', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
    res.status(204).end();
});

export default router;