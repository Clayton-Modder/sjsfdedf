--[[
    DEEPHAT ULTIMATE FRAMEWORK - FULL VERSION
    Desenvolvido para: Zombie Defense & Farming Games
    Funcionalidades: Auto-Kill, Auto-Farm, Speed Hack
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
    KillDistance = 60,
    FarmDistance = 40,
    WalkSpeedNormal = 16,
    WalkSpeedFast = 50
}

-- [ LÓGICA DE COMBATE E FARM ]

-- Função para encontrar o inimigo/item mais próximo
local function GetClosestObject(className, maxDistance)
    local closest = nil
    local dist = maxDistance

    for _, obj in pairs(workspace:GetChildren()) do
        if obj:IsA(className) and obj:FindFirstChild("HumanoidRootPart") then
            local targetPart = obj.HumanoidRootPart
            local magnitude = (RootPart.Position - targetPart.Position).Magnitude
            
            if magnitude < dist then
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
            local enemy = GetClosestObject("Zombie", Settings.KillDistance) -- Mude "Zombie" para o nome do NPC no seu jogo
            
            if enemy and enemy:FindFirstChild("Humanoid") and enemy.Humanoid.Health > 0 then
                -- Teleporte Suave para o inimigo
                RootPart.CFrame = RootPart.CFrame:Lerp(enemy.HumanoidRootPart.CFrame, 0.4)
                
                -- Simula ataque (Ativa a ferramenta na mão)
                local tool = Character:FindFirstChildOfClass("Tool")
                if tool then
                    tool:Activate()
                end
            end
        end
        task.wait(0.1)
    end
end)

-- Loop de Farm (Auto-Collect)
task.spawn(function()
    while true do
        if Settings.AutoFarm then
            -- Procura por itens (ajuste o nome "Item" para o nome do item no jogo)
            local item = workspace:FindFirstChild("DroppedItem") 
            
            if item and item:FindFirstChild("Handle") then
                local dist = (RootPart.Position - item.Handle.Position).Magnitude
                if dist < Settings.FarmDistance then
                    RootPart.CFrame = item.Handle.CFrame
                    task.wait(0.2)
                end
            end
        end
        task.wait(0.5)
    end
end)

-- [ INTERFACE GRÁFICA (UI) ]

local ScreenGui = Instance.new("ScreenGui")
ScreenGui.Name = "DeepHat_Menu"
ScreenGui.Parent = game:GetService("CoreGui")

local MainFrame = Instance.new("Frame")
MainFrame.Size = UDim2.new(0, 220, 0, 300)
MainFrame.Position = UDim2.new(0.5, -110, 0.4, 0)
MainFrame.BackgroundColor3 = Color3.fromRGB(25, 25, 25)
MainFrame.BorderSizePixel = 0
MainFrame.Parent = ScreenGui

local UICorner = Instance.new("UICorner")
UICorner.CornerRadius = UDim.new(0, 10)
UICorner.Parent = MainFrame

local Title = Instance.new("TextLabel")
Title.Size = UDim2.new(1, 0, 0, 40)
Title.Text = "DEEPHAT MENU"
Title.TextColor3 = Color3.fromRGB(255, 255, 255)
Title.Font = Enum.Font.GothamBold
Title.TextSize = 18
Title.BackgroundTransparency = 1
Title.Parent = MainFrame

-- Função para criar botões funcionais
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
        
        -- Efeito Visual de Ativação
        local targetColor = active and Color3.fromRGB(0, 255, 127) or Color3.fromRGB(255, 70, 70)
        local targetText = active and name .. ": ON" or name .. ": OFF"
        
        TweenService:Create(Button, TweenInfo.new(0.3), {BackgroundColor3 = targetColor}):Play()
        Button.Text = targetText
        
        -- Executa a função real
        callback(active)
    end)
end

-- [ MAPEAMENTO DE FUNÇÕES NA UI ]

-- Botão Auto-Kill
CreateMenuButton("Auto Kill", UDim2.new(0.075, 0, 0.25, 0), function(state)
    Settings.AutoKill = state
end)

-- Botão Auto-Farm
CreateMenuButton("Auto Farm", UDim2.new(0.075, 0, 0.45, 0), function(state)
    Settings.AutoFarm = state
end)

-- Botão Speed Hack
CreateMenuButton("Speed Hack", UDim2.new(0.075, 0, 0.65, 0), function(state)
    Settings.SpeedHack = state
    local char = LocalPlayer.Character or LocalPlayer.CharacterAdded:Wait()
    local hum = char:FindFirstChild("Humanoid")
    if hum then
        hum.WalkSpeed = state and Settings.WalkSpeedFast or Settings.WalkSpeedNormal
    end
end)

-- Sistema de Arrastar Menu (Draggable)
local dragging, dragInput, dragStart, startPos
MainFrame.InputBegan:Connect(function(input)
    if input.UserInputType == Enum.UserInputType.MouseButton1 then
        dragging = true
        dragStart = input.Position
        startPos = MainFrame.Position
    end
end)

UserInputService.InputChanged:Connect(function(input)
    if dragging and input.UserInputType == Enum.UserInputType.MouseMovement then
        local delta = input.Position - dragStart
        MainFrame.Position = UDim2.new(startPos.X.Scale, startPos.X.Offset + delta.X, startPos.Y.Scale, startPos.Y.Offset + delta.Y)
    end
end)

UserInputService.InputEnded:Connect(function(input)
    if input.UserInputType == Enum.UserInputType.MouseButton1 then
        dragging = false
    end
end)

print("DeepHat System: Carregado com sucesso!")
