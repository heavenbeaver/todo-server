import { Router, type Request, type Response } from 'express';
import { supabase } from '../config/supabase.js';

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
    res.json(data[0] || null);
});

router.delete("/:id", async (req: Request, res: Response) => {
    const { id } = req.params;
    const { error } = await supabase.from("users").delete().eq("id", id);
    if (error) return res.status(500).json({ error: error.message });
    res.status(204).end();
});

export default router;