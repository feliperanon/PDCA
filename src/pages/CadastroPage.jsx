import React, { useState, useEffect, useMemo } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, serverTimestamp, setDoc, getDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import * as XLSX from 'xlsx';
import { Users, Truck, Settings, Hammer, Building2, X, Plus, Trash2, Search, Edit, Plane, Stethoscope, CheckCircle, UserMinus, ArrowUpDown, Filter } from 'lucide-react';

export function CadastroPage() {
    const [selectedCategory, setSelectedCategory] = useState('employees');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editData, setEditData] = useState(null);

    const categories = [
        { id: 'employees', title: 'Colaboradores', icon: <Users size={28} />, color: '#3b82f6', listComp: EmployeeList, formComp: EmployeeForm },
        { id: 'machines', title: 'Máquinas', icon: <Hammer size={28} />, color: '#f59e0b', listComp: GenericList, formComp: GenericForm },
        { id: 'processes', title: 'Processos', icon: <Settings size={28} />, color: '#6366f1', listComp: GenericList, formComp: GenericForm },
        { id: 'clients', title: 'Clientes', icon: <Building2 size={28} />, color: '#10b981', listComp: GenericList, formComp: GenericForm },
        { id: 'suppliers', title: 'Fornecedores', icon: <Truck size={28} />, color: '#ef4444', listComp: GenericList, formComp: GenericForm },
    ];

    const activeCat = categories.find(c => c.id === selectedCategory) || categories[0];

    const handleIconClick = (id) => {
        setSelectedCategory(id);
        setEditData(null);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditData(null);
    }

    return (
        <div className="page" style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '50px' }}>
            {/* --- HUB ICONS (NO TEXT) --- */}
            <div className="hub-grid-minimal">
                {categories.map((cat) => (
                    <div
                        key={cat.id}
                        className={`hub-card-minimal ${selectedCategory === cat.id ? 'active' : ''}`}
                        onClick={() => handleIconClick(cat.id)}
                        title={`Novo Cadastro: ${cat.title}`}
                    >
                        <div style={{ color: cat.color }}>{cat.icon}</div>
                    </div>
                ))}
            </div>

            {/* --- MAIN CONTENT (LIST) --- */}
            <div style={{ marginTop: '20px' }}>
                <activeCat.listComp
                    onEdit={(item) => {
                        setEditData(item);
                        setIsModalOpen(true);
                    }}
                />
            </div>

            {/* --- FLOATING MODAL (FORM) --- */}
            {isModalOpen && (
                <ModalOverlay onClose={closeModal} title={editData ? `Editar ${activeCat.title}` : `Novo Cadastro: ${activeCat.title}`}>
                    <activeCat.formComp
                        onClose={closeModal}
                        initialData={editData}
                    />
                </ModalOverlay>
            )}

            <style>{`
        .hub-grid-minimal {
           display: flex;
           justify-content: center;
           gap: 15px;
           margin-bottom: 20px;
        }
        .hub-card-minimal {
           width: 60px;
           height: 60px;
           background: white;
           border-radius: 50%;
           display: flex;
           align-items: center;
           justify-content: center;
           box-shadow: 0 4px 6px rgba(0,0,0,0.05);
           border: 2px solid transparent;
           cursor: pointer;
           transition: all 0.2s;
        }
        .hub-card-minimal:hover {
           transform: translateY(-3px) scale(1.1);
           box-shadow: 0 10px 15px rgba(0,0,0,0.1);
        }
        .hub-card-minimal.active {
           border-color: #3b82f6;
           background: #eff6ff;
        }
      `}</style>
        </div>
    );
}

function ModalOverlay({ children, onClose, title }) {
    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000,
            display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px'
        }}>
            <div style={{
                background: '#fff', width: '800px', maxWidth: '95%', maxHeight: '90vh',
                borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                display: 'flex', flexDirection: 'column', overflow: 'hidden'
            }}>
                <div style={{
                    padding: '20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <h2 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>{title}</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                        <X size={24} />
                    </button>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '30px' }}>
                    {children}
                </div>
            </div>
        </div>
    );
}

// ------------------------------------------------------------------
// EMPLOYEE COMPONENTS
// ------------------------------------------------------------------

