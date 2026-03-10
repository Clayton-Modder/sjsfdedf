import express from "express";
import cors from "cors";
import fs from "fs-extra";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import path from "path";

const app = express();

app.use(cors());
app.use(express.json());

const USERS_FILE = "./contas.json";
const CHANNELS_FILE = "./db.json";

const SECRET_KEY = "megatv-secret-key";

// garantir arquivos
async function ensureFiles() {
  if (!await fs.pathExists(USERS_FILE)) {
    await fs.writeJson(USERS_FILE, []);
  }

  if (!await fs.pathExists(CHANNELS_FILE)) {
    await fs.writeJson(CHANNELS_FILE, {
      categories: [],
      channels: []
    });
  }
}

ensureFiles();

// middleware auth
function authenticateToken(req:any,res:any,next:any){
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if(!token) return res.sendStatus(401);

  jwt.verify(token,SECRET_KEY,(err,user)=>{
    if(err) return res.sendStatus(403);
    req.user=user;
    next();
  });
}

// login
app.post("/api/auth/login",async(req,res)=>{

  const {email,password}=req.body;

  const users=await fs.readJson(USERS_FILE);

  const user=users.find((u:any)=>u.email===email);

  if(!user){
    return res.status(400).json({message:"Usuário não encontrado"});
  }

  const valid=await bcrypt.compare(password,user.password);

  if(!valid){
    return res.status(400).json({message:"Senha inválida"});
  }

  const token=jwt.sign(
    {id:user.id,email:user.email},
    SECRET_KEY,
    {expiresIn:"7d"}
  );

  res.json({token,user});
});

// registro
app.post("/api/auth/register",async(req,res)=>{

  const {username,email,password}=req.body;

  const users=await fs.readJson(USERS_FILE);

  if(users.find((u:any)=>u.email===email)){
    return res.status(400).json({message:"Email já cadastrado"});
  }

  const hashed=await bcrypt.hash(password,10);

  const newUser={
    id:Date.now().toString(),
    username,
    email,
    password:hashed,
    xp:0,
    level:1
  };

  users.push(newUser);

  await fs.writeJson(USERS_FILE,users);

  res.json({message:"Usuário criado"});
});

// perfil
app.get("/api/user/profile",authenticateToken,async(req:any,res)=>{

  const users=await fs.readJson(USERS_FILE);

  const user=users.find((u:any)=>u.id===req.user.id);

  res.json(user);

});

// listar canais
app.get("/api/data",async(req,res)=>{

  const data=await fs.readJson(CHANNELS_FILE);

  res.json(data);

});

// proxy epg
app.get("/api/proxy",async(req,res)=>{

  const {url}=req.query;

  if(!url){
    return res.status(400).json({message:"URL requerida"});
  }

  try{

    const response=await fetch(url as string);

    const data=await response.text();

    res.send(data);

  }catch(err:any){

    res.status(500).json({
      message:"Erro proxy",
      error:err.message
    });

  }

});

export default app;
