-- 🚀 SENIOR ENGINE v3.0 - UNIVERSAL FARM & SURVIVAL
-- Compatível com: Delta, Solara, Wave, Codex, Arceus X, Hydrogen

local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local TweenService = game:GetService("TweenService")
local UserInputService = game:GetService("UserInputService")

local LocalPlayer = Players.LocalPlayer
local CoreGui = game:GetService("CoreGui")

-- Destrói instâncias antigas para evitar bugs de duplicado
if CoreGui:FindFirstChild("SeniorEngineV3") then
    CoreGui.SeniorEngineV3:Destroy()
end

-- 📌 ESTADO GLOBAL DAS FUNÇÕES (FLAGS)
local Flags = {
    AutoCollect = false,  -- Farm Moedas / Itens
    CollectFood = false,   -- Farm Comida / Kits
    KillAura = false,      -- Elimina NPCs
    SpeedHack = false,     -- Velocidade
    InfJump = false,       -- Pulo Infinito
    ESP = false            -- Wallhack
}

-- 🎨 CRIAÇÃO DA INTERFACE VISUAL
local ScreenGui = Instance.new("ScreenGui")
ScreenGui.Name = "SeniorEngineV3"
ScreenGui.Parent = CoreGui
ScreenGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling

local MainFrame = Instance.new("Frame")
MainFrame.Name = "MainFrame"
MainFrame.Parent = ScreenGui
MainFrame.BackgroundColor3 = Color3.fromRGB(15, 15, 20)
MainFrame.Position = UDim2.new(0.3, 0, 0.2, 0)
MainFrame.Size = UDim2.new(0, 340, 0, 420)
MainFrame.BorderSizePixel = 0
MainFrame.ClipsDescendants = true

local UICorner = Instance.new("UICorner")
UICorner.CornerRadius = UDim.new(0, 8)
UICorner.Parent = MainFrame

local UIStroke = Instance.new("UIStroke")
UIStroke.Color = Color3.fromRGB(0, 255, 150)
UIStroke.Thickness = 1.5
UIStroke.Parent = MainFrame

-- Top Bar (Barra Superior)
local TopBar = Instance.new("Frame")
TopBar.Parent = MainFrame
TopBar.BackgroundColor3 = Color3.fromRGB(22, 22, 30)
TopBar.Size = UDim2.new(1, 0, 0, 40)
TopBar.BorderSizePixel = 0

local Title = Instance.new("TextLabel")
Title.Parent = TopBar
Title.BackgroundTransparency = 1
Title.Position = UDim2.new(0, 12, 0, 0)
Title.Size = UDim2.new(0.7, 0, 1, 0)
Title.Font = Enum.Font.GothamBold
Title.Text = "⚡ SENIOR ENGINE v3.0"
Title.TextColor3 = Color3.fromRGB(0, 255, 150)
Title.TextSize = 14
Title.TextXAlignment = Enum.TextXAlignment.Left

-- Botão de Fechar Menu
local CloseBtn = Instance.new("TextButton")
CloseBtn.Parent = TopBar
CloseBtn.BackgroundTransparency = 1
CloseBtn.Position = UDim2.new(1, -35, 0, 5)
CloseBtn.Size = UDim2.new(0, 30, 0, 30)
CloseBtn.Font = Enum.Font.GothamBold
CloseBtn.Text = "❌"
CloseBtn.TextColor3 = Color3.fromRGB(255, 60, 60)
CloseBtn.TextSize = 14

CloseBtn.MouseButton1Click:Connect(function()
    ScreenGui:Destroy()
end)

-- Conteúdo Principal (Scroll)
local Scroll = Instance.new("ScrollingFrame")
Scroll.Parent = MainFrame
Scroll.BackgroundTransparency = 1
Scroll.Position = UDim2.new(0, 10, 0, 45)
Scroll.Size = UDim2.new(1, -20, 1, -50)
Scroll.ScrollBarThickness = 3
Scroll.CanvasSize = UDim2.new(0, 0, 0, 430)

local UIListLayout = Instance.new("UIListLayout")
UIListLayout.Parent = Scroll
UIListLayout.SortOrder = Enum.SortOrder.LayoutOrder
UIListLayout.Padding = UDim.new(0, 6)

