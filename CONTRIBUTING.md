# 🤝 Guia de Contribuição

Obrigado por seu interesse em contribuir com o Creative AI Studio! Este documento fornece diretrizes para contribuições.

## 📋 Índice

- [Como Contribuir](#como-contribuir)
- [Padrões de Código](#padrões-de-código)
- [Processo de Pull Request](#processo-de-pull-request)
- [Reportar Issues](#reportar-issues)
- [Configuração do Ambiente](#configuração-do-ambiente)

## 🚀 Como Contribuir

### 1. Fork e Clone

```bash
# Fork no GitHub
# Clone seu fork
git clone https://github.com/SEU-USUARIO/creative-ai-studio.git
cd creative-ai-studio

# Adicione o upstream
git remote add upstream https://github.com/M1n1h4ck3r/creative-ai-studio.git
```

### 2. Configurar Ambiente

```bash
# Instalar dependências
npm install

# Copiar variáveis de ambiente
cp .env.example .env.local

# Executar em desenvolvimento
npm run dev
```

### 3. Criar Branch

```bash
# Sincronizar com upstream
git checkout develop
git pull upstream develop

# Criar nova branch
git checkout -b feature/sua-feature
# ou
git checkout -b fix/seu-bug-fix
```

## 📝 Padrões de Código

### Convenção de Commits

Seguimos a [Conventional Commits](https://conventionalcommits.org/):

```bash
# Features
git commit -m "feat: adicionar geração de imagens com DALL-E"

# Bug fixes  
git commit -m "fix: corrigir erro de autenticação no Supabase"

# Documentação
git commit -m "docs: atualizar guia de instalação"

# Melhorias
git commit -m "refactor: otimizar componente ImageGenerator"

# Testes
git commit -m "test: adicionar testes para ApiKeyContext"

# Configuração
git commit -m "chore: atualizar dependências do projeto"
```

### Estrutura de Commit

```
tipo(escopo): descrição curta

Descrição mais detalhada explicando o que foi alterado
e por que foi necessário.

- Item específico alterado
- Outro item alterado

Co-authored-by: Nome <email@exemplo.com>
```

### Padrões TypeScript

```typescript
// ✅ Bom
interface UserProfile {
  id: string
  name: string
  email: string
  createdAt: Date
}

// ❌ Evitar
const userData: any = { ... }
```

### Padrões React

```typescript
// ✅ Componentes funcionais com TypeScript
interface Props {
  title: string
  onClose: () => void
}

export const Dialog: React.FC<Props> = ({ title, onClose }) => {
  return (
    <div className="dialog">
      <h2>{title}</h2>
      <button onClick={onClose}>Fechar</button>
    </div>
  )
}
```

### Estilo de Código

- **Indentação**: 2 espaços
- **Aspas**: Simples para JS/TS, duplas para JSX
- **Semicolons**: Sempre usar
- **Trailing comma**: Sempre usar em objetos/arrays multi-linha

## 🔄 Processo de Pull Request

### 1. Antes de Enviar

```bash
# Verificar linting
npm run lint

# Verificar tipos
npm run type-check

# Testar build
npm run build

# Executar testes (quando disponível)
npm test
```

### 2. Criar Pull Request

1. **Título descritivo**: "feat: adicionar integração com Claude AI"
2. **Descrição detalhada**:
   ```markdown
   ## 📋 Resumo
   Adiciona integração com a API da Anthropic Claude para geração de texto.

   ## 🎯 Motivação
   Usuários solicitaram mais opções de modelos de IA para criação de prompts.

   ## 🔧 Alterações
   - [ ] Novo provider Claude na pasta `lib/providers/`
   - [ ] Interface atualizada para seleção de modelo
   - [ ] Testes unitários adicionados
   - [ ] Documentação atualizada

   ## 🧪 Como Testar
   1. Configurar `ANTHROPIC_API_KEY` no .env.local
   2. Acessar /dashboard
   3. Selecionar "Claude" como provider
   4. Gerar texto de teste

   ## 📸 Screenshots
   (se aplicável)
   ```

### 3. Review Process

- ✅ Todas as verificações automáticas passando
- ✅ Código revisado por pelo menos 1 mantenedor
- ✅ Testes passando (quando disponível)
- ✅ Documentação atualizada se necessário

## 🐛 Reportar Issues

### Template de Bug Report

```markdown
## 🐛 Descrição do Bug
Descrição clara do que está acontecendo.

## 🔄 Passos para Reproduzir
1. Acesse '...'
2. Clique em '...'
3. Veja erro

## 🎯 Comportamento Esperado
O que deveria acontecer.

## 📱 Ambiente
- OS: [Windows 11, macOS, Linux]
- Browser: [Chrome 120, Firefox 121]
- Versão do Node: [20.1.0]

## 📸 Screenshots
(se aplicável)

## 📋 Logs Adicionais
```
console.error logs aqui
```
```

### Template de Feature Request

```markdown
## 💡 Resumo da Feature
Descrição concisa da nova funcionalidade.

## 🎯 Problema que Resolve
Que problema ou necessidade esta feature atende?

## 💭 Solução Proposta
Como você imagina que deveria funcionar?

## 📋 Critérios de Aceitação
- [ ] Critério 1
- [ ] Critério 2
- [ ] Critério 3

## 🎨 Mockups/Wireframes
(se aplicável)
```

## 🛠️ Configuração do Ambiente

### Ferramentas Recomendadas

- **Editor**: VSCode
- **Extensões VSCode**:
  - TypeScript and JavaScript Language Features
  - Tailwind CSS IntelliSense
  - ESLint
  - Prettier
  - Auto Rename Tag

### Configuração do VSCode

```json
// .vscode/settings.json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode"
}
```

## 📚 Recursos Úteis

### Documentação

- [Next.js](https://nextjs.org/docs)
- [TypeScript](https://www.typescriptlang.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Supabase](https://supabase.com/docs)

### Convenções

- [Conventional Commits](https://conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)

## 🏷️ Labels

### Issues
- `bug` - Problemas/bugs
- `enhancement` - Novas features
- `documentation` - Melhorias na documentação
- `help wanted` - Procurando ajuda da comunidade
- `good first issue` - Bom para iniciantes

### Pull Requests
- `work in progress` - Ainda em desenvolvimento
- `ready for review` - Pronto para revisão
- `needs changes` - Precisa de alterações

## 🎖️ Reconhecimento

Todos os contribuidores são adicionados ao arquivo de agradecimentos e recebem reconhecimento nos commits.

---

**🙏 Obrigado por contribuir com o Creative AI Studio!**

Para dúvidas, abra uma issue ou contate os mantenedores.