import React, { useState, useEffect } from 'react';

// --- ÍCONES SVG (NÃO PRECISA INSTALAR NADA) ---
const IconCheck = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
const IconAlert = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IconTrash = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;
const IconEdit = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>;
const IconX = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IconSave = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;
const IconBrain = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>;

export function OperationsLogPage() {

    // --- 1. CSS (Design Pro Restaurado) ---
    const styles = `
        :root { --primary: #2563eb; --danger: #dc2626; --success: #16a34a; --warning: #eab308; --bg: #f5f7fa; --surface: #ffffff; --text: #1f2937; --border: #e5e7eb; }
        body { font-family: 'Inter', -apple-system, sans-serif; background: var(--bg); color: var(--text); margin: 0; }
        .app-root { max-width: 1000px; margin: 0 auto; padding: 20px; }
        
        /* Morning Call */
        .morning-alert { background: #fff7ed; border: 1px solid #fed7aa; color: #9a3412; padding: 15px; border-radius: 8px; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; animation: fadeIn 0.5s; }
        
        /* Header */
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; background: var(--surface); padding: 20px; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .score-box { text-align: center; }
        .score-value { font-size: 32px; font-weight: bold; display: block; line-height: 1; }
        .score-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888; }

        /* KPIs */
        .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 25px; }
        .kpi-card { background: white; padding: 15px; border-radius: 8px; border: 1px solid #eee; text-align: center; position: relative; overflow: hidden; transition: transform 0.2s; }
        .kpi-card:hover { transform: translateY(-2px); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .kpi-card h3 { margin: 0; font-size: 11px; text-transform: uppercase; color: #666; letter-spacing: 0.5px; }
        .kpi-value { font-size: 24px; font-weight: 700; color: #333; margin-top: 5px; display: block; }
        .kpi-indicator { height: 4px; width: 100%; position: absolute; top: 0; left: 0; }

        /* Grid Principal */
        .main-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-bottom: 25px; }

        /* Input Inteligente (Esquerda) */
        .smart-input-container { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid var(--border); position: relative; display: flex; flex-direction: column; height: 100%; }
        .smart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        .smart-header h3 { margin: 0; font-size: 16px; display: flex; align-items: center; gap: 8px; }
        .main-textarea { width: 100%; border: 2px solid #e5e7eb; border-radius: 8px; padding: 15px; font-size: 16px; outline: none; transition: border 0.2s; resize: vertical; min-height: 120px; flex-grow: 1; }
        .main-textarea:focus { border-color: var(--primary); }
        .btn-magic { background: #111827; color: white; padding: 12px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; border: none; margin-top: 15px; width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; transition: background 0.2s; }
        .btn-magic:hover { background: #000; }
        .editing-badge { background: #fef08a; color: #854d0e; font-size: 10px; padding: 2px 6px; border-radius: 4px; border: 1px solid #fde047; }

        /* Painel Inteligência (Direita) - Restaurado */
        .intelligence-card { background: white; padding: 20px; border-radius: 12px; border: 1px solid var(--border); box-shadow: 0 2px 4px rgba(0,0,0,0.05); display: flex; flex-direction: column; }
        .intelligence-header { display: flex; align-items: center; gap: 8px; margin-bottom: 15px; color: #374151; font-weight: 600; }
        .alert-box { padding: 15px; border-radius: 8px; font-size: 13px; line-height: 1.5; margin-bottom: 15px; }
        .alert-critical { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
        .alert-clean { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
        .btn-pdca-auto { background: var(--danger); color: white; border: none; padding: 10px; border-radius: 6px; width: 100%; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 5px; }
        .btn-pdca-auto:hover { background: #b91c1c; }
        .history-stat { margin-top: auto; font-size: 12px; color: #9ca3af; text-align: center; border-top: 1px solid #f3f4f6; padding-top: 10px; }

        /* Timeline */
        .timeline-card { background: white; border-radius: 12px; border: 1px solid var(--border); overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th { text-align: left; padding: 12px 15px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: 600; }
        td { padding: 12px 15px; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }
        tr:hover { background: #f9fafb; }
        .badge { padding: 4px 10px; border-radius: 99px; font-weight: 700; font-size: 10px; color: white; display: inline-block; text-transform: uppercase; }
        .badge-Erro { background: var(--danger); } .badge-Alerta { background: var(--warning); } .badge-Regra { background: var(--primary); }
        .actions { display: flex; gap: 8px; }
        .icon-btn { border: none; background: none; cursor: pointer; padding: 4px; border-radius: 4px; color: #9ca3af; transition: all 0.2s; }
        .icon-btn:hover { background: #f3f4f6; color: #111827; }
        .icon-edit:hover { color: var(--primary); background: #eff6ff; }
        .icon-del:hover { color: var(--danger); background: #fef2f2; }

        /* Modal PDCA */
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; backdrop-filter: blur