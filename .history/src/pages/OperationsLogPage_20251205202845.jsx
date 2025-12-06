import React, { useState } from 'react';
import '../style.css'; 

export function OperationsLogPage() {
    const [registros, setRegistros] = useState([]);
    const [formulario, setFormulario] = useState({
        cliente: '',
        tipo: 'Regra',
        mensagem: ''
    });

    const adicionarRegistro = () => {
        if (formulario.cliente === "" || formulario.mensagem === "") {
            alert("Por favor, preencha o cliente e a mensagem.");
            return;
        }

        const novoRegistro = {
            id: Date.now(),
            dataHora: new Date().toLocaleString(),
            ...formulario
        };

        setRegistros([novoRegistro, ...registros]);
        setFormulario({ ...formulario, cliente: '', mensagem: '' });
    };

    return (
        <div className="container-page">
            <h1 className="page-title">Diário de Operações</h1>

            {/* Formulário */}
            <div className="form-box">
                <h3 style={{ marginTop: 0 }}>Nova Ocorrência / Regra</h3>
                
                <div className="form-group">
                    <label>Cliente / Setor:</label>
                    <input 
                        type="text" 
                        placeholder="Ex: Verdemar, Turno Manhã..."
                        value={formulario.cliente}
                        onChange={(e) => setFormulario({...formulario, cliente: e.target.value})}
                    />
                </div>

                <div className="form-group">
                    <label>Tipo:</label>
                    <select 
                        value={formulario.tipo}
                        onChange={(e) => setFormulario({...formulario, tipo: e.target.value})}
                    >
                        <option value="Regra">Regra Operacional</option>
                        <option value="Erro">Incidente/Erro</option>
                        <option value="Info">Informação Geral</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Descrição:</label>
                    <textarea 
                        rows="3" 
                        placeholder="Detalhe o que aconteceu ou a regra..."
                        value={formulario.mensagem}
                        onChange={(e) => setFormulario({...formulario, mensagem: e.target.value})}
                    />
                </div>

                <button onClick={adicionarRegistro} className="btn-save">
                    Salvar Registro
                </button>
            </div>

            <hr className="divider" style={{ margin: '30px 0', borderTop: '1px solid #ddd' }}/>

            {/* Tabela de Histórico */}
            <h3>Histórico Recente</h3>
            <div style={{ overflowX: 'auto' }}>
                <table className="log-table">
                    <thead>
                        <tr>
                            <th>Data/Hora</th>
                            <th>Cliente</th>
                            <th>Tipo</th>
                            <th>Mensagem</th>
                        </tr>
                    </thead>
                    <tbody>
                        {registros.map((item) => (
                            <tr key={item.id}>
                                <td>{item.dataHora}</td>
                                <td>{item.cliente}</td>
                                <td>
                                    <span className={`badge-log tipo-${item.tipo.toLowerCase()}`}>
                                        {item.tipo}
                                    </span>
                                </td>
                                <td>{item.mensagem}</td>
                            </tr>
                        ))}
                        {registros.length === 0 && (
                            <tr>
                                <td colSpan="4" style={{textAlign: 'center', color: '#888', padding: '20px'}}>
                                    Nenhum registro hoje.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}