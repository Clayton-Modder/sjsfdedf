-- AUTO FARM UNIVERSAL PARA ROBLOX
-- Compatível com: Synapse X, KRNL, Fluxus, Codex, etc.

if not game:IsLoaded() then game.Loaded:Wait() end

-- Serviços
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local TweenService = game:GetService("TweenService")
local Workspace = game:GetService("Workspace")
local VirtualUser = game:GetService("VirtualUser")
local CoreGui = game:GetService("CoreGui")

local player = Players.LocalPlayer
local mouse = player:GetMouse()

-- Configurações
local Config = {
    AutoFarm = false,
    AutoClick = false,
    AutoCollect = true,
    Speed = 100, -- Velocidade do tween
    Interval = 0.1,
    Radius = 1000, -- Raio de busca
    HeightOffset = 3, -- Altura acima do item
    AntiAFK = true,
    AutoRejoin = true
}

-- Criar GUI
local ScreenGui = Instance.new("ScreenGui")
ScreenGui.Name = "UniversalFarm"
ScreenGui.Parent = CoreGui

local MainFrame = Instance.new("Frame")
MainFrame.Size = UDim2.new(0, 250, 0, 350)
MainFrame.Position = UDim2.new(0, 10, 0.5, -175)
MainFrame.BackgroundColor3 = Color3.fromRGB(30, 30, 30)
MainFrame.BorderSizePixel = 0
MainFrame.Active = true
MainFrame.Draggable = true
MainFrame.Parent = ScreenGui

-- Cantos arredondados
local Corner = Instance.new("UICorner")
Corner.CornerRadius = UDim.new(0, 8)
Corner.Parent = MainFrame

-- Título
local Title = Instance.new("TextLabel")
Title.Size = UDim2.new(1, 0, 0, 40)
Title.Text = "🔥 UNIVERSAL FARM 🔥"
Title.TextColor3 = Color3.fromRGB(255, 215, 0)
Title.BackgroundColor3 = Color3.fromRGB(50, 50, 50)
Title.TextSize = 18
Title.Font = Enum.Font.GothamBold
Title.Parent = MainFrame

local TitleCorner = Instance.new("UICorner")
TitleCorner.CornerRadius = UDim.new(0, 8)
TitleCorner.Parent = Title

-- Função para criar botões
local function CreateButton(text, posY, color, callback)
    local btn = Instance.new("TextButton")
    btn.Size = UDim2.new(0.9, 0, 0, 40)
    btn.Position = UDim2.new(0.05, 0, 0, posY)
    btn.Text = text
    btn.TextColor3 = Color3.new(1, 1, 1)
    btn.BackgroundColor3 = color
    btn.TextSize = 14
    btn.Font = Enum.Font.GothamBold
    btn.Parent = MainFrame
    
    local btnCorner = Instance.new("UICorner")
    btnCorner.CornerRadius = UDim.new(0, 6)
    btnCorner.Parent = btn
    
    btn.MouseButton1Click:Connect(callback)
    return btn
end

-- Status label
local Status = Instance.new("TextLabel")
Status.Size = UDim2.new(0.9, 0, 0, 30)
Status.Position = UDim2.new(0.05, 0, 0, 200)
Status.Text = "Status: ❌ OFF"
Status.TextColor3 = Color3.fromRGB(255, 100, 100)
Status.BackgroundTransparency = 1
Status.TextSize = 14
Status.Font = Enum.Font.Gotham
Status.Parent = MainFrame

-- Info
local Info = Instance.new("TextLabel")
Info.Size = UDim2.new(0.9, 0, 0, 60)
Info.Position = UDim2.new(0.05, 0, 0, 240)
Info.Text = "F - Liga/Desliga Farm\nT - Teleporte para Mouse\nH - Esconder/Mostrar GUI"
Info.TextColor3 = Color3.fromRGB(200, 200, 200)
Info.BackgroundTransparency = 1
Info.TextSize = 12
Info.Font = Enum.Font.Gotham
Info.TextWrapped = true
Info.Parent = MainFrame

