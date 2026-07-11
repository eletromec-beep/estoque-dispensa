import { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  User,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  Lock,
  ArrowLeft,
  ChevronLeft,
  RefreshCw,
  Menu,
  X,
} from 'lucide-react';
import { supabase } from './supabaseClient';

const CATEGORIES = [
  { key: 'higiene', label: 'Higiene', border: 'border-blue-400', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  { key: 'limpeza', label: 'Limpeza', border: 'border-green-400', bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  { key: 'materiais', label: 'Materiais de limpeza', border: 'border-amber-400', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  { key: 'descartaveis', label: 'Descartáveis', border: 'border-purple-400', bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
];

const DEFAULT_ITEMS = [
  { id: 'h1', name: 'Papel higiênico', category: 'higiene', unit: 'rolo', current: 4, min: 8 },
  { id: 'h2', name: 'Sabonete', category: 'higiene', unit: 'unidade', current: 2, min: 4 },
  { id: 'l1', name: 'Detergente', category: 'limpeza', unit: 'unidade', current: 1, min: 3 },
  { id: 'l2', name: 'Água sanitária', category: 'limpeza', unit: 'litro', current: 2, min: 2 },
  { id: 'l3', name: 'Desinfetante', category: 'limpeza', unit: 'unidade', current: 0, min: 2 },
  { id: 'l4', name: 'Álcool em gel', category: 'limpeza', unit: 'unidade', current: 1, min: 3 },
  { id: 'm1', name: 'Rodo', category: 'materiais', unit: 'unidade', current: 1, min: 1 },
  { id: 'm2', name: 'Pano de chão', category: 'materiais', unit: 'unidade', current: 1, min: 3 },
  { id: 'm3', name: 'Vassoura', category: 'materiais', unit: 'unidade', current: 1, min: 1 },
  { id: 'm4', name: 'Pá de lixo', category: 'materiais', unit: 'unidade', current: 1, min: 1 },
  { id: 'd1', name: 'Copo descartável', category: 'descartaveis', unit: 'pacote', current: 1, min: 3 },
  { id: 'd2', name: 'Papel toalha', category: 'descartaveis', unit: 'rolo', current: 1, min: 4 },
];

function need(item) {
  return Math.max(0, item.min - item.current);
}

function StockBar({ item }) {
  const pct = item.min > 0 ? Math.min(100, Math.round((item.current / item.min) * 100)) : 100;
  const low = need(item) > 0;
  return (
    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mt-2">
      <div className={`h-full rounded-full ${low ? 'bg-red-400' : 'bg-green-500'}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function ItemCard({ item, role, onAdjust, onEditMin, onDelete }) {
  const cat = CATEGORIES.find((c) => c.key === item.category);
  const missing = need(item);
  return (
    <div className={`border-l-4 ${cat.border} bg-white rounded-lg shadow-sm p-4 flex flex-col gap-1`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-gray-800 leading-tight">{item.name}</p>
          <p className="text-xs text-gray-400">{item.unit}</p>
        </div>
        {missing > 0 ? (
          <span className="text-xs font-medium bg-red-50 text-red-600 px-2 py-1 rounded-full whitespace-nowrap">
            comprar {missing}
          </span>
        ) : (
          <span className="text-xs font-medium bg-green-50 text-green-600 px-2 py-1 rounded-full">ok</span>
        )}
      </div>

      <StockBar item={item} />

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onAdjust(item.id, -1)}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 text-gray-600 active:scale-95"
            aria-label="Diminuir estoque"
          >
            <Minus size={16} />
          </button>
          <span className="font-mono text-lg w-8 text-center">{item.current}</span>
          <button
            onClick={() => onAdjust(item.id, 1)}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 text-gray-600 active:scale-95"
            aria-label="Aumentar estoque"
          >
            <Plus size={16} />
          </button>
        </div>

        {role === 'admin' && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>mín.</span>
            <input
              type="number"
              min="0"
              value={item.min}
              onChange={(e) => onEditMin(item.id, Math.max(0, parseInt(e.target.value) || 0))}
              className="w-14 border border-gray-300 rounded px-1 py-0.5 font-mono text-center"
            />
            <button onClick={() => onDelete(item.id)} className="text-gray-400 active:text-red-500" aria-label="Remover item">
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function AddItemForm({ category, onAdd }) {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('unidade');
  const [min, setMin] = useState(1);

  const submit = () => {
    if (!name.trim()) return;
    onAdd({ id: `${category}-${Date.now()}`, name: name.trim(), category, unit, current: 0, min: Math.max(0, min) });
    setName('');
    setUnit('unidade');
    setMin(1);
  };

  return (
    <div className="border border-dashed border-gray-300 rounded-lg p-3 flex flex-col gap-2 bg-gray-50">
      <input
        type="text"
        placeholder="Nome do item"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="border border-gray-300 rounded px-2 py-1.5 text-sm"
      />
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Unidade"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          className="border border-gray-300 rounded px-2 py-1.5 text-sm flex-1"
        />
        <input
          type="number"
          min="0"
          placeholder="Mín."
          value={min}
          onChange={(e) => setMin(parseInt(e.target.value) || 0)}
          className="border border-gray-300 rounded px-2 py-1.5 text-sm w-20 font-mono"
        />
      </div>
      <button onClick={submit} className="bg-gray-800 text-white rounded py-1.5 text-sm font-medium active:scale-95">
        Adicionar item
      </button>
    </div>
  );
}

function ShoppingList({ items }) {
  const toBuy = items.filter((i) => need(i) > 0);
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-gray-500">
        {toBuy.length === 0
          ? 'Nada precisa ser comprado agora.'
          : `${toBuy.length} ${toBuy.length === 1 ? 'item precisa' : 'itens precisam'} de reposição.`}
      </p>
      {CATEGORIES.map((cat) => {
        const catItems = toBuy.filter((i) => i.category === cat.key);
        if (catItems.length === 0) return null;
        return (
          <div key={cat.key}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`w-2 h-2 rounded-full ${cat.dot}`} />
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{cat.label}</p>
            </div>
            <div className="flex flex-col gap-2">
              {catItems.map((i) => (
                <div key={i.id} className={`flex items-center justify-between ${cat.bg} rounded-lg px-3 py-2`}>
                  <span className={`text-sm font-medium ${cat.text}`}>{i.name}</span>
                  <span className="font-mono text-sm font-semibold text-gray-700">
                    {need(i)} {i.unit}
                    {need(i) > 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function GroupedItemList({ items, role, onAdjust, onEditMin, onDelete }) {
  return (
    <div className="flex flex-col gap-6">
      {CATEGORIES.map((cat) => {
        const catItems = items.filter((i) => i.category === cat.key);
        if (catItems.length === 0) return null;
        return (
          <div key={cat.key}>
            <div className="flex items-center gap-2 mb-3">
              <span className={`w-2.5 h-2.5 rounded-full ${cat.dot}`} />
              <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{cat.label}</p>
            </div>
            <div className="flex flex-col gap-3">
              {catItems.map((item) => (
                <ItemCard key={item.id} item={item} role={role} onAdjust={onAdjust} onEditMin={onEditMin} onDelete={onDelete} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [items, setItems] = useState([]);
  const [screen, setScreen] = useState('select'); // select | pin | main
  const [role, setRole] = useState(null);
  const [activeCat, setActiveCat] = useState(CATEGORIES[0].key);
  const [showShopping, setShowShopping] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const ADMIN_PIN = '4132';

  const loadItems = useCallback(async (isRefresh = false) => {
    if (isRefresh) setSyncing(true);
    setErrorMsg('');
    try {
      const { data, error } = await supabase.from('items').select('*').order('category');
      if (error) throw error;

      if (!data || data.length === 0) {
        const { error: insertError } = await supabase.from('items').insert(DEFAULT_ITEMS);
        if (insertError) throw insertError;
        setItems(DEFAULT_ITEMS);
      } else {
        setItems(data);
      }
    } catch (e) {
      console.error(e);
      setErrorMsg('Não foi possível conectar ao banco de dados. Verifique as variáveis de ambiente do Supabase.');
      if (items.length === 0) setItems(DEFAULT_ITEMS);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, [items.length]);

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const adjust = async (id, delta) => {
    const target = items.find((i) => i.id === id);
    if (!target) return;
    const newCurrent = Math.max(0, target.current + delta);
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, current: newCurrent } : i)));
    const { error } = await supabase.from('items').update({ current: newCurrent }).eq('id', id);
    if (error) console.error(error);
  };

  const editMin = async (id, value) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, min: value } : i)));
    const { error } = await supabase.from('items').update({ min: value }).eq('id', id);
    if (error) console.error(error);
  };

  const deleteItem = async (id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    const { error } = await supabase.from('items').delete().eq('id', id);
    if (error) console.error(error);
  };

  const addItem = async (item) => {
    setItems((prev) => [...prev, item]);
    const { error } = await supabase.from('items').insert([item]);
    if (error) console.error(error);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-gray-400 text-sm">Carregando estoque...</div>;
  }

  if (screen === 'select') {
    return (
      <div className="max-w-sm mx-auto flex flex-col gap-4 py-8 px-4">
        <div className="flex flex-col items-center gap-3 mb-4">
          <img
            src="/logo.png"
            alt="Armário de limpeza"
            className="w-40 h-auto rounded-xl shadow-sm object-cover"
          />
          <h1 className="text-xl font-semibold text-gray-800">Estoque da dispensa</h1>
          <p className="text-sm text-gray-400 text-center">Escolha como você quer entrar</p>
        </div>

        {errorMsg && (
          <p className="text-xs text-red-500 text-center bg-red-50 rounded-lg p-2">{errorMsg}</p>
        )}

        <button
          onClick={() => {
            setRole('user');
            setScreen('main');
          }}
          className="flex items-center gap-3 border border-gray-300 rounded-xl p-4 active:scale-95 bg-white"
        >
          <User size={22} className="text-gray-600" />
          <div className="text-left">
            <p className="font-medium text-gray-800">Usuário</p>
            <p className="text-xs text-gray-400">Ver estoque e registrar uso</p>
          </div>
        </button>
        <button
          onClick={() => {
            setScreen('pin');
            setPinError('');
            setPinInput('');
          }}
          className="flex items-center gap-3 border border-gray-300 rounded-xl p-4 active:scale-95 bg-white"
        >
          <ShieldCheck size={22} className="text-gray-600" />
          <div className="text-left">
            <p className="font-medium text-gray-800">Administrador</p>
            <p className="text-xs text-gray-400">Gerenciar itens e mínimos</p>
          </div>
        </button>
      </div>
    );
  }

  if (screen === 'pin') {
    return (
      <div className="max-w-sm mx-auto flex flex-col gap-4 py-8 px-4">
        <button onClick={() => setScreen('select')} className="flex items-center gap-1 text-sm text-gray-500 mb-2">
          <ChevronLeft size={16} /> Voltar
        </button>
        <div className="flex flex-col items-center gap-2 mb-2">
          <Lock size={28} className="text-gray-700" />
          <p className="font-medium text-gray-800">Acesso do administrador</p>
        </div>
        <input
          type="password"
          inputMode="numeric"
          placeholder="PIN"
          value={pinInput}
          onChange={(e) => setPinInput(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-center tracking-widest text-lg"
        />
        {pinError && <p className="text-xs text-red-500 text-center">{pinError}</p>}
        <button
          onClick={() => {
            if (pinInput === ADMIN_PIN) {
              setRole('admin');
              setScreen('main');
            } else {
              setPinError('PIN incorreto. Tente novamente.');
            }
          }}
          className="bg-gray-800 text-white rounded-lg py-2 font-medium active:scale-95"
        >
          Entrar
        </button>
      </div>
    );
  }

  const catInfo = CATEGORIES.find((c) => c.key === activeCat);
  const catItems = items.filter((i) => i.category === activeCat);

  return (
    <div className="max-w-sm mx-auto flex flex-col gap-4 py-4 px-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            setScreen('select');
            setRole(null);
            setShowShopping(false);
          }}
          className="flex items-center gap-1 text-sm text-gray-500"
        >
          <ArrowLeft size={16} /> Trocar perfil
        </button>
        <div className="flex items-center gap-2">
          <button onClick={() => loadItems(true)} className="text-gray-400 active:text-gray-700" aria-label="Sincronizar">
            <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
          </button>
          <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
            {role === 'admin' ? 'Administrador' : 'Usuário'}
          </span>
        </div>
      </div>

      {errorMsg && <p className="text-xs text-red-500 text-center bg-red-50 rounded-lg p-2">{errorMsg}</p>}

      {role === 'user' && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-base text-amber-900 leading-relaxed">
          <p className="font-semibold mb-1">Ajuste as quantidades...</p>
          <p>
            de acordo com o que está disponível no armário do salão. Exemplo: se o item <span className="font-semibold">"detergente"</span> está
            faltando, a quantidade informada deve ser <span className="font-semibold">0 (zero)</span>; dessa forma o irmão saberá a quantidade
            que precisa comprar desse item.
          </p>
        </div>
      )}

      {role === 'admin' && (
        <div className="flex gap-2">
          <button
            onClick={() => setShowShopping(false)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium border ${!showShopping ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-300'}`}
          >
            Itens
          </button>
          <button
            onClick={() => setShowShopping(true)}
            className={`flex-1 flex items-center justify-center gap-1 rounded-lg py-2 text-sm font-medium border ${showShopping ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-300'}`}
          >
            <ShoppingCart size={14} /> Comprar
          </button>
        </div>
      )}

      {showShopping && role === 'admin' ? (
        <ShoppingList items={items} />
      ) : role === 'user' ? (
        <GroupedItemList items={items} role={role} onAdjust={adjust} onEditMin={editMin} onDelete={deleteItem} />
      ) : (
        <>
          <button
            onClick={() => setMenuOpen(true)}
            className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 bg-white self-start"
          >
            <Menu size={18} className="text-gray-600" />
            <span className={`text-sm font-medium ${catInfo.text}`}>{catInfo.label}</span>
          </button>

          <div className="flex flex-col gap-3">
            {catItems.map((item) => (
              <ItemCard key={item.id} item={item} role={role} onAdjust={adjust} onEditMin={editMin} onDelete={deleteItem} />
            ))}
            {catItems.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Nenhum item nessa categoria.</p>}
            {role === 'admin' && <AddItemForm category={activeCat} onAdd={addItem} />}
          </div>
        </>
      )}

      {menuOpen && role === 'admin' && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
          <div className="relative w-64 max-w-[80%] h-full bg-white shadow-xl p-4 flex flex-col gap-1 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <p className="font-semibold text-gray-800">Categorias</p>
              <button onClick={() => setMenuOpen(false)} className="text-gray-400" aria-label="Fechar menu">
                <X size={20} />
              </button>
            </div>
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                onClick={() => {
                  setActiveCat(c.key);
                  setMenuOpen(false);
                }}
