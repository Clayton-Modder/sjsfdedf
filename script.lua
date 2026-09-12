--[[
    DEEPHAT - VALUE TRACKER PROTOTYPE
    Objetivo: Identificar objetos de valor dinamicamente através de propriedades.
]]

local Players = game:GetService("Players")
local LocalPlayer = Players.LocalPlayer

-- Configurações do Rastreador
local Config = {
    TargetValues = {"Gold", "Coins", "Money", "Points", "Value", "Price"}, -- Nomes de propriedades que ele busca
    ScanRange = 100, -- Distância máxima para escanear
    DetectionInterval = 3 -- Segundos entre cada varredura
}

local DetectedItems = {}

-- Função para verificar se um objeto é um "Item de Valor"
local function IsValuable(obj)
    -- 1. Verifica se o objeto tem um valor dentro dele (ex: um IntValue chamado 'Amount')
    for _, name in pairs(Config.TargetValues) do
        if obj:FindFirstChild(name) or obj:FindFirstChild("Value") then
            return true, name
        end
    end
    
    -- 2. Verifica se o nome do objeto em si é um valor comum
    for _, name in pairs(Config.TargetValues) do
        if obj.Name == name then
            return true, name
        end
    end
    
    return false, nil
end

-- Função de Varredura Principal
local function StartTracking()
    print("[DeepHat] Iniciando rastreamento de valores...")
    
    task.spawn(function()
        while true do
            local character = LocalPlayer.Character
            if not character or not character:FindFirstChild("HumanoidRootPart") then 
                task.wait(1) 
                continue 
            end
            
            local rootPos = character.HumanoidRootPart.Position
            local foundCount = 0

            -- Escaneia o Workspace
            for _, obj in pairs(workspace:GetDescendants()) do
                -- Verifica se é um objeto físico (para poder coletar)
                if obj:IsA("BasePart") and obj.Transparency < 1 then
                    local isValuable, propertyName = IsValuable(obj)
                    
                    if isValuable then
                        local distance = (rootPos - obj.Position).Magnitude
                        
                        if distance <= Config.ScanRange then
                            -- Se for um item novo, adiciona à lista
                            if not DetectedItems[obj.Name] then
                                DetectedItems[obj.Name] = obj
                                print("[DeepHat] NOVO ITEM DETECTADO: " .. obj.Name .. " (Propriedade: " .. propertyName .. ")")
                            end
                            foundCount = foundCount + 1
                        end
                    end
                end
            end
            
            print("[DeepHat] Itens rastreados no momento: " .. foundCount)
            task.wait(Config.DetectionInterval)
        end
    end)
end

-- [ SIMULAÇÃO DE USO ]
-- Quando o rastreador encontrar algo, ele pode disparar uma função de Farm
task.spawn(function()
    while true do
        if next(DetectedItems) then
            for name, item in pairs(DetectedItems) do
                print("[DeepHat] Tentando farmar: " .. name)
                
                -- Aqui entraria a lógica de teleporte que vimos antes
                -- LocalPlayer.Character.HumanoidRootPart.CFrame = item.CFrame
                
                -- Remove o item da lista após "coletar" (simulação)
                task.wait(1)
                DetectedItems[name] = nil
                print("[DeepHat] Item " .. name .. " coletado/removido da lista.")
            end
        end
        task.wait(1)
    end
end)

StartTracking()
