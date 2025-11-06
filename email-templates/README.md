# Templates de Email para Supabase

Este diretório contém templates HTML profissionais para todos os emails de autenticação do Supabase no projeto Creative AI Studio.

## 📧 Templates Disponíveis

### 1. **reset-password.html** - Recuperação de Senha
Template enviado quando o usuário solicita recuperação de senha.

**Variáveis Supabase:**
- `{{ .ConfirmationURL }}` - URL para redefinir a senha

**Características:**
- Design moderno com gradiente roxo
- Aviso de expiração (1 hora)
- Dicas de segurança
- Responsive design

---

### 2. **confirm-signup.html** - Confirmação de Cadastro
Template de boas-vindas enviado após o cadastro para confirmar o email.

**Variáveis Supabase:**
- `{{ .ConfirmationURL }}` - URL para confirmar o email

**Características:**
- Badge de boas-vindas
- Lista de recursos da plataforma
- Links para redes sociais
- Design acolhedor

---

### 3. **invite-user.html** - Convite de Usuário
Template enviado quando um usuário convida outro para a equipe.

**Variáveis Supabase:**
- `{{ .ConfirmationURL }}` - URL para aceitar o convite
- `{{ .InviterName }}` - Nome de quem enviou o convite
- `{{ .InviterInitial }}` - Inicial do nome do convidador
- `{{ .InviterRole }}` - Cargo/função do convidador

**Características:**
- Badge de convite especial
- Avatar do convidador
- Lista de benefícios
- Aviso de expiração (7 dias)

---

### 4. **change-email.html** - Mudança de Email
Template enviado para confirmar a alteração de email da conta.

**Variáveis Supabase:**
- `{{ .ConfirmationURL }}` - URL para confirmar o novo email
- `{{ .OldEmail }}` - Email atual
- `{{ .NewEmail }}` - Novo email

**Características:**
- Comparação visual entre emails (antes/depois)
- Avisos de segurança destacados
- Dicas de proteção da conta
- Expiração em 24 horas

---

### 5. **magic-link.html** - Login Mágico
Template enviado quando o usuário solicita login sem senha (magic link).

**Variáveis Supabase:**
- `{{ .ConfirmationURL }}` - URL para fazer login
- `{{ .Browser }}` - Navegador usado (opcional)
- `{{ .OS }}` - Sistema operacional (opcional)
- `{{ .Location }}` - Localização aproximada (opcional)
- `{{ .Timestamp }}` - Data e hora da solicitação (opcional)

**Características:**
- Informações do dispositivo/localização
- Aviso de expiração curta (15 minutos)
- Alertas de segurança proeminentes
- Design clean e moderno

---

### 6. **reauthentication.html** - Reautenticação
Template enviado quando o usuário tenta realizar uma ação sensível que requer reconfirmação de identidade.

**Variáveis Supabase:**
- `{{ .ConfirmationURL }}` - URL para confirmar a identidade
- `{{ .ActionType }}` - Tipo de ação sensível que está sendo tentada (opcional)
- `{{ .Browser }}` - Navegador usado (opcional)
- `{{ .OS }}` - Sistema operacional (opcional)
- `{{ .Location }}` - Localização aproximada (opcional)
- `{{ .Timestamp }}` - Data e hora da solicitação (opcional)

**Características:**
- Badge de segurança destacado (vermelho)
- Explicação clara da ação sensível
- Lista de motivos para reautenticação
- Informações detalhadas do dispositivo
- Alertas de segurança críticos
- Expiração em 10 minutos
- Instruções claras em caso de atividade suspeita

**Casos de uso:**
- Alteração de senha
- Mudança de email
- Exclusão de conta
- Alteração de configurações críticas
- Acesso a dados sensíveis

---

## 🚀 Como Usar

### 1. Acessar o Supabase Dashboard

