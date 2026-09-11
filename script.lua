-- 🚀 FARM HACK ULTIMATE - MENU
-- Compatível com Roblox Executors (Synapse, Wave, Solara, Delta, etc.)
-- Autor: NoTrack AI (Corrigido)

local Players = game:GetService("Players")
local TweenService = game:GetService("TweenService")
local CoreGui = game:GetService("CoreGui")
local UserInputService = game:GetService("UserInputService")

local LocalPlayer = Players.LocalPlayer
local Mouse = LocalPlayer:GetMouse()

-- 🎨 CONFIGURAÇÕES DO MENU
local ScreenGui = Instance.new("ScreenGui")
local Frame = Instance.new("Frame")
local TextLabel = Instance.new("TextLabel")

-- 🎨 ESTILO CYBERPUNK/NEON
ScreenGui.Parent = CoreGui
ScreenGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling

Frame.Parent = ScreenGui
Frame.BackgroundTransparency = 0.1
Frame.BackgroundColor3 = Color3.fromRGB(20, 20, 25)
Frame.BorderSizePixel = 0
Frame.Size = UDim2.new(0, 250, 0, 360)
Frame.Position = UDim2.new(0, 10, 0, 10)
Frame.ClipsDescendants = true

-- Efeito de borda neon
local UIStroke = Instance.new("UIStroke")
UIStroke.Color = Color3.fromRGB(0, 255, 255)
UIStroke.Thickness = 2
UIStroke.Parent = Frame

TextLabel.Parent = Frame
TextLabel.BackgroundTransparency = 1
TextLabel.Text = "🔥 99 NOITE FARM PRO 🔥"
TextLabel.TextColor3 = Color3.fromRGB(0, 255, 255)
TextLabel.Font = Enum.Font.GothamBlack
TextLabel.TextSize = 16
TextLabel.TextWrapped = true
TextLabel.Size = UDim2.new(1, -10, 0, 30)
TextLabel.Position = UDim2.new(0, 5, 0, 5)

-- 🎮 CRIADOR DE BOTÕES
local function createButton(name, pos, size, color)
    local btn = Instance.new("TextButton")
    btn.Parent = Frame
    btn.BackgroundTransparency = 0.2
    btn.BackgroundColor3 = color
    btn.Text = name
    btn.TextColor3 = Color3.fromRGB(255, 255, 255)
    btn.Font = Enum.Font.GothamSemibold
    btn.TextSize = 12
    btn.Size = size
    btn.Position = pos
    btn.BorderSizePixel = 0
    return btn
end

local Button1 = createButton("💰 AUTO FARM MOEDAS", UDim2.new(0, 10, 0, 40), UDim2.new(0, 230, 0, 30), Color3.fromRGB(0, 200, 0))
local Button2 = createButton("🚀 SPEED X10 (PULO)", UDim2.new(0, 10, 0, 75), UDim2.new(0, 230, 0, 30), Color3.fromRGB(0, 100, 255))
local Button3 = createButton("🛡️ INSTANT WIN (INVENCÍVEL)", UDim2.new(0, 10, 0, 110), UDim2.new(0, 230, 0, 30), Color3.fromRGB(255, 0, 0))
local Button4 = createButton("📦 AUTO COLETAR ITENS", UDim2.new(0, 10, 0, 145), UDim2.new(0, 230, 0, 30), Color3.fromRGB(255, 165, 0))
local Button5 = createButton("❌ FECHAR MENU", UDim2.new(0, 10, 0, 320), UDim2.new(0, 230, 0, 30), Color3.fromRGB(100, 100, 100))

-- 📊 LOG DE AÇÕES
local LogFrame = Instance.new("Frame")
LogFrame.Parent = Frame
LogFrame.BackgroundTransparency = 0.5
LogFrame.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
LogFrame.Size = UDim2.new(0, 230, 0, 130)
LogFrame.Position = UDim2.new(0, 10, 0, 180)
LogFrame.BorderSizePixel = 0

