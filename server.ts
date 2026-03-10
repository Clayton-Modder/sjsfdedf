import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import fs from "fs-extra";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USERS_FILE = path.join("/tmp", "contas.json");
const CHANNELS_FILE = path.join("/tmp", "appcanais.json");

const SECRET_KEY = "megatv-secret-key";

app.use(cors());
app.use(express.json());

async function ensureFiles() {

  if (!(await fs.pathExists(USERS_FILE))) {
    await fs.writeJson(USERS_FILE, []);
  }

  if (!(await fs.pathExists(CHANNELS_FILE))) {
    await fs.writeJson(CHANNELS_FILE, {
      categories: [],
      channels: []
    });
  }

  const users = await fs.readJson(USERS_FILE);

  const adminEmail = "admin@tvonlinehd.com";

  if (!users.find((u:any) => u.email === adminEmail)) {

    const hashedPassword = await bcrypt.hash("admin", 10);

    users.push({
      id: "admin",
      username: "Administrador",
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
      xp: 999,
      level: 99,
      favorites: []
    });

    await fs.writeJson(USERS_FILE, users);
  }
}

await ensureFiles();

function authenticateToken(req: Request, res: Response, next: NextFunction) {

  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Token necessário" });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {

    if (err) {
      return res.status(403).json({ message: "Token inválido" });
    }

    (req as any).user = user;
    next();
  });
}

function isAdmin(req: Request, res: Response, next: NextFunction) {

  const user = (req as any).user;

  if (user && user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Acesso apenas admin" });
  }
}

app.post("/api/auth/register", async (req: Request, res: Response) => {

  try {

    const { username, email, password } = req.body;

    const users = await fs.readJson(USERS_FILE);

    if (users.find((u:any) => u.email === email)) {
      return res.status(400).json({ message: "Email já cadastrado" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      id: Date.now().toString(),
      username,
      email,
      password: hashedPassword,
      xp: 0,
      level: 1,
      favorites: []
    };

    users.push(newUser);

    await fs.writeJson(USERS_FILE, users);

    res.json({ message: "Usuário criado" });

  } catch {
    res.status(500).json({ message: "Erro no registro" });
  }

});

app.post("/api/auth/login", async (req: Request, res: Response) => {

  try {

    const { email, password } = req.body;

    const users = await fs.readJson(USERS_FILE);

    const user = users.find((u:any) => u.email === email);

    if (!user) {
      return res.status(400).json({ message: "Credenciais inválidas" });
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(400).json({ message: "Credenciais inválidas" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role || "user" },
      SECRET_KEY,
      { expiresIn: "7d" }
    );

    const { password: _, ...userData } = user;

    res.json({ token, user: userData });

  } catch {
    res.status(500).json({ message: "Erro no login" });
  }

});

app.get("/api/data", async (_req: Request, res: Response) => {

  try {

    const data = await fs.readJson(CHANNELS_FILE);

    res.json(data);

  } catch {

    res.json({
      categories: [],
      channels: []
    });

  }

});

app.post("/api/admin/channels", authenticateToken, isAdmin, async (req: Request, res: Response) => {

  try {

    const channel = req.body;

    const data = await fs.readJson(CHANNELS_FILE);

    data.channels.push(channel);

    await fs.writeJson(CHANNELS_FILE, data);

    res.json({ message: "Canal adicionado", channel });

  } catch {
    res.status(500).json({ message: "Erro ao adicionar canal" });
  }

});

app.get("/api/proxy", async (req: Request, res: Response) => {

  try {

    const url = req.query.url as string;

    if (!url) {
      return res.status(400).json({ message: "URL obrigatória" });
    }

    const response = await fetch(url);

    const text = await response.text();

    res.setHeader("Content-Type", "application/xml");

    res.send(text);

  } catch {
    res.status(500).json({ message: "Erro ao buscar EPG" });
  }

});

export default app;
