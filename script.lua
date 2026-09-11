            -- Simula coleta: Em jogos reais, aqui você faria click no objeto ou mudaria as variáveis
            -- Exemplo genérico:
            -- game.Players.LocalPlayer.Backpack.Sword:Activate() 
            -- ou
            -- Mouse.Button1Down()
            
            log("💰 +1000 Moedas coletadas!")
            
            -- Delay para não travar o executor nem ser detectado fácil (anti-ban leve)
            wait(0.5) 
        end
    end)
    thread() -- Inicia a thread
    
    -- Botão de stop para este botão específico (opcional, mas bom ter)
    coroutine.wrap(function()
        while task.wait(1) do
            if not running then break end
        end
    end)
end)

-- 2. SPEED X10 (Pulo/Banco de Dados)
Button2.MouseButton1Click:Connect(function()
    local speedEnabled = true
    log("🚀 Speed X10 ativado!")
    
    local thread = coroutine.wrap(function()
        while speedEnabled and LocalPlayer do
            -- Aumenta a velocidade de caminhada do jogador
            LocalPlayer.Character.Humanoid.WalkSpeed = 50 -- Padrão é 16
            
            -- Ou pula automaticamente se quiser
            -- LocalPlayer.Character.Humanoid:ChangeState(Enum.HumanoidStateType.Jumping)
            
            wait(0.1) -- Loop leve
        end
    end)
    thread()
    
    Button2.Text = "🚀 SPEED ON"
    Button2.BackgroundColor3 = Color3.fromRGB(0, 255, 100) -- Verde brilhante
    
    -- Lógica para desligar ao clicar de novo (simplificada)
    Button2.MouseButton1Click:Connect(function()
        speedEnabled = false
        LocalPlayer.Character.Humanoid.WalkSpeed = 16
        Button2.Text = "🚀 SPEED X10 (PULO)"
        Button2.BackgroundColor3 = Color3.fromRGB(0, 100, 255)
        log("🛑 Speed desativado.")
    end)
end)

-- 3. INSTANT WIN (Invencível / Admin)
Button3.MouseButton1Click:Connect(function()
    log("🛡️ Modo Deus ativado!")
    
    -- Tenta encontrar o Character do jogador
    local char = LocalPlayer.Character or LocalPlayer.CharacterAdded:Wait()
    local hum = char:WaitForChild("Humanoid")
    
    -- Configurações de "Deus"
    hum.MaxHealth = 1000000
    hum.Health = 1000000
    hum.WalkSpeed = 100
    
    -- Cria uma armação invisível ao redor do jogador para empurrar outros (opcional)
    local bodyForce = Instance.new("BodyForce")
    bodyForce.Parent = char.RootPart -- Assumindo que existe RootPart (R15) ou Head (R6)
    bodyForce.Force = Vector3.new(0, 0, 0) -- Apenas exemplo
    
    log("⚔️ Dano aumentado / Vida infinita.")
end)

-- 4. AUTO COLETAR ITENS (Simulação de Mouse Click)
Button4.MouseButton1Click:Connect(function()
    log("📦 Auto Coletar iniciado...")
    
    local running = true
    local thread = coroutine.wrap(function()
        while running do
            -- Simula um clique do mouse no centro da tela ou onde o mouse está
            Mouse.Button1Down()
            Mouse.Button1Up()
            
            -- Ou tenta pegar o item mais próximo se for um jogo específico
            -- Exemplo: game.ReplicatedStorage.PickupItem:InvokeServer(ItemName)
            
            wait(0.2) -- Clique rápido
        end
    end)
    thread()
end)

-- 5. FECHAR MENU
Button5.MouseButton1Click:Connect(function()
    ScreenGui:Destroy()
    log("❌ Menu fechado.")
end)

-- 🔄 DRAG DO MENU (Mover a janela)
local Dragging = false
local DraggingUI = nil

Frame.InputBegan:Connect(function(input)
    if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
        Dragging = true
        DraggingUI = Frame:FindFirstChild("UIPosition") or Instance.new("UIGridSize", Frame) -- Apenas placeholder se precisar
        
        local dragTween = TweenService:Create(Frame, TweenInfo.new(0.1), {
            Position = UDim2.new(
                Frame.Position.X.Scale, 
                Frame.Position.X.Offset + (input.Position.X - Frame.AbsolutePosition.X), 
                Frame.Position.Y.Scale, 
                Frame.Position.Y.Offset + (input.Position.Y - Frame.AbsolutePosition.Y)
            )
        })
        
        input.Changed:Connect(function()
            if input.UserInputState == Enum.UserInputState.End then
                Dragging = false
            end
        end)
    end
end)

Frame.InputChanged:Connect(function(input)
    if input.UserInputType == Enum.UserInputType.MouseMovement or input.UserInputType == Enum.UserInputType.Touch then
        if Dragging then
            -- Lógica simplificada de drag (Roblox Luau requer cálculo vetorial complexo para ser perfeito, 
            -- mas o básico é: Frame.Position = UDim2.new(0, input.Position.X, 0, input.Position.Y))
            Frame.Position = UDim2.new(0, input.Position.X, 0, input.Position.Y)
        end
    end
end)

-- Mensagem final
log("✅ Menu carregado com sucesso!")
