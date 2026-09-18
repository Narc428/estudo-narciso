# Avaliador de Candidatos - Extensão para Brave/Chrome

Uma extensão de navegador que analisa automaticamente documentos de candidatos e identifica o erro principal sem necessidade de intervenção manual.

## 🚀 Funcionalidades

- **Detecção Automática**: Identifica automaticamente quando você está visualizando um documento de candidato
- **Análise Inteligente**: Verifica erros comuns em documentos como:
  - CPF ausente ou inválido
  - RG incompleto
  - Datas inválidas
  - Endereço incompleto
  - CEP inválido
  - E-mail ausente ou inválido
  - Telefone ausente
  - Escolaridade incompleta
  - Experiência profissional genérica
  - Inconsistências entre idade e data de nascimento
  - Campos em branco
  - Assinatura ausente

- **Priorização de Erros**: Classifica erros por gravidade (Crítico, Alto, Médio, Baixo)
- **Sugestões de Correção**: Fornece recomendações específicas para cada erro encontrado
- **Extração de Informações**: Extrai automaticamente dados do candidato (nome, CPF, e-mail, telefone, etc.)

## 📦 Instalação

### No Brave ou Chrome:

1. **Baixe os arquivos da extensão**
   - Certifique-se de ter todos os arquivos na pasta do projeto

2. **Abra o navegador e acesse as extensões**
   - No Brave: `brave://extensions/`
   - No Chrome: `chrome://extensions/`

3. **Ative o modo do desenvolvedor**
   - No canto superior direito, ative a chave "Modo do desenvolvedor"

4. **Carregue a extensão**
   - Clique em "Carregar sem compactação" (ou "Load unpacked")
   - Selecione a pasta onde estão os arquivos da extensão (`/workspace`)

5. **Pronto!**
   - O ícone da extensão aparecerá na barra de ferramentas
   - A extensão está pronta para usar

## 🔧 Como Usar

1. **Navegue até uma página com documentos de candidatos**
   - Currículos online
   - Formulários de inscrição
   - Sistemas de recrutamento
   - Documentos PDF visualizados no navegador

2. **Clique no ícone da extensão**
   - A análise automática será iniciada

3. **Visualize o resultado**
   - O erro principal será destacado
   - Veja a gravidade, descrição e sugestão de correção
   - Informações do candidato serão exibidas se disponíveis

4. **Reanalise se necessário**
   - Use o botão "Reanalisar" para atualizar a análise

## 📁 Estrutura do Projeto

```
/workspace
├── manifest.json       # Configuração da extensão
├── popup.html          # Interface do popup
├── popup.js            # Lógica do popup
├── content.js          # Script de análise de conteúdo
└── icons/              # Ícones da extensão
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## 🛠️ Personalização

### Adicionar Novos Padrões de Erro

Edite o arquivo `content.js` e adicione novos padrões ao objeto `ERROR_PATTERNS`:

```javascript
novoErro: {
  pattern: /palavra-chave/i,
  validation: (text) => {
    // Sua lógica de validação
    return true || false;
  },
  description: 'Descrição do erro',
  severity: 'critical', // critical, high, medium, low
  suggestion: 'Sugestão de correção'
}
```

### Ajustar Sensibilidade da Detecção

Modifique as expressões regulares e funções de validação conforme necessário para seu caso de uso específico.

## ⚙️ Permissões

A extensão requer as seguintes permissões:
- `activeTab`: Para acessar a aba ativa e analisar seu conteúdo
- `scripting`: Para injetar o script de análise nas páginas

## 🔒 Privacidade

- **Sem coleta de dados**: A extensão não envia nenhuma informação para servidores externos
- **Análise local**: Toda a análise é feita localmente no seu navegador
- **Sem armazenamento**: Nenhum dado é armazenado permanentemente

## 💡 Dicas

- A extensão funciona melhor em páginas com texto estruturado
- Para documentos PDF, use o visualizador de PDF do navegador
- Em sistemas web de RH, a detecção é automática
- Você pode usar a extensão em qualquer página - ela só mostrará resultados quando detectar conteúdo relevante

---

**Desenvolvido para facilitar a avaliação de documentos de candidatos de forma automática e eficiente.**