-- Variáveis de controle
local farming = false
local tweening = false

-- Anti AFK
if Config.AntiAFK then
    local vu = game:GetService("VirtualUser")
    player.Idled:Connect(function()
        vu:Button2Down(Vector2.new(0,0), Workspace.CurrentCamera.CFrame)
        wait(1)
        vu:Button2Up(Vector2.new(0,0), Workspace.CurrentCamera.CFrame)
    end)
end

-- Função de notificação
local function Notify(text)
    game.StarterGui:SetCore("SendNotification", {
        Title = "Universal Farm",
        Text = text,
        Duration = 3
    })
end

-- Encontrar itens coletáveis
local function FindItems()
    local items = {}
    local character = player.Character
    if not character then return items end
    
    local root = character:FindFirstChild("HumanoidRootPart")
    if not root then return items end
    
    for _, obj in pairs(Workspace:GetDescendants()) do
        if obj:IsA("BasePart") or obj:IsA("MeshPart") or obj:IsA("Part") then
            local name = string.lower(obj.Name)
            
            -- Lista de nomes comuns de itens coletáveis
            local keywords = {
                "coin", "money", "cash", "gem", "diamond", "gold", "drop",
                "collectible", "item", "loot", "reward", "present", "chest",
                "orb", "bubble", "fruit", "block", "ore", "candy", "token",
                "star", "trophy", "bag", "box", "egg", "pet", "xp", "exp"
            }
            
            for _, keyword in pairs(keywords) do
                if string.find(name, keyword) then
                    local dist = (obj.Position - root.Position).Magnitude
                    if dist <= Config.Radius then
                        table.insert(items, {Object = obj, Distance = dist})
                    end
                    break
                end
            end
            
            -- Verificar se tem ClickDetector ou TouchInterest
            if obj:FindFirstChildOfClass("ClickDetector") or 
               obj:FindFirstChildOfClass("TouchInterest") or
               obj:FindFirstChildOfClass("ProximityPrompt") then
                local dist = (obj.Position - root.Position).Magnitude
                if dist <= Config.Radius and dist > 5 then
                    table.insert(items, {Object = obj, Distance = dist})
                end
            end
        end
    end
    
    -- Ordenar por distância
    table.sort(items, function(a, b) return a.Distance < b.Distance end)
    return items
end

-- Teleportar suave
local function TweenTo(position)
    local character = player.Character
    if not character then return end
    
    local root = character:FindFirstChild("HumanoidRootPart")
    if not root then return end
    
    tweening = true
    local distance = (position - root.Position).Magnitude
    local time = distance / Config.Speed
    
    local tween = TweenService:Create(root, TweenInfo.new(time, Enum.EasingStyle.Linear), {
        CFrame = CFrame.new(position + Vector3.new(0, Config.HeightOffset, 0))
    })
    
    tween:Play()
    tween.Completed:Wait()
    tweening = false
end

-- Coletar item
local function CollectItem(item)
    if not item then return end
    
    local clickDetector = item:FindFirstChildOfClass("ClickDetector")
    local touchInterest = item:FindFirstChildOfClass("TouchInterest")
    local prompt = item:FindFirstChildOfClass("ProximityPrompt")
    
    if clickDetector then
        fireclickdetector(clickDetector)
    elseif touchInterest then
        firetouchinterest(item, player.Character.HumanoidRootPart, 0)
        firetouchinterest(item, player.Character.HumanoidRootPart, 1)
    elseif prompt then
        fireproximityprompt(prompt)
    end
end

-- Auto Click
local function AutoClick()
    while Config.AutoClick and farming do
        VirtualUser:Button1Down(Vector2.new(0,0))
        wait(0.05)
        VirtualUser:Button1Up(Vector2.new(0,0))
        wait(Config.Interval)
    end
end

