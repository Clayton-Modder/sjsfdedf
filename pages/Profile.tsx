import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Camera, Save, LogOut, Award, Clock, Loader2, CheckCircle, AlertCircle, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, token, logout, updateUser } = useAuth();
  const [username, setUsername] = useState(user?.username || '');
  const [profilePic, setProfilePic] = useState(user?.profilePic || '');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [xpLoading, setXpLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setProfilePic(user.profilePic);
    }
  }, [user]);

  useEffect(() => {
    const updateTimer = () => {
      if (!user?.lastXpClaim) return;
      
      const now = Date.now();
      const TWELVE_HOURS = 12 * 60 * 60 * 1000;
      const diff = now - user.lastXpClaim;
      
      if (diff < TWELVE_HOURS) {
        const remaining = TWELVE_HOURS - diff;
        const h = Math.floor(remaining / (60 * 60 * 1000));
        const m = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
        const s = Math.floor((remaining % (60 * 1000)) / 1000);
        setTimeRemaining(`${h}h ${m}m ${s}s`);
      } else {
        setTimeRemaining(null);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [user?.lastXpClaim]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ username, profilePic }),
      });

      const data = await response.json();

      if (response.ok) {
        updateUser(data);
        setMessage({ text: 'Perfil atualizado com sucesso!', type: 'success' });
      } else {
        setMessage({ text: data.message || 'Erro ao atualizar perfil', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Erro de conexão', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimXp = async () => {
    setXpLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const response = await fetch('/api/user/claim-xp', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        updateUser(data);
        setMessage({ text: 'Você ganhou 4 XP!', type: 'success' });
      } else {
        setMessage({ text: data.message || 'Erro ao ganhar XP', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Erro de conexão', type: 'error' });
    } finally {
      setXpLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Sidebar: Profile Info */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-card border border-gray-800 rounded-2xl p-6 text-center">
            <div className="relative w-32 h-32 mx-auto mb-4 group">
              <img 
                src={profilePic} 
                alt={user.username} 
                className="w-full h-full rounded-full object-cover border-4 border-primary shadow-xl"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera className="text-white w-8 h-8" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">{user.username}</h2>
            <p className="text-gray-400 text-sm mb-4">{user.email}</p>
            
            <div className="flex items-center justify-center gap-2 bg-primary/10 text-primary py-2 px-4 rounded-full font-bold">
              <Award className="w-5 h-5" />
              Nível {user.level}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-800 space-y-4">
              {user.role === 'admin' && (
                <button 
                  onClick={() => navigate('/admin')}
                  className="flex items-center justify-center gap-2 w-full bg-primary/20 text-primary hover:bg-primary/30 py-2 rounded-xl transition-all font-bold"
                >
                  <Settings className="w-5 h-5" />
                  Painel Admin
                </button>
              )}
              
              <button 
                onClick={logout}
                className="flex items-center justify-center gap-2 w-full text-red-400 hover:text-red-300 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Sair da Conta
              </button>
            </div>
          </div>

          {/* XP Card */}
          <div className="bg-card border border-gray-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Bônus Diário
            </h3>
            <p className="text-gray-400 text-sm mb-6">
              Ganhe 4 XP a cada 12 horas para subir de nível!
            </p>
            
            {timeRemaining ? (
              <div className="text-center">
                <div className="text-2xl font-mono text-gray-300 mb-2">{timeRemaining}</div>
                <div className="text-xs text-gray-500 uppercase tracking-widest">Próximo resgate</div>
              </div>
            ) : (
              <button 
                onClick={handleClaimXp}
                disabled={xpLoading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                {xpLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Resgatar 4 XP'}
              </button>
            )}

            <div className="mt-6">
              <div className="flex justify-between text-xs text-gray-400 mb-2">
                <span>Progresso: {user.xp % 20} / 20 XP</span>
                <span>{Math.floor((user.xp % 20) / 20 * 100)}%</span>
              </div>
              <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${(user.xp % 20) / 20 * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content: Edit Profile */}
        <div className="md:col-span-2">
          <div className="bg-card border border-gray-800 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-white mb-8">Configurações de Perfil</h3>

            {message.text && (
              <div className={`mb-8 p-4 rounded-xl flex items-center gap-3 text-sm border ${
                message.type === 'success' 
                  ? 'bg-green-500/10 border-green-500/50 text-green-500' 
                  : 'bg-red-500/10 border-red-500/50 text-red-500'
              }`}>
                {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                {message.text}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Nome de Usuário</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    placeholder="Seu nome"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">URL da Foto de Perfil</label>
                <div className="relative">
                  <Camera className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    value={profilePic}
                    onChange={(e) => setProfilePic(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    placeholder="https://exemplo.com/foto.jpg"
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Dica: Você pode usar URLs do DiceBear, Imgur ou qualquer link de imagem direto.
                </p>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-primary hover:bg-red-600 text-white font-bold py-3 px-8 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Salvar Alterações</>}
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};
