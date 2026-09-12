--[[
    DEEPHAT - SAFE MODE VERSION
    Foco: Evitar travamentos de carregamento
]]

local Players = game:GetService("Players")
local LocalPlayer = Players.LocalPlayer

-- Função para pegar o personagem de forma segura (sem travar o script)
local function GetSafeCharacter()
    local char = LocalPlayer.Character
    if char then return char end
    return LocalPlayer.CharacterAdded:Wait()
end

-- Função para garantir que o RootPart existe
local function GetSafeRootPart()
    local char = GetSafeCharacter()
    local root = char:WaitForChild("HumanoidRootPart", 10) -- Espera no máximo 10 segundos
    return root
end

-- [ TESTE DE LOG NO CONSOLE ]
print("--- [DEEPHAT] INICIANDO SISTEMA EM MODO SEGURO ---")

-- Criando uma UI simples para teste de visibilidade
local function CreateTestUI()
    local ScreenGui = Instance.new("ScreenGui")
    -- Se o CoreGui falhar, ele tenta o PlayerGui (mais comum em executores simples)
    local success, err = pcall(function()
        ScreenGui.Parent = game:GetService("CoreGui")
    end)
    
    if not success then
        ScreenGui.Parent = LocalPlayer:WaitForChild("PlayerGui")
    end

    local Main = Instance.new("Frame")
    Main.Size = UDim2.new(0, 250, 0, 150)
    Main.Position = UDim2.new(0.5, -125, 0.1, 0) -- No topo da tela
    Main.BackgroundColor3 = Color3.fromRGB(30, 30, 30)
    Main.BorderSizePixel = 2
    Main.Parent = ScreenGui

    local Title = Instance.new("TextLabel")
    Title.Size = UDim2.new(1, 0, 0, 30)
    Title.Text = "DEEPHAT DEBUG UI"
    Title.TextColor3 = Color3.fromRGB(0, 255, 255)
    Title.BackgroundColor3 = Color3.fromRGB(50, 50, 50)
    Title.Parent = Main

    local Status = Instance.new("TextLabel")
    Status.Size = UDim2.new(1, 0, 0, 70)
    Status.Position = UDim2.new(0, 0, 0.3, 0)
    Status.Text = "Status: Aguardando Personagem..."
    Status.TextColor3 = Color3.fromRGB(255, 255, 255)
    Status.BackgroundTransparency = 1
    Status.Parent = Main

    return Status
end

local statusLabel = CreateTestUI()

-- Loop de Inicialização
task.spawn(function()
    local root = GetSafeRootPart()
    if root then
        statusLabel.Text = "Status: PRONTO!\nVerifique o Console (F9)"
        statusLabel.TextColor3 = Color3.fromRGB(0, 255, 0)
        print("[DeepHat] Personagem e RootPart detectados!")
    else
        statusLabel.Text = "Status: ERRO NO PERSONAGEM"
        statusLabel.TextColor3 = Color3.fromRGB(255, 0, 0)
        print("[DeepHat] Erro: RootPart não encontrado.")
    end
end)

print("--- [DEEPHAT] SCRIPT CARREGADO ---")