-- Farm Loop
local function FarmLoop()
    while farming do
        local character = player.Character
        if not character then 
            player.CharacterAdded:Wait()
            wait(1)
            continue
        end
        
        if tweening then 
            wait(0.1)
            continue 
        end
        
        if Config.AutoCollect then
            local items = FindItems()
            
            for _, itemData in pairs(items) do
                if not farming then break end
                
                local item = itemData.Object
                if item and item.Parent then
                    -- Mover até o item
                    TweenTo(item.Position)
                    
                    -- Tentar coletar
                    CollectItem(item)
                    
                    -- Auto click ao chegar
                    if Config.AutoClick then
                        for i = 1, 3 do
                            VirtualUser:Button1Down(Vector2.new(0,0))
                            wait(0.05)
                            VirtualUser:Button1Up(Vector2.new(0,0))
                        end
                    end
                    
                    wait(Config.Interval)
                end
            end
        end
        
        wait(Config.Interval)
    end
end

-- Botões
local FarmBtn = CreateButton("▶ INICIAR FARM", 50, Color3.fromRGB(0, 150, 0), function()
    if not farming then
        farming = true
        Config.AutoFarm = true
        Status.Text = "Status: ✅ ON"
        Status.TextColor3 = Color3.fromRGB(100, 255, 100)
        Notify("Auto Farm Iniciado!")
        spawn(FarmLoop)
        spawn(AutoClick)
    end
end)

local StopBtn = CreateButton("⏹ PARAR FARM", 95, Color3.fromRGB(150, 0, 0), function()
    farming = false
    Config.AutoFarm = false
    Status.Text = "Status: ❌ OFF"
    Status.TextColor3 = Color3.fromRGB(255, 100, 100)
    Notify("Auto Farm Parado!")
end)

local TPToggle = CreateButton("🖱️ TP PARA MOUSE (T)", 140, Color3.fromRGB(0, 100, 150), function()
    local char = player.Character
    if char then
        local root = char:FindFirstChild("HumanoidRootPart")
        if root then
            root.CFrame = CFrame.new(mouse.Hit.Position + Vector3.new(0, 5, 0))
        end
    end
end)

-- Teclas de atalho
local guiVisible = true
mouse.KeyDown:Connect(function(key)
    key = string.lower(key)
    
    if key == "f" then
        if farming then
            farming = false
            Config.AutoFarm = false
            Status.Text = "Status: ❌ OFF"
            Status.TextColor3 = Color3.fromRGB(255, 100, 100)
            Notify("Auto Farm Parado!")
        else
            farming = true
            Config.AutoFarm = true
            Status.Text = "Status: ✅ ON"
            Status.TextColor3 = Color3.fromRGB(100, 255, 100)
            Notify("Auto Farm Iniciado!")
            spawn(FarmLoop)
            spawn(AutoClick)
        end
        
    elseif key == "t" then
        local char = player.Character
        if char then
            local root = char:FindFirstChild("HumanoidRootPart")
            if root then
                root.CFrame = CFrame.new(mouse.Hit.Position + Vector3.new(0, 5, 0))
            end
        end
        
    elseif key == "h" then
        guiVisible = not guiVisible
        MainFrame.Visible = guiVisible
    end
end)

-- Auto rejoin se kickado
if Config.AutoRejoin then
    local function Rejoin()
        local ts = game:GetService("TeleportService")
        local p = game:GetService("Players").LocalPlayer
        ts:Teleport(game.PlaceId, p)
    end
    
    player.OnTeleport:Connect(function(state)
        if state == Enum.TeleportState.Failed then
            wait(5)
            Rejoin()
        end
    end)
end

-- Mensagem inicial
Notify("Universal Farm Carregado!")
print([[
========================================
🔥 UNIVERSAL FARM v2.0 CARREGADO 🔥
========================================
Comandos:
  F - Liga/Desliga Farm
  T - Teleporte para posição do mouse
  H - Esconder/Mostrar GUI

Features:
✅ Auto-detecta itens/moedas
✅ Teleporte suave (Tween)
✅ Anti-AFK
✅ Auto Click
✅ Auto Rejoin
========================================
]])
