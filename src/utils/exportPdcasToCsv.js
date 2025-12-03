// src/utils/exportPdcasToCsv.js

function escapeCsvValue(value) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  // Se tiver ; , " ou quebra de linha, coloca entre aspas
  if (/[;"\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportPdcasToCsv(pdcas, filename = "pdcas.csv") {
  if (!Array.isArray(pdcas) || pdcas.length === 0) {
    alert("Não há PDCAs para exportar.");
    return;
  }

  const headers = [
    "ID",
    "Código",
    "Título",
    "Área",
    "Prioridade",
    "Status",
    "ClienteTipo",
    "Meta",
    "TextoProblema",
    "CriadoEm",
  ];

  const rows = pdcas.map((p) => {
    const createdAt =
      p.criadoEm && p.criadoEm.seconds
        ? new Date(p.criadoEm.seconds * 1000).toISOString()
        : "";

    return [
      escapeCsvValue(p.id),
      escapeCsvValue(p.codigo || p.id),
      escapeCsvValue(p.titulo || ""),
      escapeCsvValue(p.area || ""),
      escapeCsvValue(p.prioridade || ""),
      escapeCsvValue(p.status || ""),
      escapeCsvValue(p.clienteTipo || ""),
      escapeCsvValue(p.meta || ""),
      escapeCsvValue(p.textoProblema || p.problema || ""),
      escapeCsvValue(createdAt),
    ].join(";");
  });

  const csvContent = [headers.join(";"), ...rows].join("\r\n");

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.setAttribute("download", filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