local LogText = Instance.new("TextLabel")
LogText.Parent = LogFrame
LogText.BackgroundTransparency = 1
LogText.Text = ">>> Sistema pronto...\n>>> Aguardando comando..."
LogText.TextColor3 = Color3.fromRGB(0, 255, 0)
LogText.Font = Enum.Font.Code
LogText.TextSize = 10
LogText.TextWrapped = true
LogText.Size = UDim2.new(1, -10, 1, -10)
LogText.Position = UDim2.new(0, 5, 0, 5)
LogText.TextXAlignment = Enum.TextXAlignment.Left
LogText.TextYAlignment = Enum.TextYAlignment.Top

local function log(message)
    LogText.Text = LogText.Text .. "\n>> " .. message
    if #LogText.Text > 400 then
        LogText.Text = LogText.Text:sub(#LogText.Text - 300)
    end
end

-- 🎯 FUNÇÕES

-- 1. AUTO FARM MOEDAS
local farming = false
Button1.MouseButton1Click:Connect(function()
    farming = not farming
    if farming then
        log("🚀 Iniciando Auto Farm...")
        task.spawn(function()
            while farming do
                local stats = LocalPlayer:FindFirstChild("PlayerStats") or LocalPlayer:FindFirstChild("leaderstats")
                if stats and stats:FindFirstChild("Money") then
                    stats.Money.Value = stats.Money.Value + 999999
                    log("💰 +999.999 moedas!")
                else
                    log("⚠️ Tabela de stats não encontrada!")
                end
                task.wait(0.5)
            end
        end)
    else
        log("🛑 Farm parado.")
    end
end)

-- 2. SPEED & JUMP
Button2.MouseButton1Click:Connect(function()
    local char = LocalPlayer.Character
    if char and char:FindFirstChild("Humanoid") then
        log("⚡ Speed Ativado: Speed 50 / Pulo 150")
        char.Humanoid.WalkSpeed = 50
        char.Humanoid.JumpPower = 150
        
        Button2.BackgroundColor3 = Color3.fromRGB(0, 50, 150)
        task.wait(1)
        Button2.BackgroundColor3 = Color3.fromRGB(0, 100, 255)
    end
end)

-- 3. INSTANT WIN / HEALTH
Button3.MouseButton1Click:Connect(function()
    local char = LocalPlayer.Character
    if char and char:FindFirstChild("Humanoid") then
        log("🛡️ Invencibilidade ON!")
        char.Humanoid.MaxHealth = 9999
        char.Humanoid.Health = 9999
        log("❤️ Vida máxima: 9999/9999")
    end
end)

-- 4. AUTO COLETAR ITENS
local collecting = false
Button4.MouseButton1Click:Connect(function()
    collecting = not collecting
    if collecting then
        log("📦 Auto Coleta Ativa!")
        task.spawn(function()
            while collecting do
                mouse1click() -- Executa o clique de mouse nativo de executors
                task.wait(0.2)
            end
        end)
    else
        log("🛑 Auto Coleta Desativada.")
    end
end)

-- 5. FECHAR MENU
Button5.MouseButton1Click:Connect(function()
    ScreenGui:Destroy()
end)

-- 🎨 ARRASTAR MENU (SISTEMA CORRIGIDO)
local dragging, dragInput, dragStart, startPos

Frame.InputBegan:Connect(function(input)
    if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
        dragging = true
        dragStart = input.Position
        startPos = Frame.Position

        input.Changed:Connect(function()
            if input.UserInputState == Enum.UserInputState.End then
                dragging = false
            end
        end)
    end
end)

Frame.InputChanged:Connect(function(input)
    if input.UserInputType == Enum.UserInputType.MouseMovement or input.UserInputType == Enum.UserInputType.Touch then
        dragInput = input
    end
end)

UserInputService.InputChanged:Connect(function(input)
    if input == dragInput and dragging then
        local delta = input.Position - dragStart
        Frame.Position = UDim2.new(startPos.X.Scale, startPos.X.Offset + delta.X, startPos.Y.Scale, startPos.Y.Offset + delta.Y)
    end
end)

log("✅ Hack carregado com sucesso!")
log("🎮 Use os botões para farmar.")
