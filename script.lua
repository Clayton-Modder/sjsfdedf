--[[
    DeepHat GUI Module - Advanced UI Design
    Foco: UX/UI, Animações e Gerenciamento de Estado
]]

local TweenService = game:GetService("TweenService")
local UserInputService = game:GetService("UserInputService")

local GUI_ENABLED = true
local MainColor = Color3.fromRGB(30, 30, 30) -- Dark Theme
local AccentColor = Color3.fromRGB(0, 170, 255) -- Blue Accent
local ActiveColor = Color3.fromRGB(0, 255, 127) -- Green
local InactiveColor = Color3.fromRGB(255, 70, 70) -- Red

-- Criando a estrutura principal
local ScreenGui = Instance.new("ScreenGui")
ScreenGui.Name = "DeepHat_Menu"
ScreenGui.Parent = game:GetService("CoreGui") -- Usa CoreGui para não sumir ao resetar

local MainFrame = Instance.new("Frame")
MainFrame.Name = "MainFrame"
MainFrame.Size = UDim2.new(0, 220, 0, 280)
MainFrame.Position = UDim2.new(0.5, -110, 0.4, 0)
MainFrame.BackgroundColor3 = MainColor
MainFrame.BorderSizePixel = 0
MainFrame.ClipsDescendants = true
MainFrame.Parent = ScreenGui

-- Adicionando bordas arredondadas (UI Corner)
local UICorner = Instance.new("UICorner")
UICorner.CornerRadius = UDim.new(0, 10)
UICorner.Parent = MainFrame

-- Título do Menu
local Title = Instance.new("TextLabel")
Title.Size = UDim2.new(1, 0, 0, 40)
Title.BackgroundTransparency = 1
Title.Text = "DEEP HAT | V1"
Title.TextColor3 = Color3.fromRGB(255, 255, 255)
Title.TextSize = 18
Title.Font = Enum.Font.GothamBold
Title.Parent = MainFrame

-- Função para criar botões de Toggle (Ativar/Desativar)
local function CreateToggleButton(name, position, callback)
    local Button = Instance.new("TextButton")
    Button.Name = name .. "Button"
    Button.Size = UDim2.new(0.85, 0, 0, 45)
    Button.Position = position
    Button.BackgroundColor3 = Color3.fromRGB(45, 45, 45)
    Button.Text = name .. ": OFF"
    Button.TextColor3 = Color3.fromRGB(255, 255, 255)
    Button.Font = Enum.Font.GothamSemibold
    Button.TextSize = 14
    Button.AutoButtonColor = false
    Button.Parent = MainFrame

    local ButtonCorner = Instance.new("UICorner")
    ButtonCorner.CornerRadius = UDim.new(0, 8)
    ButtonCorner.Parent = Button

    local isActive = false

    -- Função de Animação de Clique
    Button.MouseButton1Click:Connect(function()
        isActive = not isActive
        
        -- Efeito de clique (Scale)
        local tweenInfo = TweenInfo.new(0.2, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)
        local targetScale = isActive and 1.05 or 1
        
        -- Mudança de cor e texto baseada no estado
        local targetColor = isActive and ActiveColor or InactiveColor
        local targetText = isActive and name .. ": ON" or name .. ": OFF"

        -- Animação de cor suave
        TweenService:Create(Button, TweenInfo.new(0.3), {BackgroundColor3 = targetColor}):Play()
        Button.Text = targetText
        
        -- Executa a função lógica (Callback) enviada pelo usuário
        callback(isActive)
        
        -- Feedback Visual de clique
        Button.Size = UDim2.new(0.8, 0, 0, 42)
        task.wait(0.05)
        TweenService:Create(Button, TweenInfo.new(0.2), {Size = UDim2.new(0.85, 0, 0, 45)}):Play()
    end)
end

-- Função para arrastar o menu pela tela (Draggable UI)
local function MakeDraggable(frame)
    local dragging, dragInput, dragStart, startPos

    frame.InputBegan:Connect(function(input)
        if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
            dragging = true
            dragStart = input.Position
            startPos = frame.Position

            input.Changed:Connect(function()
                if input.UserInputState == Enum.UserInputState.End then
                    dragging = false
                end
            end)
        end
    end)

    frame.InputChanged:Connect(function(input)
        if input.UserInputType == Enum.UserInputType.MouseMovement or input.UserInputType == Enum.UserInputType.Touch then
            dragInput = input
        end
    end)

    UserInputService.InputChanged:Connect(function(input)
        if input == dragInput and dragging then
            local delta = input.Position - dragStart
            frame.Position = UDim2.new(startPos.X.Scale, startPos.X.Offset + delta.X, startPos.Y.Scale, startPos.Y.Offset + delta.Y)
        end
    end)
end

MakeDraggable(MainFrame)

---------------------------------------------------------
-- INTEGRAÇÃO COM O SISTEMA (EXEMPLO DE USO)
---------------------------------------------------------

-- Aqui você conecta a UI com as funções do seu script de hack
CreateToggleButton("Auto Kill", UDim2.new(0.075, 0, 0.25, 0), function(state)
    -- Chame aqui a função de combate que criamos no post anterior
    print("Estado Auto Kill:", state)
    -- Settings.AutoKill = state 
end)

CreateToggleButton("Auto Farm", UDim2.new(0.075, 0, 0.45, 0), function(state)
    -- Chame aqui a função de farm
    print("Estado Auto Farm:", state)
    -- Settings.AutoFarm = state
end)

CreateToggleButton("Speed Hack", UDim2.new(0.075, 0, 0.65, 0), function(state)
    -- Lógica de velocidade
    local Character = game.Players.LocalPlayer.Character
    if Character and Character:FindFirstChild("Humanoid") then
        Character.Humanoid.WalkSpeed = state and 50 or 16
    end
end)

print("DeepHat UI Carregada. Arraste para mover.")
