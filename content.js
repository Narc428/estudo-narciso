// content.js - Script que analisa documentos de candidatos na página

// Configurações de erros comuns em documentos de candidatos
const ERROR_PATTERNS = {
  // Erros em documentos pessoais
  missingCPF: {
    pattern: /cpf/i,
    validation: (text) => !/\d{3}\.\d{3}\.\d{3}-\d{2}/.test(text) && text.toLowerCase().includes('cpf'),
    description: 'CPF ausente ou em formato inválido',
    severity: 'critical',
    suggestion: 'Verifique se o CPF está preenchido no formato XXX.XXX.XXX-XX'
  },
  missingRG: {
    pattern: /rg|identidade/i,
    validation: (text) => !/[a-z]?\d{5,9}[a-z]?/i.test(text) && (text.toLowerCase().includes('rg') || text.toLowerCase().includes('identidade')),
    description: 'RG ausente ou em formato inválido',
    severity: 'high',
    suggestion: 'Verifique se o número do RG está completo'
  },
  invalidDate: {
    pattern: /\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|data/i,
    validation: (text) => {
      const dateMatches = text.match(/\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}/g);
      if (!dateMatches) return false;
      return dateMatches.some(date => {
        const parts = date.split(/[-\/]/);
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]);
        const year = parseInt(parts[2].length === 2 ? '20' + parts[2] : parts[2]);
        return day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > new Date().getFullYear();
      });
    },
    description: 'Data inválida detectada (dia, mês ou ano fora do intervalo aceitável)',
    severity: 'high',
    suggestion: 'Verifique se as datas estão no formato correto e são coerentes'
  },
  missingAddress: {
    pattern: /endereço|endereco|rua|avenida|av\.|av /i,
    validation: (text) => {
      const hasAddressKeyword = /endereço|endereco|rua|avenida|av\.|av /i.test(text);
      const hasAddressDetails = /\d+/.test(text) && (text.toLowerCase().includes('nº') || text.toLowerCase().includes('numero') || text.toLowerCase().includes('número'));
      return hasAddressKeyword && !hasAddressDetails;
    },
    description: 'Endereço incompleto (faltando número ou complemento)',
    severity: 'medium',
    suggestion: 'Complete o endereço com número, bairro e CEP'
  },
  missingCEP: {
    pattern: /cep/i,
    validation: (text) => !/\d{5}-?\d{3}/.test(text) && text.toLowerCase().includes('cep'),
    description: 'CEP ausente ou em formato inválido',
    severity: 'medium',
    suggestion: 'Verifique se o CEP está no formato XXXXX-XXX'
  },
  missingEmail: {
    pattern: /e-mail|email/i,
    validation: (text) => !/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text) && (text.toLowerCase().includes('e-mail') || text.toLowerCase().includes('email')),
    description: 'E-mail ausente ou em formato inválido',
    severity: 'high',
    suggestion: 'Verifique se o e-mail está no formato correto (exemplo@dominio.com)'
  },
  missingPhone: {
    pattern: /telefone|celular|tel|fone/i,
    validation: (text) => !/(\(?\d{2}\)?[\s-]?)?(\d{4,5}[\s-]?\d{4})/.test(text) && (text.toLowerCase().includes('telefone') || text.toLowerCase().includes('celular') || text.toLowerCase().includes('tel') || text.toLowerCase().includes('fone')),
    description: 'Telefone ausente ou em formato inválido',
    severity: 'medium',
    suggestion: 'Verifique se o telefone está no formato (XX) XXXXX-XXXX'
  },
  missingEducation: {
    pattern: /escolaridade|formação|formacao|estudo|curso|faculdade|universidade/i,
    validation: (text) => {
      const hasEducationKeyword = /escolaridade|formação|formacao|estudo|curso|faculdade|universidade/i.test(text);
      const hasEducationDetails = /ensino (médio|medio|fundamental|superior)|graduação|graduacao|bacharel|licenciatura|tecnólogo|tecnologo|mestrado|doutorado/i.test(text);
      return hasEducationKeyword && !hasEducationDetails;
    },
    description: 'Informações de escolaridade incompletas',
    severity: 'medium',
    suggestion: 'Detalhe o nível de escolaridade e instituição de ensino'
  },
  missingExperience: {
    pattern: /experiência|experiencia|trabalho|emprego|cargo|função|funcao/i,
    validation: (text) => {
      const hasExperienceKeyword = /experiência|experiencia|trabalho|emprego|cargo|função|funcao/i.test(text);
      const hasExperienceDetails = /\d+\s*(ano|anos|mês|meses)/i.test(text) || /empresa|corporação|corporacao|ltda|s\.a\./i.test(text);
      return hasExperienceKeyword && !hasExperienceDetails;
    },
    description: 'Experiência profissional incompleta ou genérica',
    severity: 'medium',
    suggestion: 'Detalhe empresas, cargos e período de experiência'
  },
  inconsistentInfo: {
    pattern: /nome|nascimento|idade/i,
    validation: (text) => {
      // Verifica inconsistências entre idade e data de nascimento
      const ageMatch = text.match(/(\d+)\s*(ano|anos)/i);
      const birthDateMatch = text.match(/nasciment[o|o].*?(\d{1,2})[-\/](\d{1,2})[-\/](\d{2,4})/i);
      
      if (ageMatch && birthDateMatch) {
        const age = parseInt(ageMatch[1]);
        const birthYear = parseInt(birthDateMatch[3].length === 2 ? '20' + birthDateMatch[3] : birthDateMatch[3]);
        const currentYear = new Date().getFullYear();
        const calculatedAge = currentYear - birthYear;
        
        return Math.abs(calculatedAge - age) > 2; // Tolerância de 2 anos
      }
      return false;
    },
    description: 'Inconsistência entre idade e data de nascimento informadas',
    severity: 'high',
    suggestion: 'Verifique se a idade corresponde à data de nascimento'
  },
  blankFields: {
    pattern: /_____|_____|\[\s*\]|\(\s*\)|<vazio>|<branco>/i,
    validation: (text) => /_____|_____|\[\s*\]|\(\s*\)/.test(text),
    description: 'Campos em branco ou não preenchidos detectados',
    severity: 'critical',
    suggestion: 'Preencha todos os campos obrigatórios do documento'
  },
  signatureMissing: {
    pattern: /assinatura|assinar|sign/i,
    validation: (text) => {
      const hasSignatureField = /assinatura|assinar|sign/i.test(text);
      const hasSignature = /assinad[o|a]|digitalmente|rubric/i.test(text);
      return hasSignatureField && !hasSignature;
    },
    description: 'Assinatura ausente em campo obrigatório',
    severity: 'critical',
    suggestion: 'O documento requer assinatura do candidato'
  }
};

