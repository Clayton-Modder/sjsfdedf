-- 🚀 SENIOR HUB - ULTIMATE CHEAT ENGINE UI
-- Compatível com: Delta, Solara, Wave, Codex, Arceus X, Hydrogen

local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local TweenService = game:GetService("TweenService")
local UserInputService = game:GetService("UserInputService")

local LocalPlayer = Players.LocalPlayer
local Mouse = LocalPlayer:GetMouse()

-- Estado das Funções
local Flags = {
    KillAura = false,
    AutoCollect = false,
    InfJump = false,
    ESP = false,
    SpeedHack = false
}

-- 🎨 CRIAÇÃO DA INTERFACE VISUAL
local ScreenGui = Instance.new("ScreenGui")
ScreenGui.Name = "SeniorHub_UI"
ScreenGui.Parent = game:GetService("CoreGui")
ScreenGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling

local MainFrame = Instance.new("Frame")
MainFrame.Name = "MainFrame"
MainFrame.Parent = ScreenGui
MainFrame.BackgroundColor3 = Color3.fromRGB(18, 18, 24)
MainFrame.Position = UDim2.new(0.35, 0, 0.25, 0)
MainFrame.Size = UDim2.new(0, 320, 0, 410)
MainFrame.BorderSizePixel = 0
MainFrame.ClipsDescendants = true

local UICorner = Instance.new("UICorner")
UICorner.CornerRadius = UDim.new(0, 10)
UICorner.Parent = MainFrame

local UIStroke = Instance.new("UIStroke")
UIStroke.Color = Color3.fromRGB(0, 200, 255)
UIStroke.Thickness = 1.5
UIStroke.Parent = MainFrame

-- Título
local Header = Instance.new("TextLabel")
Header.Parent = MainFrame
Header.BackgroundTransparency = 1
Header.Size = UDim2.new(1, -20, 0, 40)
Header.Position = UDim2.new(0, 15, 0, 5)
Header.Font = Enum.Font.GothamBold
Header.Text = "⚡ SENIOR ENGINE v2.0"
Header.TextColor3 = Color3.fromRGB(0, 200, 255)
Header.TextSize = 16
Header.TextXAlignment = Enum.TextXAlignment.Left

local ScrollContainer = Instance.new("ScrollingFrame")
ScrollContainer.Parent = MainFrame
ScrollContainer.BackgroundTransparency = 1
ScrollContainer.Position = UDim2.new(0, 10, 0, 50)
ScrollContainer.Size = UDim2.new(1, -20, 1, -60)
ScrollContainer.ScrollBarThickness = 3
ScrollContainer.CanvasSize = UDim2.new(0, 0, 0, 340)

local UIListLayout = Instance.new("UIListLayout")
UIListLayout.Parent = ScrollContainer
UIListLayout.SortOrder = Enum.SortOrder.LayoutOrder
UIListLayout.Padding = UDim.new(0, 8)

-- 🔘 GERADOR DE SWITCH ON/OFF
local function CreateToggle(name, default, callback)
    local Frame = Instance.new("Frame")
    Frame.Parent = ScrollContainer
    Frame.BackgroundColor3 = Color3.fromRGB(28, 28, 38)
    Frame.Size = UDim2.new(1, -5, 0, 45)
    
    local Corner = Instance.new("UICorner")
    Corner.CornerRadius = UDim.new(0, 8)
    Corner.Parent = Frame
    
    local Label = Instance.new("TextLabel")
    Label.Parent = Frame
    Label.BackgroundTransparency = 1
    Label.Position = UDim2.new(0, 12, 0, 0)
    Label.Size = UDim2.new(0.65, 0, 1, 0)
    Label.Font = Enum.Font.GothamSemibold
    Label.Text = name
    Label.TextColor3 = Color3.fromRGB(220, 220, 230)
    Label.TextSize = 13
    Label.TextXAlignment = Enum.TextXAlignment.Left

    local SwitchBg = Instance.new("TextButton")
    SwitchBg.Parent = Frame
    SwitchBg.Text = ""
    SwitchBg.AutoButtonColor = false
    SwitchBg.Position = UDim2.new(1, -50, 0.5, -11)
    SwitchBg.Size = UDim2.new(0, 40, 0, 22)
    SwitchBg.BackgroundColor3 = default and Color3.fromRGB(0, 200, 100) or Color3.fromRGB(50, 50, 65)

    local SwitchCorner = Instance.new("UICorner")
    SwitchCorner.CornerRadius = UDim.new(1, 0)
    SwitchCorner.Parent = SwitchBg

    local Knob = Instance.new("Frame")
    Knob.Parent = SwitchBg
    Knob.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
    Knob.Size = UDim2.new(0, 16, 0, 16)
    Knob.Position = default and UDim2.new(1, -19, 0.5, -8) or UDim2.new(0, 3, 0.5, -8)

    local KnobCorner = Instance.new("UICorner")
    KnobCorner.CornerRadius = UDim.new(1, 0)
    KnobCorner.Parent = Knob

    local state = default

    SwitchBg.MouseButton1Click:Connect(function()
        state = not state
        local targetColor = state and Color3.fromRGB(0, 200, 100) or Color3.fromRGB(50, 50, 65)
        local targetPos = state and UDim2.new(1, -19, 0.5, -8) or UDim2.new(0, 3, 0.5, -8)

        TweenService:Create(SwitchBg, TweenInfo.new(0.2), {BackgroundColor3 = targetColor}):Play()
        TweenService:Create(Knob, TweenInfo.new(0.2), {Position = targetPos}):Play()

        callback(state)
    end)