function EmployeeForm({ onClose, initialData }) {
    const [formData, setFormData] = useState({
        matricula: '', nome: '', admissao: '', centroCusto: '', funcao: '', nascimento: '',
        status: 'ativo'
    });

    useEffect(() => {
        if (initialData) setFormData(initialData);
    }, [initialData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.nome) return alert("Nome é obrigatório");

        try {
            if (initialData?.id) {
                await updateDoc(doc(db, "employees", initialData.id), formData);
                alert("Atualizado com sucesso!");
            } else {
                await addDoc(collection(db, "employees"), {
                    ...formData,
                    createdAt: serverTimestamp()
                });
                alert("Cadastrado com sucesso!");
            }
            onClose();
            window.dispatchEvent(new Event('employee-update'));
        } catch (err) {
            console.error(err);
            alert("Erro ao salvar.");
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="form-group">
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#64748b' }}>Matrícula</label>
                <input className="input-field" value={formData.matricula} onChange={e => setFormData({ ...formData, matricula: e.target.value })} placeholder="0000" />
            </div>
            <div className="form-group">
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#64748b' }}>Centro de Custo</label>
                <input className="input-field" value={formData.centroCusto} onChange={e => setFormData({ ...formData, centroCusto: e.target.value })} placeholder="Ex: Operação" />
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#64748b' }}>Nome do Colaborador *</label>
                <input className="input-field" value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} required />
            </div>
            <div className="form-group">
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#64748b' }}>Cargo / Função</label>
                <input className="input-field" value={formData.funcao} onChange={e => setFormData({ ...formData, funcao: e.target.value })} />
            </div>
            <div className="form-group">
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#64748b' }}>Data Admissão</label>
                <input type="date" className="input-field" value={formData.admissao} onChange={e => setFormData({ ...formData, admissao: e.target.value })} />
            </div>
            <div className="form-group">
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#64748b' }}>Data Nascimento (Aniversário)</label>
                <input type="date" className="input-field" value={formData.nascimento} onChange={e => setFormData({ ...formData, nascimento: e.target.value })} />
            </div>

            <div style={{ gridColumn: '1/-1', display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary">Salvar</button>
            </div>
        </form>
    )
}

function StaffDashboard({ employees }) {
    const [targets, setTargets] = useState({ geral: 0, manha: 0, tarde: 0, noite: 0 });
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        const fetchTargets = async () => {
            const docRef = doc(db, "settings", "staff_targets");
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setTargets(docSnap.data());
            }
        };
        fetchTargets();
    }, []);

    const saveTargets = async () => {
        await setDoc(doc(db, "settings", "staff_targets"), targets, { merge: true });
        setIsEditing(false);
    };

    // Calculate Actuals
    const activeEmployees = employees.filter(e => e.status === 'ativo' || !e.status); // Only active count for Headcount? Or all? Usually Active.

    // Helper to detect shift
    const getShift = (cc) => {
        const lower = (cc || "").toLowerCase();
        if (lower.includes('manh')) return 'manha';
        if (lower.includes('tarde')) return 'tarde';
        if (lower.includes('noite')) return 'noite';
        return 'outros';
    };

    const actuals = {
        geral: activeEmployees.length,
        manha: activeEmployees.filter(e => getShift(e.centroCusto) === 'manha').length,
        tarde: activeEmployees.filter(e => getShift(e.centroCusto) === 'tarde').length,
        noite: activeEmployees.filter(e => getShift(e.centroCusto) === 'noite').length,
    };

    return (
        <div style={{ marginBottom: '20px', background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#334155' }}>Gestão de Headcount (Vagas)</h3>
                <button
                    onClick={() => isEditing ? saveTargets() : setIsEditing(true)}
                    className="btn-secondary"
                    style={{ fontSize: '12px', height: '28px' }}
                >
                    {isEditing ? 'Salvar Metas' : '⚙️ Definir Metas'}
                </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '15px' }}>
                <StatCard label="Total Geral" targetKey="geral" actuals={actuals} targets={targets} isEditing={isEditing} setTargets={setTargets} />
                <StatCard label="Turno Manhã" targetKey="manha" actuals={actuals} targets={targets} isEditing={isEditing} setTargets={setTargets} />
                <StatCard label="Turno Tarde" targetKey="tarde" actuals={actuals} targets={targets} isEditing={isEditing} setTargets={setTargets} />
                <StatCard label="Turno Noite" targetKey="noite" actuals={actuals} targets={targets} isEditing={isEditing} setTargets={setTargets} />
            </div>
        </div>
    );
}

