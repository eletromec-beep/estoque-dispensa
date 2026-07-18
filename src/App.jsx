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
  Copy,
  Check,
  Package,
  Pencil,
  X,
  ClipboardList,
  AlertTriangle,
} from 'lucide-react';
import { supabase } from './supabaseClient';

const CATEGORIES = [
  { key: 'higiene', label: 'Higiene', border: 'border-blue-400', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', icon: '🧴' },
  { key: 'limpeza', label: 'Limpeza', border: 'border-green-400', bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500', icon: '🧹' },
  { key: 'materiais', label: 'Materiais', border: 'border-amber-400', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', icon: '🔧' },
  { key: 'descartaveis', label: 'Descartáveis', border: 'border-purple-400', bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500', icon: '🧻' },
];

const DEFAULT_ITEMS = [
  { id: 'h1', name: 'Papel higiênico', category: 'higiene', unit: 'rolo', current: 4, min: 8, version: 1 },
  { id: 'h2', name: 'Sabonete', category: 'higiene', unit: 'unidade', current: 2, min: 4, version: 1 },
  { id: 'l1', name: 'Detergente', category: 'limpeza', unit: 'unidade', current: 1, min: 3, version: 1 },
  { id: 'l2', name: 'Água sanitária', category: 'limpeza', unit: 'litro', current: 2, min: 2, version: 1 },
  { id: 'l3', name: 'Desinfetante', category: 'limpeza', unit: 'unidade', current: 0, min: 2, version: 1 },
  { id: 'l4', name: 'Álcool em gel', category: 'limpeza', unit: 'unidade', current: 1, min: 3, version: 1 },
  { id: 'm1', name: 'Rodo', category: 'materiais', unit: 'unidade', current: 1, min: 1, version: 1 },
  { id: 'm2', name: 'Pano de chão', category: 'materiais', unit: 'unidade', current: 1, min: 3, version: 1 },
  { id: 'm3', name: 'Vassoura', category: 'materiais', unit: 'unidade', current: 1, min: 1, version: 1 },
  { id: 'm4', name: 'Pá de lixo', category: 'materiais', unit: 'unidade', current: 1, min: 1, version: 1 },
  { id: 'd1', name: 'Copo descartável', category: 'descartaveis', unit: 'pacote', current: 1, min: 3, version: 1 },
  { id: 'd2', name: 'Papel toalha', category: 'descartaveis', unit: 'rolo', current: 1, min: 4, version: 1 },
];

function need(item) {
  return Math.max(0, item.min - item.current);
}

function formatTimeAgo(date) {
  if (!date) return '';
  const now = new Date();
  const diff = Math.floor((now - new Date(date)) / 1000);

  if (diff < 60) return 'agora';
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)} h`;
  return `há ${Math.floor(diff / 86400)} d`;
}

function StockBar({ item }) {
  const pct = item.min > 0 ? Math.min(100, Math.round((item.current / item.min) * 100)) : 100;
  const low = need(item) > 0;
  return (
    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-300 ${low ? 'bg-red-400' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function ItemCard({ item, role, onAdjust, onEditMin, onDelete, onUpdateItem }) {
  const cat = CATEGORIES.find((c) => c.key === item.category);
  const missing = need(item);
  const isUser = role === 'user';
  const isAdmin = role === 'admin';
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(item.name);
  const [editUnit, setEditUnit] = useState(item.unit);
  const [editCategory, setEditCategory] = useState(item.category);
  const [editMin, setEditMin] = useState(item.min);
  const [editError, setEditError] = useState('');
  const [conflictWarning, setConflictWarning] = useState(false);

  const handleStartEdit = () => {
    setEditName(item.name);
    setEditUnit(item.unit);
    setEditCategory(item.category);
    setEditMin(item.min);
    setEditError('');
    setConflictWarning(false);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditError('');
    setConflictWarning(false);
  };

  const handleSaveEdit = () => {
    if (!editName.trim()) {
      setEditError('O nome do item é obrigatório.');
      return;
    }

    const changes = {
      name: editName.trim(),
      unit: editUnit.trim() || 'unidade',
      category: editCategory,
      min: Math.max(0, editMin),
      version: item.version,
    };

    onUpdateItem(item.id, changes);
    setIsEditing(false);
    setEditError('');
    setConflictWarning(false);
  };

  useEffect(() => {
    if (item.updated_at) {
      const updated = new Date(item.updated_at);
      const now = new Date();
      const diffMinutes = Math.floor((now - updated) / 60000);

      if (diffMinutes < 5 && diffMinutes > 0) {
        setConflictWarning(true);
        setTimeout(() => setConflictWarning(false), 10000);
      }
    }
  }, [item.updated_at]);

  if (isEditing && isAdmin) {
    return (
      <div className={`border-2 ${cat.border} bg-white rounded-xl shadow-sm p-4 flex flex-col gap-3`}>
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-semibold text-gray-700">Editar item</p>
          <button onClick={handleCancelEdit} className="text-gray-400 hover:text-gray-600" aria-label="Cancelar edição">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-gray-500">Nome</label>
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="border-2 border-gray-300 rounded-lg px-3 py-2 text-base focus:border-gray-500 focus:outline-none"
            placeholder="Nome do item"
          />
        </div>

        <div className="flex gap-2">
          <div className="flex-1 flex flex-col gap-2">
            <label className="text-xs font-medium text-gray-500">Unidade</label>
            <input
              type="text"
              value={editUnit}
              onChange={(e) => setEditUnit(e.target.value)}
              className="border-2 border-gray-300 rounded-lg px-3 py-2 text-base focus:border-gray-500 focus:outline-none"
              placeholder="Unidade"
            />
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <label className="text-xs font-medium text-gray-500">Mínimo</label>
            <input
              type="number"
              min="0"
              value={editMin}
              onChange={(e) => setEditMin(Math.max(0, parseInt(e.target.value) || 0))}
              className="border-2 border-gray-300 rounded-lg px-3 py-2 text-base font-mono focus:border-gray-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-gray-500">Categoria</label>
          <select
            value={editCategory}
            onChange={(e) => setEditCategory(e.target.value)}
            className="border-2 border-gray-300 rounded-lg px-3 py-2 text-base focus:border-gray-500 focus:outline-none bg-white"
          >
            {CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {editError && <p className="text-xs text-red-600 bg-red-50 rounded-lg p-2">{editError}</p>}

        <div className="flex gap-2 mt-1">
          <button
            onClick={handleCancelEdit}
            className="flex-1 border-2 border-gray-300 text-gray-700 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50 active:scale-95 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleSaveEdit}
            className="flex-1 bg-gray-800 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-700 active:scale-95 transition-all"
          >
            Salvar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`border-l-4 ${cat.border} bg-white rounded-xl shadow-sm p-4 flex flex-col gap-2 hover:shadow-md transition-shadow relative`}>
      {conflictWarning && !isUser && (
        <div className="absolute -top-2 -right-2 bg-amber-400 text-white rounded-full p-1 shadow-lg" title="Atualizado recentemente">
          <AlertTriangle size={14} />
        </div>
      )}

      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="font-semibold text-gray-800 leading-tight text-base">{item.name}</p>
          <p className="text-sm text-gray-500">{item.unit}</p>
        </div>
        {!isUser && (
          <div className="flex flex-col items-end gap-1">
            {missing > 0 ? (
              <span className="text-sm font-medium bg-red-50 text-red-600 px-3 py-1.5 rounded-full whitespace-nowrap ml-2">
                Faltam {missing}
              </span>
            ) : (
              <span className="text-sm font-medium bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full whitespace-nowrap ml-2">OK</span>
            )}
            {item.updated_at && (
              <span className="text-xs text-gray-400" title={new Date(item.updated_at).toLocaleString('pt-BR')}>
                {formatTimeAgo(item.updated_at)}
              </span>
            )}
          </div>
        )}
      </div>

      <StockBar item={item} />

      {isUser && (
        <p className="text-sm text-gray-500">
          Mínimo: <span className="font-semibold text-gray-700">{item.min}</span> {item.unit}
          {item.min !== 1 ? 's' : ''}
        </p>
      )}

      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onAdjust(item.id, -1)}
            className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-gray-300 text-gray-600 active:scale-95 hover:border-gray-400 hover:bg-gray-50 transition-all"
            aria-label="Diminuir estoque"
          >
            <Minus size={20} />
          </button>
          <span className="font-mono text-xl font-bold text-gray-800 w-10 text-center">{item.current}</span>
          <button
            onClick={() => onAdjust(item.id, 1)}
            className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-gray-300 text-gray-600 active:scale-95 hover:border-gray-400 hover:bg-gray-50 transition-all"
            aria-label="Aumentar estoque"
          >
            <Plus size={20} />
          </button>
        </div>

        {!isUser && (
          <div className="flex items-center gap-1.5">
            {isAdmin && (
              <>
                <button onClick={handleStartEdit} className="text-gray-400 hover:text-blue-500 active:text-blue-600 p-1" aria-label="Editar item">
                  <Pencil size={16} />
                </button>
                <button onClick={() => onDelete(item.id)} className="text-gray-400 hover:text-red-500 active:text-red-600 p-1" aria-label="Remover item">
                  <Trash2 size={16} />
                </button>
                <div className="flex items-center gap-1 text-sm text-gray-500 ml-2">
                  <span>Mín.</span>
                  <input
                    type="number"
                    min="0"
                    value={item.min}
                    onChange={(e) => onEditMin(item.id, Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-16 border-2 border-gray-300 rounded-lg px-2 py-1 font-mono text-center focus:border-gray-500 focus:outline-none"
                  />
                </div>
              </>
            )}
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
    onAdd({
      id: `${category}-${Date.now()}`,
      name: name.trim(),
      category,
      unit,
      current: 0,
      min: Math.max(0, min),
      version: 1,
    });
    setName('');
    setUnit('unidade');
    setMin(1);
  };

  const cat = CATEGORIES.find((c) => c.key === category);

  return (
    <div className={`border-2 border-dashed ${cat.border} rounded-xl p-4 flex flex-col gap-3 bg-gray-50`}>
      <input
        type="text"
        placeholder="Nome do item"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="border-2 border-gray-300 rounded-lg px-3 py-2.5 text-base focus:border-gray-500 focus:outline-none"
      />
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Unidade"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          className="border-2 border-gray-300 rounded-lg px-3 py-2.5 text-base flex-1 focus:border-gray-500 focus:outline-none"
        />
        <input
          type="number"
          min="0"
          placeholder="Mín."
          value={min}
          onChange={(e) => setMin(parseInt(e.target.value) || 0)}
          className="border-2 border-gray-300 rounded-lg px-3 py-2.5 text-base w-24 font-mono focus:border-gray-500 focus:outline-none"
        />
      </div>
      <button onClick={submit} className="bg-gray-800 text-white rounded-lg py-3 text-base font-medium active:scale-95 hover:bg-gray-700 transition-all">
        Adicionar item
      </button>
    </div>
  );
}

function ShoppingList({ items, onMarkAsPurchased }) {
  const toBuy = items.filter((i) => need(i) > 0);
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [purchaseQtys, setPurchaseQtys] = useState({});

  const generateShoppingListText = () => {
    let text = 'Lista de compras — Dispensa\n\n';
    CATEGORIES.forEach((cat) => {
      const catItems = toBuy.filter((i) => i.category === cat.key);
      if (catItems.length === 0) return;
      text += `${cat.label}:\n`;
      catItems.forEach((i) => {
        const qty = need(i);
        text += `• ${i.name}: comprar ${qty} ${i.unit}${qty > 1 ? 's' : ''}\n`;
      });
      text += '\n';
    });
    return text;
  };

  const handleCopyList = async () => {
    const text = generateShoppingListText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  const handleOpenConfirm = () => {
    setPurchaseQtys({});
    setConfirming(true);
  };

  const handleConfirmPurchase = () => {
    const itemsWithQtys = toBuy.map((i) => ({ ...i, purchasedQty: purchaseQtys[i.id] ?? need(i) }));
    onMarkAsPurchased(itemsWithQtys);
    setConfirming(false);
    setPurchaseQtys({});
  };

  const totalItems = toBuy.reduce((sum, item) => sum + need(item), 0);

  if (toBuy.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check size={32} className="text-emerald-500" />
        </div>
        <p className="text-lg font-semibold text-gray-800 mb-1">Estoque em dia!</p>
        <p className="text-sm text-gray-500">Nada precisa ser comprado agora.</p>
      </div>
    );
  }

  if (confirming) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-col gap-4">
        <div>
          <p className="text-base font-semibold text-gray-800">Confirmar quantidades compradas</p>
          <p className="text-sm text-gray-500 mt-1">O número já vem preenchido com a quantidade sugerida. Ajuste se comprou mais ou menos.</p>
        </div>

        <div className="flex flex-col gap-3 max-h-96 overflow-y-auto">
          {toBuy.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 border-b border-gray-100 pb-3">
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                <p className="text-xs text-gray-500">
                  {item.unit} · tinha {item.current}, sugestão: {need(item)}
                </p>
              </div>
              <input
                type="number"
                min="0"
                value={purchaseQtys[item.id] ?? need(item)}
                onChange={(e) =>
                  setPurchaseQtys((prev) => ({ ...prev, [item.id]: Math.max(0, parseInt(e.target.value) || 0) }))
                }
                className="w-20 border-2 border-gray-300 rounded-lg px-2 py-2 text-center font-mono text-base focus:border-gray-500 focus:outline-none"
              />
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setConfirming(false)}
            className="flex-1 border-2 border-gray-300 text-gray-700 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50 active:scale-95 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmPurchase}
            className="flex-1 bg-emerald-500 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-emerald-400 active:scale-95 transition-all"
          >
            Confirmar compra
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-2xl shadow-sm p-5 text-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <ClipboardList size={20} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-white/80">Lista de Compras</p>
              <p className="text-lg font-bold">
                {toBuy.length} {toBuy.length === 1 ? 'item' : 'itens'} para repor
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/60">Total de unidades</p>
            <p className="text-2xl font-bold">{totalItems}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleCopyList}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-all active:scale-95"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copiado!' : 'Copiar lista'}
          </button>
          <button
            onClick={handleOpenConfirm}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 rounded-lg text-sm font-medium transition-all active:scale-95"
          >
            <Package size={16} />
            Marcar como comprado
          </button>
        </div>
      </div>

      {CATEGORIES.map((cat) => {
        const catItems = toBuy.filter((i) => i.category === cat.key);
        if (catItems.length === 0) return null;
        const catTotal = catItems.reduce((sum, item) => sum + need(item), 0);

        return (
          <div key={cat.key} className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className={`${cat.bg} px-4 py-3 flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <span className="text-xl">{cat.icon}</span>
                <div>
                  <p className={`text-sm font-bold ${cat.text}`}>{cat.label}</p>
                  <p className="text-xs text-gray-600">
                    {catItems.length} {catItems.length === 1 ? 'item' : 'itens'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-600">Unidades</p>
                <p className={`text-lg font-bold ${cat.text}`}>{catTotal}</p>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {catItems.map((item) => {
                const qty = need(item);
                const pct = item.min > 0 ? Math.round((item.current / item.min) * 100) : 0;

                return (
                  <div key={item.id} className="px-4 py-3.5 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1">
                        <p className="text-base font-semibold text-gray-800">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.unit}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-800">{qty}</p>
                        <p className="text-xs text-gray-500">
                          {item.unit}
                          {qty > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${pct <= 25 ? 'bg-red-400' : pct <= 50 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-500 w-12 text-right">
                        {item.current}/{item.min}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="text-center text-xs text-gray-400 py-2">Atualize a lista após as compras para manter o controle</div>
    </div>
  );
}

function GroupedItemList({ items, role, onAdjust, onEditMin, onDelete, onUpdateItem }) {
  return (
    <div className="flex flex-col gap-6">
      {CATEGORIES.map((cat) => {
        const catItems = items.filter((i) => i.category === cat.key);
        if (catItems.length === 0) return null;
        return (
          <div key={cat.key}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{cat.icon}</span>
              <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{cat.label}</p>
            </div>
            <div className="flex flex-col gap-3">
              {catItems.map((item) => (
                <ItemCard key={item.id} item={item} role={role} onAdjust={onAdjust} onEditMin={onEditMin} onDelete={onDelete} onUpdateItem={onUpdateItem} />
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
  const [screen, setScreen] = useState('select');
  const [role, setRole] = useState(null);
  const [activeCat, setActiveCat] = useState(CATEGORIES[0].key);
  const [showShopping, setShowShopping] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [lastSync, setLastSync] = useState(null);
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
        const processedData = data.map((item) => ({
          ...item,
          version: item.version || 1,
          updated_at: item.updated_at || new Date().toISOString(),
        }));
        setItems(processedData);
      }
      setLastSync(new Date());
    } catch (e) {
      console.error(e);
      setErrorMsg('Não foi possível conectar ao banco de dados. Verifique as variáveis de ambiente do Supabase.');
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('items-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, () => {
        loadItems(true);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadItems]);

  const adjust = async (id, delta) => {
    const target = items.find((i) => i.id === id);
    if (!target) return;
    const newCurrent = Math.max(0, target.current + delta);

    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, current: newCurrent } : i)));

    const { error } = await supabase
      .from('items')
      .update({ current: newCurrent, version: target.version + 1 })
      .eq('id', id)
      .eq('version', target.version);

    if (error) {
      console.error('Erro ao ajustar:', error);
      loadItems(true);
      setErrorMsg('Conflito detectado. Os dados foram recarregados.');
      setTimeout(() => setErrorMsg(''), 3000);
    }
  };

  const editMin = async (id, value) => {
    const target = items.find((i) => i.id === id);
    if (!target) return;

    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, min: value } : i)));

    const { error } = await supabase
      .from('items')
      .update({ min: value, version: target.version + 1 })
      .eq('id', id)
      .eq('version', target.version);

    if (error) {
      console.error('Erro ao editar mínimo:', error);
      loadItems(true);
      setErrorMsg('Conflito detectado. Os dados foram recarregados.');
      setTimeout(() => setErrorMsg(''), 3000);
    }
  };

  const updateItem = async (id, changes) => {
    const target = items.find((i) => i.id === id);
    if (!target) return;

    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...changes } : item)));

    const { error } = await supabase
      .from('items')
      .update({ ...changes, version: target.version + 1 })
      .eq('id', id)
      .eq('version', target.version);

    if (error) {
      console.error('Erro ao atualizar item:', error);
      loadItems(true);
      setErrorMsg('Conflito detectado. Outro usuário alterou este item. Recarregando...');
      setTimeout(() => setErrorMsg(''), 3000);
    }
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

  const handleMarkAsPurchased = async (itemsToUpdate) => {
    for (const item of itemsToUpdate) {
      const newCurrent = item.current + (item.purchasedQty || 0);
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, current: newCurrent } : i)));

      const { error } = await supabase
        .from('items')
        .update({ current: newCurrent, version: item.version + 1 })
        .eq('id', item.id)
        .eq('version', item.version);

      if (error) {
        console.error('Erro ao marcar como comprado:', error);
        loadItems(true);
        setErrorMsg('Conflito detectado. Os dados foram recarregados.');
        setTimeout(() => setErrorMsg(''), 3000);
        break;
      }
    }
  };

  const formatLastSync = (date) => {
    if (!date) return '';
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-400 text-base">Carregando estoque...</div>
      </div>
    );
  }

  if (screen === 'select') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">
          <div className="flex flex-col items-center gap-4 mb-8">
            <img src="/logo.png" alt="Dispensa Salão do Reino" className="w-32 h-32 rounded-2xl shadow-md object-cover" />
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-800">Dispensa — Salão do Reino</h1>
              <p className="text-base text-gray-500 mt-1">Cong. Santana do Ipanema — AL</p>
            </div>
            <p className="text-sm text-gray-400">Escolha o perfil de acesso</p>
          </div>

          {errorMsg && <p className="text-sm text-red-600 text-center bg-red-50 rounded-xl p-3 mb-4">{errorMsg}</p>}

          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                setRole('user');
                setScreen('main');
              }}
              className="flex items-center gap-4 border-2 border-gray-200 rounded-xl p-5 active:scale-95 hover:border-gray-300 hover:bg-gray-50 bg-white transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <User size={24} className="text-gray-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-800 text-lg">Usuário</p>
                <p className="text-sm text-gray-500">Ver estoque e registrar uso</p>
              </div>
            </button>

            <button
              onClick={() => {
                setScreen('pin');
                setPinError('');
                setPinInput('');
              }}
              className="flex items-center gap-4 border-2 border-gray-200 rounded-xl p-5 active:scale-95 hover:border-gray-300 hover:bg-gray-50 bg-white transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <ShieldCheck size={24} className="text-gray-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-800 text-lg">Administrador</p>
                <p className="text-sm text-gray-500">Gerenciar itens e mínimos</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'pin') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8 flex flex-col gap-4">
          <button onClick={() => setScreen('select')} className="flex items-center gap-1 text-sm text-gray-500 mb-1 self-start">
            <ChevronLeft size={16} /> Voltar
          </button>
          <div className="flex flex-col items-center gap-3 mb-1">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
              <Lock size={24} className="text-gray-700" />
            </div>
            <p className="font-semibold text-gray-800 text-lg">Acesso do administrador</p>
          </div>
          <input
            type="password"
            inputMode="numeric"
            placeholder="PIN"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            className="border-2 border-gray-300 rounded-xl px-3 py-3 text-center tracking-widest text-xl focus:border-gray-500 focus:outline-none"
          />
          {pinError && <p className="text-sm text-red-500 text-center">{pinError}</p>}
          <button
            onClick={() => {
              if (pinInput === ADMIN_PIN) {
                setRole('admin');
                setScreen('main');
              } else {
                setPinError('PIN incorreto. Tente novamente.');
              }
            }}
            className="bg-gray-800 text-white rounded-xl py-3 font-medium text-base active:scale-95 hover:bg-gray-700 transition-all"
          >
            Entrar
          </button>
        </div>
      </div>
    );
  }

  const catItems = items.filter((i) => i.category === activeCat);

  return (
    <div className="min-h-screen bg-gray-100">
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
            <button
              onClick={() => loadItems(true)}
              className="w-9 h-9 flex items-center justify-center text-gray-400 active:text-gray-700"
              aria-label="Sincronizar"
            >
              <RefreshCw size={17} className={syncing ? 'animate-spin' : ''} />
            </button>
            <span className="text-xs font-medium bg-gray-200 text-gray-600 px-2.5 py-1 rounded-full">
              {role === 'admin' ? 'Administrador' : 'Usuário'}
            </span>
          </div>
        </div>

        {lastSync && !errorMsg && <p className="text-xs text-gray-400 -mt-2">Atualizado às {formatLastSync(lastSync)}</p>}

        {errorMsg && <p className="text-sm text-red-600 text-center bg-red-50 rounded-xl p-3">{errorMsg}</p>}

        {role === 'user' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-900">
            Informe a quantidade real disponível no armário. Se acabou, deixe como 0.
          </div>
        )}

        {role === 'admin' && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowShopping(false)}
              className={`flex-1 rounded-xl py-2.5 text-sm font-medium border-2 transition-all ${!showShopping ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-300'}`}
            >
              Itens
            </button>
            <button
              onClick={() => setShowShopping(true)}
              className={`flex-1 flex items-center justify-center gap-1 rounded-xl py-2.5 text-sm font-medium border-2 transition-all ${showShopping ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-300'}`}
            >
              <ShoppingCart size={14} /> Comprar
            </button>
          </div>
        )}

        {role === 'admin' && !showShopping && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                onClick={() => setActiveCat(c.key)}
                className={`whitespace-nowrap flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-full border-2 transition-all ${
                  activeCat === c.key ? `${c.bg} ${c.text} border-current` : 'bg-white text-gray-500 border-gray-300'
                }`}
              >
                <span>{c.icon}</span>
                {c.label}
              </button>
            ))}
          </div>
        )}

        {showShopping && role === 'admin' ? (
          <ShoppingList items={items} onMarkAsPurchased={handleMarkAsPurchased} />
        ) : role === 'user' ? (
          <GroupedItemList items={items} role={role} onAdjust={adjust} onEditMin={editMin} onDelete={deleteItem} onUpdateItem={updateItem} />
        ) : (
          <div className="flex flex-col gap-3">
            {catItems.map((item) => (
              <ItemCard key={item.id} item={item} role={role} onAdjust={adjust} onEditMin={editMin} onDelete={deleteItem} onUpdateItem={updateItem} />
            ))}
            {catItems.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Nenhum item nessa categoria.</p>}
            {role === 'admin' && <AddItemForm category={activeCat} onAdd={addItem} />}
          </div>
        )}
      </div>
    </div>
  );
}
