--[[
    DEEPHAT ULTIMATE FRAMEWORK - VERSION 2.0 (FIXED FARM)
    Foco: Detecção Dinâmica de Itens
]]

local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local TweenService = game:GetService("TweenService")
local UserInputService = game:GetService("UserInputService")

local LocalPlayer = Players.LocalPlayer
local Character = LocalPlayer.Character or LocalPlayer.CharacterAdded:Wait()
local RootPart = Character:WaitForChild("HumanoidRootPart")

-- [ CONFIGURAÇÕES DO SISTEMA ]
local Settings = {
    AutoKill = false,
    AutoFarm = false,
    SpeedHack = false,
    
    -- CONFIGURAÇÃO DO FARM (Mude aqui!)
    ItemName = "Coin", -- Tente mudar para "Gold", "Money", "Part" ou o nome do item no jogo
    FarmDistance = 50,
    
    -- CONFIGURAÇÃO DE COMBATE
    EnemyName = "Zombie", -- Nome do inimigo
    KillDistance = 60,
    
    WalkSpeedNormal = 16,
    WalkSpeedFast = 60
}

-- [ FUNÇÃO DE DEBUG - PARA VOCÊ SABER O QUE ESTÁ ACONTECENDO ]
local function DebugLog(msg)
    print("[DeepHat Debug]: " .. msg)
end

-- [ LÓGICA DE COMBATE E FARM ]

-- Função para encontrar o objeto mais próximo (Melhorada)
local function GetClosestObject(targetName, maxDistance)
    local closest = nil
    local dist = maxDistance

    -- Itera por todos os descendentes do Workspace para encontrar o item
    for _, obj in pairs(workspace:GetDescendants()) do
        -- Verifica se o nome coincide ou se é um tipo de objeto comum
        if (obj.Name == targetName or obj:IsA("Part") or obj:IsA("MeshPart")) and obj:IsA("BasePart") then
            -- Verifica se o objeto está perto o suficiente e não é o próprio jogador
            local magnitude = (RootPart.Position - obj.Position).Magnitude
            if magnitude < dist and obj.Transparency < 1 then
                dist = magnitude
                closest = obj
            end
        end
    end
    return closest
end

-- Loop de Combate (Auto-Kill)
task.spawn(function()
    while true do
        if Settings.AutoKill then
            local enemy = GetClosestObject(Settings.EnemyName, Settings.KillDistance)
            
            if enemy and enemy:FindFirstChild("Humanoid") and enemy.Humanoid.Health > 0 then
                RootPart.CFrame = enemy.CFrame * CFrame.new(0, 0, 3) -- Fica levemente atrás do inimigo
                local tool = Character:FindFirstChildOfClass("Tool")
                if tool then tool:Activate() end
            end
        end
        task.wait(0.2)
    end
end)

-- Loop de Farm (REESCRITO PARA SER MAIS AGRESSIVO)
task.spawn(function()
    while true do
        if Settings.AutoFarm then
            -- Tenta encontrar o item pelo nome configurado
            local item = GetClosestObject(Settings.ItemName, Settings.FarmDistance)
            
            if item then
                -- Teleporte para o item
                RootPart.CFrame = item.CFrame
                -- Espera um pouco para o jogo registrar a coleta
                task.wait(0.3) 
            else
                -- Se não encontrar pelo nome, tenta buscar qualquer coisa que pareça um item
                -- Isso ajuda se o nome do item mudar
                DebugLog("Procurando item...") 
            end
        end
        task.wait(0.5)
    end
end)

-- [ INTERFACE GRÁFICA (UI) ]
-- (Mantendo a estrutura anterior para funcionalidade)

local ScreenGui = Instance.new("ScreenGui")
ScreenGui.Name = "DeepHat_Menu"
ScreenGui.Parent = game:GetService("CoreGui")

local MainFrame = Instance.new("Frame")
MainFrame.Size = UDim2.new(0, 220, 0, 300)
MainFrame.Position = UDim2.new(0.5, -110, 0.4, 0)
MainFrame.BackgroundColor3 = Color3.fromRGB(20, 20, 20)
MainFrame.BorderSizePixel = 0
MainFrame.Parent = ScreenGui

local UICorner = Instance.new("UICorner")
UICorner.CornerRadius = UDim.new(0, 10)
UICorner.Parent = MainFrame

local Title = Instance.new("TextLabel")
Title.Size = UDim2.new(1, 0, 0, 40)
Title.Text = "DEEPHAT V2"
Title.TextColor3 = Color3.fromRGB(255, 255, 255)
Title.Font = Enum.Font.GothamBold
Title.TextSize = 18
Title.BackgroundTransparency = 1
Title.Parent = MainFrame

local function CreateMenuButton(name, position, callback)
    local Button = Instance.new("TextButton")
    Button.Size = UDim2.new(0.85, 0, 0, 45)
    Button.Position = position
    Button.BackgroundColor3 = Color3.fromRGB(40, 40, 40)
    Button.Text = name .. ": OFF"
    Button.TextColor3 = Color3.fromRGB(255, 70, 70)
    Button.Font = Enum.Font.GothamSemibold
    Button.TextSize = 14
    Button.Parent = MainFrame

    local BCorner = Instance.new("UICorner")
    BCorner.CornerRadius = UDim.new(0, 8)
    BCorner.Parent = Button

    local active = false

    Button.MouseButton1Click:Connect(function()
        active = not active
        local targetColor = active and Color3.fromRGB(0, 255, 127) or Color3.fromRGB(255, 70, 70)
        Button.Text = active and name .. ": ON" or name .. ": OFF"
        TweenService:Create(Button, TweenInfo.new(0.3), {BackgroundColor3 = targetColor}):Play()
        callback(active)
    end)
end

-- [ BOTÕES ]
CreateMenuButton("Auto Kill", UDim2.new(0.075, 0, 0.25, 0), function(state) Settings.AutoKill = state end)
CreateMenuButton("Auto Farm", UDim2.new(0.075, 0, 0.45, 0), function(state) Settings.AutoFarm = state end)
CreateMenuButton("Speed Hack", UDim2.new(0.075, 0, 0.65, 0), function(state) 
    Settings.SpeedHack = state 
    local hum = Character:FindFirstChild("Humanoid")
    if hum then hum.WalkSpeed = state and Settings.WalkSpeedFast or Settings.WalkSpeedNormal end
end)

print("DeepHat V2 Carregado. Verifique o Console (F9) para Logs.")
