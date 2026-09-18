// popup.js - Lógica principal da extensão

document.addEventListener('DOMContentLoaded', function() {
  analyzeDocument();
});

function analyzeDocument() {
  const contentDiv = document.getElementById('content');
  contentDiv.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <p>Analisando documento...</p>
    </div>
  `;

  // Enviar mensagem para o content script analisar a página atual
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (!tabs[0]) {
      showNoDocument();
      return;
    }

    chrome.tabs.sendMessage(tabs[0].id, {action: "analyzeDocument"}, function(response) {
      if (chrome.runtime.lastError || !response) {
        showNoDocument();
        return;
      }
      
      displayResults(response);
    });
  });
}

function displayResults(result) {
  const contentDiv = document.getElementById('content');
  
  if (!result || !result.foundDocument) {
    showNoDocument();
    return;
  }

  const mainError = result.mainError;
  
  let html = `
    <div class="status">
      <div style="margin-bottom: 10px;">
        <strong>Documento encontrado:</strong><br>
        <span style="font-size: 12px; opacity: 0.9;">${result.documentType || 'Documento de candidato'}</span>
      </div>
  `;

  if (mainError) {
    html += `
      <div class="error-box">
        <div class="error-title">⚠️ Erro Principal Identificado:</div>
        <div class="error-description">${mainError.description}</div>
        ${mainError.severity ? `<div style="margin-top: 8px; font-size: 11px;"><strong>Gravidade:</strong> ${getSeverityLabel(mainError.severity)}</div>` : ''}
        ${mainError.location ? `<div style="margin-top: 5px; font-size: 11px;"><strong>Localização:</strong> ${mainError.location}</div>` : ''}
        ${mainError.suggestion ? `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.3); font-size: 12px;">💡 <strong>Sugestão:</strong> ${mainError.suggestion}</div>` : ''}
      </div>
    `;
  } else if (result.errors && result.errors.length > 0) {
    html += `<div style="margin-top: 10px; font-size: 13px;">✅ Nenhum erro crítico encontrado.</div>`;
    if (result.warnings && result.warnings.length > 0) {
      html += `<div style="margin-top: 5px; font-size: 12px; opacity: 0.9;">${result.warnings.length} aviso(s) encontrado(s).</div>`;
    }
  } else {
    html += `<div style="margin-top: 10px; font-size: 13px;">✅ Documento parece estar correto.</div>`;
  }

  if (result.candidateInfo) {
    html += `
      <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.2); font-size: 12px;">
        <strong>Informações do Candidato:</strong><br>
        ${formatCandidateInfo(result.candidateInfo)}
      </div>
    `;
  }

  html += `</div>`;
  contentDiv.innerHTML = html;
}

function showNoDocument() {
  const contentDiv = document.getElementById('content');
  contentDiv.innerHTML = `
    <div class="no-document">
      <p style="margin: 0; font-size: 14px;">Nenhum documento de candidato detectado nesta página.</p>
      <p style="margin: 10px 0 0; font-size: 12px; opacity: 0.8;">Navegue até uma página com documentos de candidatos e clique em "Reanalisar".</p>
    </div>
  `;
}

function getSeverityLabel(severity) {
  const labels = {
    'critical': '🔴 Crítico',
    'high': '🟠 Alto',
    'medium': '🟡 Médio',
    'low': '🟢 Baixo'
  };
  return labels[severity] || severity;
}

function formatCandidateInfo(info) {
  let formatted = '';
  for (const [key, value] of Object.entries(info)) {
    if (value) {
      formatted += `<div style="margin-top: 5px;"><strong>${capitalizeFirstLetter(key)}:</strong> ${value}</div>`;
    }
  }
  return formatted || 'Nenhuma informação encontrada';
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
