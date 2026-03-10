import express from "express";
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

  if (!users.find(u => u.email === adminEmail)) {

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

ensureFiles();

function authenticateToken(req, res, next) {

  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, (err, user) => {

    if (err) return res.sendStatus(403);

    req.user = user;
    next();
  });
}

function isAdmin(req, res, next) {

  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Apenas admin" });
  }
}

app.post("/api/auth/register", async (req, res) => {

  const { username, email, password } = req.body;

  const users = await fs.readJson(USERS_FILE);

  if (users.find(u => u.email === email)) {
    return res.status(400).json({ message: "Email já cadastrado" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = {
    id: Date.now().toString(),
    username,
    email,
    password: hashedPassword,
    xp: 0,
    level: 1,
    favorites: []
  };

  users.push(user);

  await fs.writeJson(USERS_FILE, users);

  res.json({ message: "Usuário criado" });
});

app.post("/api/auth/login", async (req, res) => {

  const { email, password } = req.body;

  const users = await fs.readJson(USERS_FILE);

  const user = users.find(u => u.email === email);

  if (!user) return res.status(400).json({ message: "Login inválido" });

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) return res.status(400).json({ message: "Login inválido" });

  const token = jwt.sign(
    { id: user.id, role: user.role || "user" },
    SECRET_KEY,
    { expiresIn: "7d" }
  );

  const { password: _, ...userData } = user;

  res.json({ token, user: userData });
});

app.get("/api/data", async (req, res) => {

  const data = await fs.readJson(CHANNELS_FILE);

  res.json(data);
});

app.post("/api/admin/channels", authenticateToken, isAdmin, async (req, res) => {

  const channel = req.body;

  const data = await fs.readJson(CHANNELS_FILE);

  data.channels.push(channel);

  await fs.writeJson(CHANNELS_FILE, data);

  res.json({ message: "Canal adicionado" });
});

export default app;