end

-- 🛠️ REGISTRO DE FUNÇÕES REAIS

-- 1. Speed Hack (Velocidade)
CreateToggle("Speed Boost (50x)", false, function(active)
    Flags.SpeedHack = active
end)

-- 2. Pulo Infinito
CreateToggle("Pulo Infinito (Air Jump)", false, function(active)
    Flags.InfJump = active
end)

-- 3. Kill Aura Universal
CreateToggle("Kill Aura (NPCs Próximos)", false, function(active)
    Flags.KillAura = active
end)

-- 4. Auto Collect (Moedas / Tycoons)
CreateToggle("Auto Coletar / Touch (Auto-Farm)", false, function(active)
    Flags.AutoCollect = active
end)

-- 5. ESP (Wallhack de Jogadores)
CreateToggle("ESP Box / Wallhack", false, function(active)
    Flags.ESP = active
end)

-- 🔄 LOOPS DE EXECUÇÃO EM TEMPO REAL

-- Speed Loop
RunService.Stepped:Connect(function()
    pcall(function()
        if Flags.SpeedHack and LocalPlayer.Character and LocalPlayer.Character:FindFirstChild("Humanoid") then
            LocalPlayer.Character.Humanoid.WalkSpeed = 50
        end
    end)
end)

-- Pulo Infinito Listener
UserInputService.JumpRequest:Connect(function()
    if Flags.InfJump and LocalPlayer.Character and LocalPlayer.Character:FindFirstChild("Humanoid") then
        LocalPlayer.Character.Humanoid:ChangeState(Enum.HumanoidStateType.Jumping)
    end
end)

-- Kill Aura Loop
task.spawn(function()
    while task.wait(0.2) do
        if Flags.KillAura then
            pcall(function()
                local myHrp = LocalPlayer.Character and LocalPlayer.Character:FindFirstChild("HumanoidRootPart")
                if not myHrp then return end

                for _, obj in pairs(workspace:GetChildren()) do
                    if obj:FindFirstChild("Humanoid") and obj ~= LocalPlayer.Character then
                        local hrp = obj:FindFirstChild("HumanoidRootPart") or obj:FindFirstChild("Torso")
                        if hrp and (hrp.Position - myHrp.Position).Magnitude <= 30 then
                            obj.Humanoid.Health = 0
                        end
                    end
                end
            end)
        end
    end
end)

-- Auto Collect Loop
task.spawn(function()
    while task.wait(0.3) do
        if Flags.AutoCollect then
            pcall(function()
                local myHrp = LocalPlayer.Character and LocalPlayer.Character:FindFirstChild("HumanoidRootPart")
                if not myHrp then return end

                for _, part in pairs(workspace:GetDescendants()) do
                    if part:IsA("TouchTransmitter") and part.Parent then
                        firetouchinterest(myHrp, part.Parent, 0)
                        firetouchinterest(myHrp, part.Parent, 1)
                    end
                end
            end)
        end
    end
end)

-- ESP System
local espHolders = {}
task.spawn(function()
    while task.wait(1) do
        if Flags.ESP then
            pcall(function()
                for _, plr in pairs(Players:GetPlayers()) do
                    if plr ~= LocalPlayer and plr.Character and plr.Character:FindFirstChild("HumanoidRootPart") then
                        if not plr.Character:FindFirstChild("HighlightESP") then
                            local highlight = Instance.new("Highlight")
                            highlight.Name = "HighlightESP"
                            highlight.FillColor = Color3.fromRGB(255, 0, 80)
                            highlight.OutlineColor = Color3.fromRGB(255, 255, 255)
                            highlight.FillTransparency = 0.5
                            highlight.Parent = plr.Character
                        end
                    end
                end
            end)
        else
            for _, plr in pairs(Players:GetPlayers()) do
                if plr.Character and plr.Character:FindFirstChild("HighlightESP") then
                    plr.Character.HighlightESP:Destroy()
                end
            end
        end
    end
end)

-- 🎨 SISTEMA DE ARRASTO (DRAGGABLE UI)
local dragging, dragStart, startPos
MainFrame.InputBegan:Connect(function(input)
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
