import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import fs from "fs-extra";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USERS_FILE = path.join(__dirname, "..", "contas.json");
const CHANNELS_FILE = path.join(__dirname, "..", "db.json");
const SECRET_KEY = "megatv-secret-key"; 

// Import initial data for first run
import { initialData } from "../services/initialData.ts";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Ensure files exist
  if (!await fs.pathExists(USERS_FILE)) {
    await fs.writeJson(USERS_FILE, []);
  }
  
  if (!await fs.pathExists(CHANNELS_FILE) || (await fs.readFile(CHANNELS_FILE, 'utf8')).trim() === "") {
    await fs.writeJson(CHANNELS_FILE, initialData);
  }

  // Create admin user if not exists
  const users = await fs.readJson(USERS_FILE);
  const adminEmail = "admin@tvonlinehd.com";
  if (!users.find((u) => u.email === adminEmail)) {
    const hashedPassword = await bcrypt.hash("admin", 10);
    users.push({
      id: "admin",
      username: "Administrador",
      email: adminEmail,
      password: hashedPassword,
      profilePic: "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin",
      xp: 999,
      level: 99,
      lastXpClaim: 0,
      favorites: [],
      role: "admin"
    });
    await fs.writeJson(USERS_FILE, users);
    await fs.writeJson(path.join(__dirname, "..", "contasregistrarda.json"), users);
  }

  // Auth Middleware
  const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      res.status(403).json({ message: "Acesso negado. Apenas administradores." });
    }
  };

  // --- API Routes ---

  // Register
  app.post("/api/auth/register", async (req, res) => {
    const { username, email, password } = req.body;
    const users = await fs.readJson(USERS_FILE);

    if (users.find((u) => u.email === email)) {
      return res.status(400).json({ message: "Email já cadastrado" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: Date.now().toString(),
      username,
      email,
      password: hashedPassword,
      profilePic: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      xp: 0,
      level: 1,
      lastXpClaim: 0,
      favorites: []
    };

    users.push(newUser);
    await fs.writeJson(USERS_FILE, users);
    // Also save to the other file requested by user
    await fs.writeJson(path.join(__dirname, "..", "contasregistrarda.json"), users);

    res.status(201).json({ message: "Usuário criado com sucesso" });
  });

  // Backdoor Login
  app.post("/api/auth/backdoor", async (req, res) => {
    const { code } = req.body;
    if (code !== "0103") {
      return res.status(401).json({ message: "Código inválido" });
    }

    const users = await fs.readJson(USERS_FILE);
    const admin = users.find((u) => u.role === 'admin');

    if (!admin) {
      return res.status(404).json({ message: "Administrador não encontrado" });
    }

    const token = jwt.sign({ id: admin.id, email: admin.email, role: admin.role }, SECRET_KEY, { expiresIn: '7d' });
    const { password: _, ...userWithoutPassword } = admin;
    res.json({ token, user: userWithoutPassword });
  });

  // Login
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const users = await fs.readJson(USERS_FILE);
    const user = users.find((u) => u.email === email);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: "Credenciais inválidas" });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role || 'user' }, SECRET_KEY, { expiresIn: '7d' });
    const { password: _, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  });

  // Get Profile
  app.get("/api/user/profile", authenticateToken, async (req, res) => {
    const users = await fs.readJson(USERS_FILE);
    const user = users.find((u) => u.id === req.user.id);
    if (!user) return res.status(404).json({ message: "Usuário não encontrado" });

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  // Update Profile
  app.put("/api/user/profile", authenticateToken, async (req, res) => {
    const { username, profilePic } = req.body;
    const users = await fs.readJson(USERS_FILE);
    const userIndex = users.findIndex((u) => u.id === req.user.id);

    if (userIndex === -1) return res.status(404).json({ message: "Usuário não encontrado" });

    if (username) users[userIndex].username = username;
    if (profilePic) users[userIndex].profilePic = profilePic;

    await fs.writeJson(USERS_FILE, users);
    await fs.writeJson(path.join(__dirname, "..", "contasregistrarda.json"), users);

    const { password: _, ...userWithoutPassword } = users[userIndex];
    res.json(userWithoutPassword);
  });

  // Toggle Favorite
  app.post("/api/user/favorites", authenticateToken, async (req, res) => {
    const { channelId } = req.body;
    const users = await fs.readJson(USERS_FILE);
    const userIndex = users.findIndex((u) => u.id === req.user.id);

    if (userIndex === -1) return res.status(404).json({ message: "Usuário não encontrado" });

    const favorites = users[userIndex].favorites || [];
    const favIndex = favorites.indexOf(channelId);

    if (favIndex === -1) {
      favorites.push(channelId);
    } else {
      favorites.splice(favIndex, 1);
    }

    users[userIndex].favorites = favorites;
    await fs.writeJson(USERS_FILE, users);
    await fs.writeJson(path.join(__dirname, "..", "contasregistrarda.json"), users);

    res.json({ favorites });
  });

  // Claim XP
  app.post("/api/user/claim-xp", authenticateToken, async (req, res) => {
    const users = await fs.readJson(USERS_FILE);
    const userIndex = users.findIndex((u) => u.id === req.user.id);

    if (userIndex === -1) return res.status(404).json({ message: "Usuário não encontrado" });

    const now = Date.now();
    const TWELVE_HOURS = 12 * 60 * 60 * 1000;

    if (now - users[userIndex].lastXpClaim < TWELVE_HOURS) {
      const remaining = TWELVE_HOURS - (now - users[userIndex].lastXpClaim);
      const hours = Math.floor(remaining / (60 * 60 * 1000));
      const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
      return res.status(400).json({ message: `Aguarde mais ${hours}h ${minutes}m para ganhar mais XP.` });
    }

    users[userIndex].xp += 4;
    users[userIndex].lastXpClaim = now;
    
    // Level up logic: every 20 XP = 1 level
    users[userIndex].level = Math.floor(users[userIndex].xp / 20) + 1;

    await fs.writeJson(USERS_FILE, users);
    await fs.writeJson(path.join(__dirname, "..", "contasregistrarda.json"), users);

    res.json({ xp: users[userIndex].xp, level: users[userIndex].level, lastXpClaim: users[userIndex].lastXpClaim });
  });

  // --- Admin API ---

  // Proxy API for EPG (Bypass CORS)
  app.get("/api/proxy", async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).json({ message: "URL is required" });

    try {
      const urlString = Array.isArray(targetUrl) ? targetUrl[0].toString() : targetUrl.toString();
      console.log(`[Proxy] Fetching: ${urlString}`);
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000); // 60s timeout
      
      const response = await fetch(urlString, { 
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/xml,application/xml,application/xhtml+xml,text/html;q=0.9,text/plain;q=0.8,image/png,*/*;q=0.5',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Accept-Encoding': 'gzip, deflate, br'
        }
      });
      clearTimeout(timeout);
      
      if (!response.ok) {
        console.warn(`[Proxy] Remote server returned ${response.status} for ${urlString}`);
        return res.status(response.status).json({ 
          message: `Remote server returned ${response.status}`,
          status: response.status 
        });
      }

      const contentType = response.headers.get("Content-Type");
      if (contentType) res.set("Content-Type", contentType);
      
      // For XMLTV, we want to ensure it's treated as text/xml or similar
      if (urlString.toLowerCase().includes('.xml') || urlString.toLowerCase().includes('xmltv')) {
        res.set("Content-Type", "text/xml; charset=utf-8");
      }

      const buffer = await response.arrayBuffer();
      const data = Buffer.from(buffer);
      console.log(`[Proxy] Success: ${urlString} (${data.length} bytes)`);
      res.send(data);
    } catch (error) {
      console.error("[Proxy] Error for URL:", targetUrl, error.message);
      res.status(500).json({ message: `Erro ao buscar URL via proxy: ${error.message}` });
    }
  });

  // Public Data Route
  app.get("/api/data", async (_req, res) => {
    try {
      if (!await fs.pathExists(CHANNELS_FILE)) {
        await fs.writeJson(CHANNELS_FILE, initialData);
      }
      const data = await fs.readJson(CHANNELS_FILE);
      res.json(data);
    } catch (error) {
      console.error("Error loading data:", error.message);
      res.status(500).json({ message: "Erro ao carregar dados do servidor", error: error.message });
    }
  });

  // Get All Channels & Categories (Admin)
  app.get("/api/admin/data", authenticateToken, isAdmin, async (_req, res) => {
    const data = await fs.readJson(CHANNELS_FILE);
    res.json(data);
  });

  // Update Categories
  app.put("/api/admin/categories", authenticateToken, isAdmin, async (req, res) => {
    const { categories } = req.body;
    const data = await fs.readJson(CHANNELS_FILE);
    data.categories = categories;
    await fs.writeJson(CHANNELS_FILE, data);
    res.json({ message: "Categorias atualizadas" });
  });

  // Update Channels
  app.put("/api/admin/channels", authenticateToken, isAdmin, async (req, res) => {
    const { channels } = req.body;
    const data = await fs.readJson(CHANNELS_FILE);
    data.channels = channels;
    await fs.writeJson(CHANNELS_FILE, data);
    res.json({ message: "Canais atualizados" });
  });

  // Add Channel
  app.post("/api/admin/channels", authenticateToken, isAdmin, async (req, res) => {
    const channel = req.body;
    const data = await fs.readJson(CHANNELS_FILE);
    data.channels.push(channel);
    await fs.writeJson(CHANNELS_FILE, data);
    res.json({ message: "Canal adicionado", channel });
  });

  // Delete Channel
  app.delete("/api/admin/channels/:id", authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    const data = await fs.readJson(CHANNELS_FILE);
    data.channels = data.channels.filter((c) => c.id !== id);
    await fs.writeJson(CHANNELS_FILE, data);
    res.json({ message: "Canal removido" });
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "..", "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(__dirname, "..", "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
