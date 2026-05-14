import { Router, type Request, type Response } from 'express';
import { supabase } from '../config/supabase.js';
import bcrypt from 'bcrypt';

const router = Router();

router.get("/", async (req: Request, res: Response) => {
    const { managerId } = req.query;

    let query = supabase.from("users").select(`
        id, 
        login, 
        name, 
        lastName, 
        patronymic, 
        isAdmin,
        head
    `).order('id');

    if (managerId) {
        query = query.or(`head.eq.${managerId}`);
    }

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

router.get("/:id", async (req: Request, res: Response) => {
    const { id } = req.params;
    const { data, error } = await supabase
        .from("users")
        .select(`
            name, 
            lastName, 
            patronymic,
            login, 
            isAdmin, 
            head
        `)
        .eq("id", id)
        .maybeSingle();
    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: "user not found" });
    res.json(data);
});

router.post("/", async (req: Request, res: Response) => {
    const { title, completed = false } = req.body;
    const { data, error } = await supabase
        .from("users")
        .insert([{ title, completed }])
        .select();
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(data[0]);
});

router.put("/:id", async (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body;
    const { data, error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", id)
        .select();
    if (error) return res.status(500).json({ error: error.message });
    // Отправляем данные со статусом 200 (OK)
    res.status(200).json(updates || null);
});

// смена пароля
router.put("/:id/change-password", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { currentPassword, newPassword } = req.body;

        // валидация данных
        if (!id) {
            return res.status(404).json({ message: "ID пользователя не указан" })
        }

        if (!currentPassword) {
            return res.status(404).json({ message: "Текущий пароль обязателен" })
        }

        if (!newPassword) {
            return res.status(404).json({ message: "Новый пароль обязателен" })
        }

        // получаем пользователя из бд
        const { data: user, error: fetchError} = await supabase
            .from("users")
            .select("id, password") // Выбираем нужные поля
            .eq("id", id)
            .single();

        if (fetchError || !user) {
            console.error("Ошибка получения пользователя: ", fetchError)
        }

        // расшифровываем текущий пароль
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: "Неверный текущий пароль" }); 
        }

        // хешируем новый пароль
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // обновляем пароль в бд
        const {data: updatedUser, error: updateError} = await supabase
        .from("users")
        .update({
            password: hashedPassword
        })
        .eq("id", id)
        .single();

        if (updateError) {
            console.error("Ошибка обновления пароля: ", updateError);
            return res.status(401).json({ message: "Не удалось обновить пароль" });
        }

        res.status(200).json({
            message: "Пароль успешно изменён",
            user: updatedUser
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({message: "Ошибка сервера"})
    }
});

router.delete("/:id", async (req: Request, res: Response) => {
    const { id } = req.params;
    const { error } = await supabase.from("users").delete().eq("id", id);
    if (error) return res.status(500).json({ error: error.message });
    res.status(204).end();
});

export default router;