// Detectar tipo de documento
function detectDocumentType(text) {
  const documentTypes = [
    { type: 'Currículo', patterns: [/currículo/i, /curriculo/i, /experiência/i, /formação/i] },
    { type: 'Formulário de Inscrição', patterns: [/inscrição/i, /inscricao/i, /cadastro/i, /candidatura/i] },
    { type: 'Documento Pessoal', patterns: [/cpf/i, /rg/i, /identidade/i, /nascimento/i] },
    { type: 'Comprovante de Residência', patterns: [/endereço/i, /endereco/i, /residência/i, /residencia/i, /conta/i] },
    { type: 'Certificado', patterns: [/certificado/i, /diploma/i, /conclusão/i, /conclusao/i] }
  ];

  for (const doc of documentTypes) {
    if (doc.patterns.some(pattern => pattern.test(text))) {
      return doc.type;
    }
  }

  return 'Documento de Candidato';
}

// Extrair informações do candidato
function extractCandidateInfo(text) {
  const info = {};

  // Extrair nome
  const nameMatch = text.match(/(?:nome|name)[:\s]+([A-Za-zÀ-ÿ\s]+)/i);
  if (nameMatch) {
    info.nome = nameMatch[1].trim();
  }

  // Extrair CPF
  const cpfMatch = text.match(/\d{3}\.\d{3}\.\d{3}-\d{2}/);
  if (cpfMatch) {
    info.cpf = cpfMatch[0];
  }

  // Extrair e-mail
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) {
    info.email = emailMatch[0];
  }

  // Extrair telefone
  const phoneMatch = text.match(/(\(?\d{2}\)?[\s-]?)?(\d{4,5}[\s-]?\d{4})/);
  if (phoneMatch) {
    info.telefone = phoneMatch[0];
  }

  // Extrair data de nascimento
  const birthDateMatch = text.match(/nasciment[o|o].*?(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i);
  if (birthDateMatch) {
    info.dataNascimento = birthDateMatch[1];
  }

  return info;
}