Acesse: [https://app.supabase.com](https://app.supabase.com)

### 2. Navegar até Email Templates

1. Selecione seu projeto
2. Vá para **Authentication** → **Email Templates**

### 3. Configurar cada Template

Para cada tipo de email:

1. Selecione o template (ex: "Reset Password")
2. Clique em **Edit template**
3. Cole o conteúdo HTML do arquivo correspondente
4. Mantenha as variáveis `{{ .VariableName }}` - elas serão substituídas automaticamente
5. Clique em **Save**

### 4. Configurar URLs de Redirecionamento

Em **Authentication** → **URL Configuration**, adicione:

```
# Site URL
http://localhost:3000  (desenvolvimento)
https://seu-dominio.com  (produção)

# Redirect URLs (adicione todas estas):
http://localhost:3000/auth/callback
http://localhost:3000/auth/reset-password
http://localhost:3000/auth/confirm
https://seu-dominio.com/auth/callback
https://seu-dominio.com/auth/reset-password
https://seu-dominio.com/auth/confirm
```

---

## 🎨 Personalização

### Cores do Tema

Os templates usam um gradiente padrão roxo/violeta:
- Primário: `#667eea` → `#764ba2` (reset password, confirm signup, change email)
- Secundário: `#f093fb` → `#f5576c` (invite user)
- Terciário: `#4facfe` → `#00f2fe` (magic link)
- Alerta: `#ff6b6b` → `#ee5a6f` (reauthentication)

Para personalizar:

1. Substitua os valores nos gradientes CSS:
```css
background: linear-gradient(135deg, #SUA_COR_1 0%, #SUA_COR_2 100%);
```

2. Atualize as cores nos botões e badges

### Logo

Substitua o elemento `.logo-icon` por sua logo:

```html
<!-- Opção 1: Usar imagem -->
<img src="https://seu-dominio.com/logo.png" alt="Logo" style="width: 40px; height: 40px;">

<!-- Opção 2: Usar emoji/ícone -->
<div class="logo-icon">✨</div>
```

### Textos e Links

Atualize os seguintes textos em todos os templates:

- Nome da empresa: `Creative AI Studio`
- Email de suporte: `suporte@creativeaistudio.com`
- Links do footer (redes sociais, termos, privacidade)
- Descrição da plataforma

---

## 📱 Compatibilidade

Os templates foram testados e são compatíveis com:

- ✅ Gmail (Web, iOS, Android)
- ✅ Outlook (Web, Desktop, Mobile)
- ✅ Apple Mail (macOS, iOS)
- ✅ Yahoo Mail
- ✅ ProtonMail
- ✅ Outros clientes web e mobile

### Recursos Suportados

- ✅ Design responsivo (mobile-first)
- ✅ Dark mode automático (onde suportado)
- ✅ Fontes web-safe
- ✅ Fallbacks de imagem
- ✅ Links clicáveis
- ✅ Botões touch-friendly

---

## 🧪 Testes

### Testar Localmente

1. Abra os arquivos HTML em um navegador
2. Substitua manualmente as variáveis `{{ .Variable }}` por valores de exemplo
3. Teste em diferentes tamanhos de tela

### Testar no Supabase

1. Configure os templates no dashboard
2. Use a função de "Send test email" em cada template
3. Verifique o resultado em sua caixa de entrada

### Ferramentas Recomendadas

- [Litmus](https://litmus.com) - Testes em múltiplos clientes
- [Email on Acid](https://www.emailonacid.com) - Validação de compatibilidade
- [MailTrap](https://mailtrap.io) - Testes em ambiente de desenvolvimento

---

## 🔧 Troubleshooting

### Variáveis não são substituídas

**Problema:** As variáveis `{{ .Variable }}` aparecem como texto no email

**Solução:**
- Verifique se está usando a sintaxia correta do Supabase
- Certifique-se de que salvou o template corretamente
- Algumas variáveis só funcionam em templates específicos

### Imagens não carregam

**Problema:** Imagens quebradas ou não aparecem

**Solução:**
- Use URLs absolutas (https://...)
- Verifique se as imagens são acessíveis publicamente
- Use imagens hospedadas em CDN confiável
- Adicione texto alternativo (alt) para fallback

### Layout quebrado em mobile

**Problema:** Email não renderiza bem em dispositivos móveis

**Solução:**
- Verifique se manteve os media queries CSS
- Teste em diferentes clientes de email mobile
- Use unidades relativas (%, em) em vez de fixas (px)

### Emails vão para spam

**Problema:** Emails são marcados como spam

**Solução:**
- Configure SPF, DKIM e DMARC no Supabase
- Evite palavras "spam" como "grátis", "ganhe dinheiro"
- Mantenha proporção texto/imagem balanceada
- Use domínio verificado

---

## 📋 Checklist de Implementação

- [ ] Copiar todos os 6 templates HTML
- [ ] Configurar cada template no Supabase Dashboard
- [ ] Adicionar todas as redirect URLs
- [ ] Personalizar cores e logo
- [ ] Atualizar textos e links
- [ ] Configurar Site URL
- [ ] Testar cada template enviando emails de teste
- [ ] Verificar renderização em Gmail
- [ ] Verificar renderização em Outlook
- [ ] Verificar renderização mobile
- [ ] Configurar SPF/DKIM (produção)
- [ ] Documentar URLs customizadas da sua aplicação

---

## 🎯 Melhores Práticas

### Design
- ✅ Use gradientes sutis para melhor aparência
- ✅ Mantenha hierarquia visual clara
- ✅ Use espaçamento generoso entre elementos
- ✅ Botões com área de toque de no mínimo 44x44px
- ✅ Contraste de texto adequado (WCAG AA)

### Conteúdo
- ✅ Seja claro e direto ao ponto
- ✅ Use CTAs (call-to-action) óbvios
- ✅ Inclua informações de segurança
- ✅ Forneça alternativas (copiar/colar links)
- ✅ Adicione avisos de expiração quando relevante

### Segurança
- ✅ Sempre mencione se o usuário não solicitou a ação
- ✅ Inclua informações sobre expiração de links
- ✅ Adicione dicas de segurança relevantes
- ✅ Forneça contato de suporte
- ✅ Nunca peça informações sensíveis por email

### Acessibilidade
- ✅ Use texto alternativo em imagens
- ✅ Mantenha contraste adequado
- ✅ Use hierarquia semântica (h1, h2, etc)
- ✅ Estrutura de tabela para layout consistente
- ✅ Fontes legíveis (mínimo 14px)

---

## 📚 Referências

- [Documentação Supabase Auth](https://supabase.com/docs/guides/auth)
- [Email Templates Supabase](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Go Template Syntax](https://golang.org/pkg/text/template/) - Usado pelo Supabase
- [HTML Email Guidelines](https://www.campaignmonitor.com/css/)

---

## 🤝 Suporte

Se precisar de ajuda:

1. Consulte a [documentação oficial do Supabase](https://supabase.com/docs)
2. Verifique o arquivo `SUPABASE_CONFIG.md` na raiz do projeto
3. Entre em contato com o suporte do Supabase
4. Abra uma issue no repositório do projeto

---

## 📝 Changelog

### v1.1.0 (2025-01-XX)
- ✨ Adicionado template de Reautenticação (reauthentication.html)
- 🔐 Foco em segurança para ações sensíveis
- 📋 Informações detalhadas do dispositivo e localização

### v1.0.0 (2025-01-XX)
- ✨ Criação inicial de 5 templates principais
- 🎨 Design moderno com gradientes e animações
- 📱 Suporte completo mobile
- 🔒 Foco em segurança e boas práticas
- 📖 Documentação completa

---

## 📄 Licença

Estes templates são parte do projeto Creative AI Studio.
Use e modifique livremente conforme suas necessidades.

---

**Criado com ❤️ para o Creative AI Studio**