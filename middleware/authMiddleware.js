import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET;

export function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;

    // Получаем токен из заголовка Authorization
    let token = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = {
            id: payload.sub,
            login: payload.login || payload.username
        };

        // Проверяем, что установили id
        if (!req.user.id) {
            console.error('No user ID in token payload:', payload);
            return res.status(401).json({ error: 'Invalid token structure' });
        }

        next();
    } catch (err) {
        console.error('JWT verification error:', err);
        return res.status(401).json({ error: 'Invalid token' });
    }
}