// Analisar texto em busca de erros
function analyzeTextForErrors(text) {
  const errors = [];
  const warnings = [];

  for (const [errorKey, errorConfig] of Object.entries(ERROR_PATTERNS)) {
    if (errorConfig.pattern.test(text) && errorConfig.validation(text)) {
      const error = {
        type: errorKey,
        description: errorConfig.description,
        severity: errorConfig.severity,
        suggestion: errorConfig.suggestion
      };

      if (errorConfig.severity === 'critical' || errorConfig.severity === 'high') {
        errors.push(error);
      } else {
        warnings.push(error);
      }
    }
  }

  return { errors, warnings };
}

// Função principal de análise
function analyzePage() {
  // Obter todo o texto da página
  const bodyText = document.body.innerText;
  
  // Também verificar inputs e campos de formulário
  const formFields = Array.from(document.querySelectorAll('input, textarea, select'))
    .map(field => field.value || field.placeholder || '')
    .join(' ');
  
  const fullText = bodyText + ' ' + formFields;

  // Verificar se parece ser uma página de documentos de candidatos
  const candidateKeywords = [/candidat/o, /currícul/o, /curricul/o, /inscriçã/o, /inscricao/, /vaga/, /empreg/o/, /trabalh/o/, /processo seletiv/o/];
  const isCandidatePage = candidateKeywords.some(keyword => keyword.test(fullText));

  if (!isCandidatePage && fullText.length < 100) {
    return {
      foundDocument: false,
      message: 'Nenhum documento de candidato detectado'
    };
  }

  // Detectar tipo de documento
  const documentType = detectDocumentType(fullText);

  // Analisar erros
  const { errors, warnings } = analyzeTextForErrors(fullText);

  // Extrair informações do candidato
  const candidateInfo = extractCandidateInfo(fullText);

  // Determinar erro principal (priorizar por gravidade)
  let mainError = null;
  if (errors.length > 0) {
    // Ordenar por gravidade: critical > high > medium > low
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    errors.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
    mainError = errors[0];
    
    // Adicionar localização aproximada
    const locationMatch = fullText.toLowerCase().indexOf(mainError.type.toLowerCase());
    if (locationMatch !== -1) {
      mainError.location = 'Detectado no conteúdo do documento';
    }
  }

  return {
    foundDocument: true,
    documentType: documentType,
    mainError: mainError,
    errors: errors,
    warnings: warnings,
    candidateInfo: candidateInfo,
    totalIssues: errors.length + warnings.length
  };
}

// Listener para mensagens do popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "analyzeDocument") {
    const result = analyzePage();
    sendResponse(result);
  }
});

// Auto-análise quando a página carregar (opcional)
window.addEventListener('load', function() {
  // Pode ativar análise automática se desejar
  // console.log('Avaliador de Candidatos pronto para analisar');
});
