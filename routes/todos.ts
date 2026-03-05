import { Router, type Request, type Response } from 'express';
import { supabase } from '../config/supabase.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

interface TodoPayload {
    title: string;
    desc: string;
    expireDate?: string;
    createDate: string;
    updateDate: string;
    priority: string;
    status: string;
    creator: string;
    responsible?: string;
}

router.use(requireAuth); // обязательная авторизация для маршрута

router.get("/", async (req: Request, res: Response) => {
    const {userId} = req.query;

    let query = supabase.from('todos').select('*');

    if (userId) {
        query = query.or(`creator.eq.${userId},responsible.eq.${userId}`);
    }

    const { data, error } = await query;

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

router.get("/:id", async (req: Request, res: Response) => {
    const { id } = req.params;
    const { data, error } = await supabase
        .from("todos")
        .select("*")
        .eq("id", id)
        .maybeSingle();
    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: "Todo not found" });
    res.json(data);
});

router.post("/", async (req: Request<{}, {}, TodoPayload>, res: Response) => {
    const { title, desc, expireDate, createDate, updateDate, priority, status, creator, responsible } = req.body;
    const { data, error } = await supabase
        .from("todos")
        .insert([{ title, desc, expireDate, createDate, updateDate, priority, status, creator, responsible }])
        .select();
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(data[0]);
});

router.put("/:id", async (req: Request<{ id: string }, {}, Partial<TodoPayload>>, res: Response) => {
    const { id } = req.params;
    const updates = req.body;
    const { data, error } = await supabase
        .from("todos")
        .update(updates)
        .eq("id", id)
        .select();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data[0] || null);
});

router.delete("/:id", async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;
    const { error } = await supabase.from("todos").delete().eq("id", id);
    if (error) return res.status(500).json({ error: error.message });
    res.status(204).end();
});

export default router;