-- 🔘 GERADOR DE TOGGLE SWITCH (ON / OFF CORRIGIDO)
local function CreateToggle(text, flagKey)
    local Frame = Instance.new("Frame")
    Frame.Parent = Scroll
    Frame.BackgroundColor3 = Color3.fromRGB(25, 25, 35)
    Frame.Size = UDim2.new(1, -5, 0, 40)

    local Corner = Instance.new("UICorner")
    Corner.CornerRadius = UDim.new(0, 6)
    Corner.Parent = Frame

    local Label = Instance.new("TextLabel")
    Label.Parent = Frame
    Label.BackgroundTransparency = 1
    Label.Position = UDim2.new(0, 10, 0, 0)
    Label.Size = UDim2.new(0.65, 0, 1, 0)
    Label.Font = Enum.Font.GothamSemibold
    Label.Text = text
    Label.TextColor3 = Color3.fromRGB(220, 220, 220)
    Label.TextSize = 12
    Label.TextXAlignment = Enum.TextXAlignment.Left

    local Switch = Instance.new("TextButton")
    Switch.Parent = Frame
    Switch.Text = ""
    Switch.AutoButtonColor = false
    Switch.Position = UDim2.new(1, -45, 0.5, -10)
    Switch.Size = UDim2.new(0, 36, 0, 20)
    Switch.BackgroundColor3 = Flags[flagKey] and Color3.fromRGB(0, 255, 150) or Color3.fromRGB(60, 60, 75)

    local SwitchCorner = Instance.new("UICorner")
    SwitchCorner.CornerRadius = UDim.new(1, 0)
    SwitchCorner.Parent = Switch

    local Circle = Instance.new("Frame")
    Circle.Parent = Switch
    Circle.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
    Circle.Size = UDim2.new(0, 14, 0, 14)
    Circle.Position = Flags[flagKey] and UDim2.new(1, -17, 0.5, -7) or UDim2.new(0, 3, 0.5, -7)

    local CircleCorner = Instance.new("UICorner")
    CircleCorner.CornerRadius = UDim.new(1, 0)
    CircleCorner.Parent = Circle

    Switch.MouseButton1Click:Connect(function()
        Flags[flagKey] = not Flags[flagKey]
        
        local targetColor = Flags[flagKey] and Color3.fromRGB(0, 255, 150) or Color3.fromRGB(60, 60, 75)
        local targetPos = Flags[flagKey] and UDim2.new(1, -17, 0.5, -7) or UDim2.new(0, 3, 0.5, -7)

        TweenService:Create(Switch, TweenInfo.new(0.15), {BackgroundColor3 = targetColor}):Play()
        TweenService:Create(Circle, TweenInfo.new(0.15), {Position = targetPos}):Play()
    end)
end

-- 🔘 GERADOR DE BOTÃO DE AÇÃO ÚNICA (TELEPORTE)
local function CreateButton(text, callback)
    local Btn = Instance.new("TextButton")
    Btn.Parent = Scroll
    Btn.BackgroundColor3 = Color3.fromRGB(35, 35, 50)
    Btn.Size = UDim2.new(1, -5, 0, 35)
    Btn.Font = Enum.Font.GothamBold
    Btn.Text = text
    Btn.TextColor3 = Color3.fromRGB(0, 255, 150)
    Btn.TextSize = 12

    local Corner = Instance.new("UICorner")
    Corner.CornerRadius = UDim.new(0, 6)
    Corner.Parent = Btn

    Btn.MouseButton1Click:Connect(callback)
end

-- 📋 LISTA DE MÓDULOS NO MENU
CreateToggle("💰 Auto Farm (Moedas / Cash / Botões)", "AutoCollect")
CreateToggle("🍕 Auto Coletar (Comida / Medkits / Drop)", "CollectFood")
CreateToggle("⚔️ Auto Kill Aura (Zumbis & NPCs)", "KillAura")
CreateToggle("⚡ Speed Hack (Velocidade 50x)", "SpeedHack")
CreateToggle("🦘 Pulo Infinito (Air Jump)", "InfJump")
CreateToggle("👁️ ESP Box (Wallhack de Inimigos)", "ESP")

CreateButton("🌀 Teleportar para Ponto Seguro (Safezone)", function()
    pcall(function()
        local hrp = LocalPlayer.Character and LocalPlayer.Character:FindFirstChild("HumanoidRootPart")
        if hrp then
            hrp.CFrame = hrp.CFrame + Vector3.new(0, 50, 0)
        end
    end)
end)

-- ⚙️ SISTEMA INTERNO DE EXECUÇÃO DAS FUNÇÕES (LOOPS SEPARADOS)