const StatCard = ({ label, targetKey, actuals, targets, isEditing, setTargets }) => {
    const actual = actuals[targetKey];
    const target = targets[targetKey] || 0;
    const gap = target - actual;
    const gapColor = gap > 0 ? '#ef4444' : '#10b981'; // Red if hiring needed

    return (
        <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', minWidth: '150px' }}>
            <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>{label}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <span style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b' }}>{actual}</span>
                    <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '4px' }}>/ {target}</span>
                </div>
                {isEditing ? (
                    <input
                        type="number"
                        value={targets[targetKey]}
                        onChange={(e) => setTargets(prev => ({ ...prev, [targetKey]: Number(e.target.value) }))}
                        style={{ width: '50px', padding: '2px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                    />
                ) : (
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: gapColor, background: gapColor + '20', padding: '2px 6px', borderRadius: '4px' }}>
                        {gap > 0 ? `+${gap} Vagas` : 'Ok'}
                    </div>
                )}
            </div>
        </div>
    );
};

function EmployeeList({ onEdit }) {
    const [employees, setEmployees] = useState([]);
    const [filter, setFilter] = useState("");
    const [shiftFilter, setShiftFilter] = useState("todos"); // todos, manha, tarde, noite
    const [sortConfig, setSortConfig] = useState({ key: 'nome', direction: 'asc' });

    const fetchEmployees = async () => {
        const snap = await getDocs(collection(db, "employees"));
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        // Default sort
        setEmployees(list);
    };

    useEffect(() => {
        fetchEmployees();
        window.addEventListener('employee-update', fetchEmployees);
        return () => window.removeEventListener('employee-update', fetchEmployees);
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Excluir permanentemente?")) return;
        await deleteDoc(doc(db, "employees", id));
        fetchEmployees();
    };

    const updateStatus = async (emp, status) => {
        const newStatus = emp.status === status ? 'ativo' : status;
        await updateDoc(doc(db, "employees", emp.id), { status: newStatus });
        fetchEmployees();
    };

    // --- IMPORT LOGIC (UPSERT) ---
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const wb = XLSX.read(evt.target.result, { type: 'binary' });
                const sheetName = wb.SheetNames[0];
                const rawData = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 });

                if (rawData.length === 0) return alert("Planilha vazia.");

                // Header Detection
                let headerRowIndex = -1;
                for (let i = 0; i < Math.min(rawData.length, 10); i++) {
                    const rowStr = JSON.stringify(rawData[i]).toLowerCase();
                    if (rowStr.includes("colaborador") || rowStr.includes("nome") || rowStr.includes("matricula")) {
                        headerRowIndex = i;
                        break;
                    }
                }

                if (headerRowIndex === -1) return alert("Cabeçalho não encontrado.");

                const headers = rawData[headerRowIndex].map(h => String(h).trim());
                const dataRows = rawData.slice(headerRowIndex + 1);

                if (!window.confirm(`Processar ${dataRows.length} linhas?`)) return;

                let stats = { created: 0, updated: 0, skipped: 0 };

                // Get current DB snapshot for upsert check (Optimize with map)
                const snap = await getDocs(collection(db, "employees"));
                const existingMap = new Map();
                snap.docs.forEach(d => {
                    const data = d.data();
                    if (data.matricula) existingMap.set(String(data.matricula), d.id);
                });

                for (let rowArray of dataRows) {
                    if (!rowArray || rowArray.length === 0) continue;
                    const rowObj = {};
                    headers.forEach((h, index) => rowObj[h] = rowArray[index]);

                    const norm = {};
                    Object.keys(rowObj).forEach(k => {
                        const clean = k.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                        norm[clean] = rowObj[k];
                    });

                    const nome = norm['colaborador'] || norm['nome'] || norm['name'] || norm['funcionario'];
                    if (!nome) { stats.skipped++; continue; }

                    const matricula = String(norm['matricula'] || norm['id'] || "");
                    const centroCusto = norm['centro de custo'] || norm['cc'] || "";
                    const funcao = norm['cargo'] || norm['funcao'] || "";

                    const parseDate = (val) => {
                        if (!val) return "";
                        if (val instanceof Date) return val.toISOString().split('T')[0];
                        if (typeof val === 'number') {
                            const date = new Date(Math.round((val - 25569) * 86400 * 1000));
                            return date.toISOString().split('T')[0];
                        }
                        return String(val).trim();
                    };

                    const admissao = parseDate(norm['data admissao'] || norm['admissao'] || norm['datadeadmissao']);
                    const nascimento = parseDate(
                        norm['aniversario'] ||
                        norm['nascimento'] ||
                        norm['data nascimento'] ||
                        norm['datadenascimento'] ||
                        norm['data de nascimento'] ||
                        norm['dtnasc']
                    );

                    const docData = {
                        matricula, nome, admissao, centroCusto, funcao, nascimento,
                        // Only set status if new, otherwise keep existing
                    };

                    // Upsert Logic
                    if (matricula && existingMap.has(matricula)) {
                        // Update
                        const docId = existingMap.get(matricula);
                        await updateDoc(doc(db, "employees", docId), docData);
                        stats.updated++;
                    } else {
                        // Create
                        await addDoc(collection(db, "employees"), {
                            ...docData,
                            status: 'ativo',
                            createdAt: serverTimestamp()
                        });
                        stats.created++;
                    }
                }

                fetchEmployees();
                alert(`Concluído! Criados: ${stats.created}, Atualizados: ${stats.updated}, Ignorados: ${stats.skipped}`);

            } catch (err) {
                console.error(err);
                alert("Erro: " + err.message);
            }
        };
        reader.readAsBinaryString(file);
    };

    function formatDate(d) {
        if (!d) return "-";
        const parts = d.split('-');
        if (parts.length < 3) return d;
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    function formatCC(cc) {
        if (!cc) return "-";
        return cc.replace(/EXPEDI[CÇ][AÃ]O\s*/i, "").trim() || cc;
    }

    // --- SORTING & FILTERING ---
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedFilteredEmployees = useMemo(() => {
        let data = [...employees];

        // 1. Filter Text
        if (filter) {
            data = data.filter(e =>
                (e.nome || "").toLowerCase().includes(filter.toLowerCase()) ||
                (e.matricula || "").includes(filter)
            );
        }

        // 2. Filter Shift
        if (shiftFilter !== 'todos') {
            data = data.filter(e => {
                const shift = ((e.centroCusto || "").toLowerCase().match(/manha|tarde|noite/) || [])[0];
                return shift === shiftFilter;
            });
        }

        // 3. Sort
        data.sort((a, b) => {
            const aVal = a[sortConfig.key] || "";
            const bVal = b[sortConfig.key] || "";
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return data;
    }, [employees, filter, shiftFilter, sortConfig]);

    return (
        <div>
            {/* NEW STAFF DASHBOARD */}
            <StaffDashboard employees={employees} />

            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <div style={{ padding: '15px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>

                    {/* SEARCH */}
                    <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            placeholder="Buscar por nome ou matrícula..."
                            value={filter}
                            onChange={e => setFilter(e.target.value)}
                            style={{ width: '100%', padding: '10px 10px 10px 35px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                        />
                    </div>

                    {/* SHIFT FILTER */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Filter size={18} color="#64748b" />
                        <select
                            value={shiftFilter}
                            onChange={e => setShiftFilter(e.target.value)}
                            style={{ padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', color: '#475569' }}
                        >
                            <option value="todos">Todos os Turnos</option>
                            <option value="manha">Manhã</option>
                            <option value="tarde">Tarde</option>
                            <option value="noite">Noite</option>
                        </select>
                    </div>

                    <div style={{ position: 'relative', overflow: 'hidden', display: 'inline-block' }}>
                        <button className="btn-secondary">📤 Importar Excel</button>
                        <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} style={{ position: 'absolute', left: 0, top: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
                    </div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc', color: '#64748b', textAlign: 'left' }}>
                            <th onClick={() => handleSort('matricula')} style={{ padding: '15px', cursor: 'pointer' }}>Matrícula <ArrowUpDown size={12} /></th>
                            <th onClick={() => handleSort('nome')} style={{ padding: '15px', cursor: 'pointer' }}>Colaborador <ArrowUpDown size={12} /></th>
                            <th style={{ padding: '15px' }}>Data Admissão</th>
                            <th style={{ padding: '15px' }}>Centro de Custo</th>
                            <th style={{ padding: '15px' }}>Cargo</th>
                            <th style={{ padding: '15px' }}>Aniversário</th>
                            <th style={{ padding: '15px', textAlign: 'right' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedFilteredEmployees.map(emp => {
                            const isAfastado = emp.status === 'afastado';
                            const isFerias = emp.status === 'ferias';
                            const isDemitido = emp.status === 'demitido';

                            let bg = 'white';
                            if (isFerias) bg = '#fffbeb';
                            if (isAfastado) bg = '#f1f5f9';
                            if (isDemitido) bg = '#fee2e2';

                            return (
                                <tr key={emp.id} style={{ borderBottom: '1px solid #f1f5f9', background: bg, color: (isAfastado || isDemitido) ? '#94a3b8' : 'inherit' }}>
                                    <td style={{ padding: '15px', color: '#475569' }}>{emp.matricula}</td>
                                    <td style={{ padding: '15px', fontWeight: '600', color: (isAfastado || isDemitido) ? '#94a3b8' : '#1e293b' }}>
                                        {emp.nome}
                                        {isAfastado && <span className="badge-status badge-gray">Afastado</span>}
                                        {isFerias && <span className="badge-status badge-yellow">Férias</span>}
                                        {isDemitido && <span className="badge-status badge-red">Demitido</span>}
                                    </td>
                                    <td style={{ padding: '15px' }}>{formatDate(emp.admissao)}</td>
                                    <td style={{ padding: '15px' }}>{formatCC(emp.centroCusto)}</td>
                                    <td style={{ padding: '15px' }}>{emp.funcao}</td>
                                    <td style={{ padding: '15px' }}>{formatDate(emp.nascimento)}</td>
                                    <td style={{ padding: '15px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                        <button title="Editar" onClick={() => onEdit(emp)} className="action-btn"><Edit size={16} /></button>
                                        <button title="Marcar Férias" onClick={() => updateStatus(emp, 'ferias')} className={`action-btn ${isFerias ? 'active active-yellow' : ''}`}><Plane size={16} /></button>
                                        <button title="Marcar Afastado" onClick={() => updateStatus(emp, 'afastado')} className={`action-btn ${isAfastado ? 'active active-gray' : ''}`}><Stethoscope size={16} /></button>
                                        <button title="Marcar Demitido" onClick={() => updateStatus(emp, 'demitido')} className={`action-btn ${isDemitido ? 'active active-red' : ''}`}><UserMinus size={16} /></button>
                                        <button title="Excluir" onClick={() => handleDelete(emp.id)} className="action-btn text-red"><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
                {sortedFilteredEmployees.length === 0 && <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>Nenhum colaborador encontrado.</div>}

                <style>{`
            .input-field { width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; }
            .badge-status { font-size: 10px; padding: 2px 6px; border-radius: 10px; margin-left: 8px; text-transform: uppercase; font-weight: bold; }
            .badge-red { background: #fee2e2; color: #ef4444; }
            .badge-yellow { background: #fef3c7; color: #d97706; }
            .badge-gray { background: #e2e8f0; color: #64748b; }
            .action-btn { border: 1px solid #e2e8f0; background: white; border-radius: 6px; width: 32px; height: 32px; display: flex; alignItems: center; justifyContent: center; cursor: pointer; color: #64748b; transition: all 0.2s; }
            .action-btn:hover { background: #f1f5f9; color: #3b82f6; }
            .action-btn.text-red:hover { color: #ef4444; background: #fee2e2; }
            .action-btn.active-yellow { background: #fef3c7; color: #d97706; border-color: #fcd34d; }
            .action-btn.active-gray { background: #e2e8f0; color: #64748b; border-color: #cbd5e1; }
            .action-btn.active-red { background: #fee2e2; color: #ef4444; border-color: #fca5a5; }
         `}</style>
            </div>
        </div>
    )
}


// ------------------------------------------------------------------
// GENERIC COMPONENTS
// ------------------------------------------------------------------

function GenericForm({ onClose }) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Em construção... <button onClick={onClose}>Fechar</button></div>
}

function GenericList() {
    return <div style={{ padding: '20px', textAlign: 'center', background: 'white', borderRadius: '12px' }}>Selecione uma categoria acima.</div>
}
