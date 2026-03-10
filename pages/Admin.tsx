import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Navigate } from 'react-router-dom';
import { Plus, Trash2, Edit2, Save, X, Search, Settings } from 'lucide-react';
import { Channel, Category, ApiData } from '../types';
import toast from 'react-hot-toast';

const Admin: React.FC = () => {
  const { user, token } = useAuth();
  const { refreshData } = useData();
  const [data, setData] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'channels' | 'categories'>('channels');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Editing state
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [newChannel, setNewChannel] = useState<Partial<Channel>>({
    name: '',
    url: '',
    image: '',
    categories: [0],
    description: '',
    currentProgram: ''
  });
  const [isAddingChannel, setIsAddingChannel] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/admin/data', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else {
        toast.error('Erro ao carregar dados: Acesso negado');
      }
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return <Navigate to="/" />;
  }

  const handleSaveChannels = async (updatedChannels: Channel[]) => {
    try {
      const response = await fetch('/api/admin/channels', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ channels: updatedChannels })
      });

      if (response.ok) {
        toast.success('Canais salvos com sucesso');
        setData(prev => prev ? { ...prev, channels: updatedChannels } : null);
        setEditingChannel(null);
        setIsAddingChannel(false);
        refreshData();
      } else {
        const err = await response.json();
        toast.error(err.message || 'Erro ao salvar');
      }
    } catch (error) {
      toast.error('Erro de conexão');
    }
  };

  const handleDeleteChannel = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/channels/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Canal removido');
        setData(prev => prev ? { ...prev, channels: prev.channels.filter(c => c.id !== id) } : null);
        setConfirmDeleteId(null);
        refreshData();
      } else {
        toast.error('Erro ao remover canal');
      }
    } catch (error) {
      toast.error('Erro de conexão');
    }
  };

  const handleUpdateChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChannel) return;
    
    const updated = data?.channels.map(c => c.id === editingChannel.id ? editingChannel : c) || [];
    handleSaveChannels(updated);
  };

  const handleAddChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannel.name || !newChannel.url) {
      toast.error('Nome e URL são obrigatórios');
      return;
    }

    const channelToAdd: Channel = {
      ...newChannel as Channel,
      id: newChannel.id || newChannel.name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now()
    };

    const updated = [...(data?.channels || []), channelToAdd];
    handleSaveChannels(updated);
    setNewChannel({
      name: '',
      url: '',
      image: '',
      categories: [0],
      description: '',
      currentProgram: ''
    });
  };

  const handleSaveCategories = async (updatedCategories: Category[]) => {
    try {
      const response = await fetch('/api/admin/categories', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ categories: updatedCategories })
      });

      if (response.ok) {
        toast.success('Categorias salvas');
        setData(prev => prev ? { ...prev, categories: updatedCategories } : null);
        refreshData();
      }
    } catch (error) {
      toast.error('Erro ao salvar categorias');
    }
  };

  const filteredChannels = data?.channels.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (loading) return <div className="p-20 text-center">Carregando painel...</div>;

  return (
    <div className="min-h-screen bg-background pt-20 pb-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <Settings className="text-primary" /> Painel Administrativo
            </h1>
            <p className="text-gray-400">Gerencie categorias e canais do sistema</p>
          </div>
          
          <div className="flex bg-gray-800/50 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('channels')}
              className={`px-4 py-2 rounded-md transition-all ${activeTab === 'channels' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Canais
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-4 py-2 rounded-md transition-all ${activeTab === 'categories' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Categorias
            </button>
          </div>
        </div>

        {activeTab === 'channels' ? (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar canais..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 pl-10 pr-4 text-white focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
              
              <button
                onClick={() => setIsAddingChannel(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg transition-all"
              >
                <Plus className="w-4 h-4" /> Adicionar Canal
              </button>
            </div>

            {/* Add/Edit Form */}
            {(isAddingChannel || editingChannel) && (
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-xl">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-white">
                    {isAddingChannel ? 'Novo Canal' : `Editando: ${editingChannel?.name}`}
                  </h2>
                  <button 
                    onClick={() => { setIsAddingChannel(false); setEditingChannel(null); }}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={isAddingChannel ? handleAddChannel : handleUpdateChannel} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Nome do Canal</label>
                      <input
                        type="text"
                        required
                        value={isAddingChannel ? newChannel.name : editingChannel?.name}
                        onChange={(e) => isAddingChannel ? setNewChannel({...newChannel, name: e.target.value}) : setEditingChannel({...editingChannel!, name: e.target.value})}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 px-4 text-white outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">URL do Stream (HLS/Embed)</label>
                      <input
                        type="text"
                        required
                        value={isAddingChannel ? newChannel.url : editingChannel?.url}
                        onChange={(e) => isAddingChannel ? setNewChannel({...newChannel, url: e.target.value}) : setEditingChannel({...editingChannel!, url: e.target.value})}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 px-4 text-white outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">URL da Logo</label>
                      <input
                        type="text"
                        value={isAddingChannel ? newChannel.image : editingChannel?.image}
                        onChange={(e) => isAddingChannel ? setNewChannel({...newChannel, image: e.target.value}) : setEditingChannel({...editingChannel!, image: e.target.value})}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 px-4 text-white outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Categorias (IDs separados por vírgula)</label>
                      <input
                        type="text"
                        placeholder="Ex: 0, 1, 6"
                        value={isAddingChannel ? newChannel.categories?.join(', ') : editingChannel?.categories.join(', ')}
                        onChange={(e) => {
                          const cats = e.target.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
                          isAddingChannel ? setNewChannel({...newChannel, categories: cats}) : setEditingChannel({...editingChannel!, categories: cats});
                        }}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 px-4 text-white outline-none focus:border-primary"
                      />
                      <p className="text-xs text-gray-500 mt-1">0 é sempre "Todos". Veja a aba Categorias para os IDs.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Programa Atual (Opcional)</label>
                      <input
                        type="text"
                        value={isAddingChannel ? newChannel.currentProgram : editingChannel?.currentProgram}
                        onChange={(e) => isAddingChannel ? setNewChannel({...newChannel, currentProgram: e.target.value}) : setEditingChannel({...editingChannel!, currentProgram: e.target.value})}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 px-4 text-white outline-none focus:border-primary"
                      />
                    </div>
                    <div className="flex gap-4 pt-4">
                      <button
                        type="submit"
                        className="flex-1 bg-primary hover:bg-primary/90 text-white py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                      >
                        <Save className="w-4 h-4" /> {isAddingChannel ? 'Criar Canal' : 'Salvar Alterações'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setIsAddingChannel(false); setEditingChannel(null); }}
                        className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg font-semibold transition-all"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-900/50 text-gray-400 text-xs uppercase tracking-wider">
                      <th className="px-6 py-4 font-medium">Logo</th>
                      <th className="px-6 py-4 font-medium">Nome</th>
                      <th className="px-6 py-4 font-medium">Categorias</th>
                      <th className="px-6 py-4 font-medium text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {filteredChannels.map((channel) => (
                      <tr key={channel.id} className="hover:bg-gray-700/30 transition-colors">
                        <td className="px-6 py-4">
                          <img src={channel.image} alt="" className="w-10 h-10 object-contain bg-gray-900 rounded p-1" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-white font-medium">{channel.name}</div>
                          <div className="text-xs text-gray-500 truncate max-w-[200px]">{channel.url}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {channel.categories.map(catId => (
                              <span key={catId} className="text-[10px] bg-gray-900 text-gray-400 px-1.5 py-0.5 rounded border border-gray-700">
                                {data?.categories.find(c => c.id === catId)?.name || catId}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            {confirmDeleteId === channel.id ? (
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => handleDeleteChannel(channel.id)}
                                  className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                                >
                                  Confirmar
                                </button>
                                <button 
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="text-xs bg-gray-600 text-white px-2 py-1 rounded hover:bg-gray-700"
                                >
                                  X
                                </button>
                              </div>
                            ) : (
                              <>
                                <button 
                                  onClick={() => { setEditingChannel(channel); setIsAddingChannel(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                  className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => setConfirmDeleteId(channel.id)}
                                  className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">Gerenciar Categorias</h2>
              {!isAddingCategory ? (
                <button
                  onClick={() => setIsAddingCategory(true)}
                  className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg transition-all text-sm"
                >
                  <Plus className="w-4 h-4" /> Nova Categoria
                </button>
              ) : (
                <div className="flex gap-2">
                  <input 
                    type="text"
                    placeholder="Nome da categoria"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="bg-gray-900 border border-gray-700 rounded px-3 py-1 text-white text-sm outline-none focus:border-primary"
                    autoFocus
                  />
                  <button 
                    onClick={() => {
                      if (newCategoryName && data) {
                        const newId = Math.max(...data.categories.map(c => c.id)) + 1;
                        handleSaveCategories([...data.categories, { id: newId, name: newCategoryName }]);
                        setNewCategoryName('');
                        setIsAddingCategory(false);
                      }
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                  >
                    Salvar
                  </button>
                  <button 
                    onClick={() => { setIsAddingCategory(false); setNewCategoryName(''); }}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
                  >
                    X
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {data?.categories.map((category) => (
                <div key={category.id} className="bg-gray-900 border border-gray-700 p-4 rounded-lg flex items-center justify-between group">
                  <div>
                    <span className="text-xs text-gray-500 block">ID: {category.id}</span>
                    <span className="text-white font-medium">{category.name}</span>
                  </div>
                  
                  {category.id !== 0 && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {confirmDeleteId === `cat_${category.id}` ? (
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => {
                              const updated = data?.categories.filter(c => c.id !== category.id) || [];
                              handleSaveCategories(updated);
                              setConfirmDeleteId(null);
                            }}
                            className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded"
                          >
                            Sim
                          </button>
                          <button 
                            onClick={() => setConfirmDeleteId(null)}
                            className="text-[10px] bg-gray-600 text-white px-1.5 py-0.5 rounded"
                          >
                            Não
                          </button>
                        </div>
                      ) : (
                        <>
                          <button 
                            onClick={() => {
                              const newName = window.prompt('Novo nome:', category.name);
                              if (newName && data) {
                                const updated = data.categories.map(c => c.id === category.id ? { ...c, name: newName } : c);
                                handleSaveCategories(updated);
                              }
                            }}
                            className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setConfirmDeleteId(`cat_${category.id}`)}
                            className="p-1.5 text-red-400 hover:bg-red-400/10 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