-- 1. Farm Universal de Moedas e Toques de Botões
task.spawn(function()
    while task.wait(0.2) do
        if Flags.AutoCollect then
            pcall(function()
                local hrp = LocalPlayer.Character and LocalPlayer.Character:FindFirstChild("HumanoidRootPart")
                if not hrp then return end

                for _, obj in pairs(workspace:GetDescendants()) do
                    if obj:IsA("TouchTransmitter") and obj.Parent then
                        local parent = obj.Parent
                        -- Filtra por partes de coleta comum
                        if parent.Name:lower():find("coin") or parent.Name:lower():find("money") or parent.Name:lower():find("giver") or parent.Name:lower():find("button") then
                            firetouchinterest(hrp, parent, 0)
                            firetouchinterest(hrp, parent, 1)
                        end
                    end
                end
            end)
        end
    end
end)

-- 2. Coleta de Comida, Kits e Drops
task.spawn(function()
    while task.wait(0.3) do
        if Flags.CollectFood then
            pcall(function()
                local hrp = LocalPlayer.Character and LocalPlayer.Character:FindFirstChild("HumanoidRootPart")
                if not hrp then return end

                for _, item in pairs(workspace:GetChildren()) do
                    local name = item.Name:lower()
                    if name:find("food") or name:find("kit") or name:find("med") or name:find("drop") or name:find("item") then
                        local itemPart = item:FindFirstChild("Handle") or item:FindFirstChild("HumanoidRootPart") or item
                        if itemPart:IsA("BasePart") then
                            itemPart.CFrame = hrp.CFrame
                        end
                    end
                end
            end)
        end
    end
end)

-- 3. Kill Aura Universal
task.spawn(function()
    while task.wait(0.2) do
        if Flags.KillAura then
            pcall(function()
                local myHrp = LocalPlayer.Character and LocalPlayer.Character:FindFirstChild("HumanoidRootPart")
                if not myHrp then return end

                for _, entity in pairs(workspace:GetChildren()) do
                    if entity:FindFirstChild("Humanoid") and entity ~= LocalPlayer.Character and not Players:GetPlayerFromCharacter(entity) then
                        local eHrp = entity:FindFirstChild("HumanoidRootPart") or entity:FindFirstChild("Torso")
                        if eHrp and (eHrp.Position - myHrp.Position).Magnitude <= 35 then
                            entity.Humanoid.Health = 0
                        end
                    end
                end
            end)
        end
    end
end)

-- 4. Speed Hack
RunService.Stepped:Connect(function()
    pcall(function()
        if Flags.SpeedHack and LocalPlayer.Character and LocalPlayer.Character:FindFirstChild("Humanoid") then
            LocalPlayer.Character.Humanoid.WalkSpeed = 50
        end
    end)
end)

-- 5. Air Jump
UserInputService.JumpRequest:Connect(function()
    if Flags.InfJump and LocalPlayer.Character and LocalPlayer.Character:FindFirstChild("Humanoid") then
        LocalPlayer.Character.Humanoid:ChangeState(Enum.HumanoidStateType.Jumping)
    end
end)

-- 6. ESP (Wallhack)
task.spawn(function()
    while task.wait(1) do
        pcall(function()
            for _, plr in pairs(Players:GetPlayers()) do
                if plr ~= LocalPlayer and plr.Character then
                    local highlight = plr.Character:FindFirstChild("SeniorESP")
                    if Flags.ESP then
                        if not highlight then
                            highlight = Instance.new("Highlight")
                            highlight.Name = "SeniorESP"
                            highlight.FillColor = Color3.fromRGB(0, 255, 150)
                            highlight.OutlineColor = Color3.fromRGB(255, 255, 255)
                            highlight.Parent = plr.Character
                        end
                    else
                        if highlight then highlight:Destroy() end
                    end
                end
            end
        end)
    end
end)

-- 🎨 ARRASTO DA JANELA (SISTEMA MOBILE & PC)
local dragging, dragStart, startPos
TopBar.InputBegan:Connect(function(input)
    if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
        dragging = true
        dragStart = input.Position
        startPos = MainFrame.Position
    end
end)

UserInputService.InputChanged:Connect(function(input)
    if dragging and (input.UserInputType == Enum.UserInputType.MouseMovement or input.UserInputType == Enum.UserInputType.Touch) then
        local delta = input.Position - dragStart
        MainFrame.Position = UDim2.new(startPos.X.Scale, startPos.X.Offset + delta.X, startPos.Y.Scale, startPos.Y.Offset + delta.Y)
    end
end)

UserInputService.InputEnded:Connect(function(input)
    if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
        dragging = false
    end
end)
