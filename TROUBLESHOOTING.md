# 🔧 Troubleshooting Guide - Creative AI Studio

## 📋 Problemas Comuns e Soluções

### 🚨 Erros de Deploy

#### ❌ Build Failed - "Module not found"
```bash
Error: Module not found: Can't resolve 'xxxxx'
```
**Solução:**
```bash
# Limpar cache e reinstalar dependências
rm -rf node_modules package-lock.json .next
npm install
npm run build
```

#### ❌ Environment Variable Missing
```bash
Error: Environment variable GEMINI_API_KEY is required
```
**Solução:**
1. Verifique se todas as variáveis obrigatórias estão configuradas:
```bash
# Variáveis OBRIGATÓRIAS
GEMINI_API_KEY=sua_key_aqui
JWT_SECRET=no-minimo-32-caracteres-muito-secreto-aqui
ENCRYPTION_KEY=exatamente-32-caracteres-aqui-ok!
ENCRYPTION_SALT=exatos-16-chars!!
NEXT_PUBLIC_APP_URL=https://seu-dominio.com
```

2. Na Vercel: Project → Settings → Environment Variables

#### ❌ API Route Timeout (504)
```bash
Error: Function execution timeout
```
**Solução:**
1. Verificar `vercel.json`:
```json
{
  "functions": {
    "src/app/api/**": {
      "maxDuration": 30
    }
  }
}
```

2. Otimizar prompts de AI para respostas mais rápidas

---

### 🤖 Problemas com AI Providers

#### ❌ Gemini API Error - 403 Forbidden
```bash
Error: API key not authorized
```
**Solução:**
1. Verificar se a API key está correta no [Google AI Studio](https://aistudio.google.com)
2. Confirmar se billing está ativo na conta Google Cloud
3. Verificar quotas da API

#### ❌ OpenAI Rate Limit
```bash
Error: Rate limit exceeded for API key
```
**Solução:**
1. Implementar retry logic (já implementado no provider)
2. Verificar usage limits no dashboard OpenAI
3. Upgrade do plano se necessário

#### ❌ "No providers available"
```bash
Error: No valid providers configured
```
**Solução:**
1. Configurar pelo menos 1 provider com API key válida
2. Verificar se o provider está ativado no ProviderManager
3. Testar conexão via endpoint `/api/test-key`

---

### 🗄️ Problemas com Database (Supabase)

#### ❌ Connection Failed
```bash
Error: connect ETIMEDOUT
```
**Solução:**
1. Verificar se as URLs do Supabase estão corretas:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

2. Verificar se o projeto Supabase está ativo
3. Executar migrations se necessário

#### ❌ RLS (Row Level Security) Errors
```bash
Error: permission denied for table users
```
**Solução:**
1. Verificar políticas RLS no Supabase Dashboard
2. Executar script de setup:
```bash
cd creative-ai-studio
psql -h db.xxxxx.supabase.co -U postgres -d postgres -f supabase-setup.sql
```

#### ❌ Migration Errors
```bash
Error: relation "users" does not exist
```
**Solução:**
1. Executar todas as migrations:
```bash
# Via Supabase CLI
supabase db reset

# Ou manualmente via SQL
cat supabase-schema.sql | psql -h your-host -U postgres
```

---

### 🎨 Problemas de Interface

#### ❌ Images Not Loading
**Sintomas:** Imagens aparecem quebradas ou não carregam
**Solução:**
1. Verificar configuração `next.config.mjs`:
```javascript
images: {
  domains: ['lh3.googleusercontent.com', 'example.com'],
  formats: ['image/webp', 'image/avif']
}
```

2. Verificar CSP headers em `vercel.json`

#### ❌ Theme Toggle Not Working
**Sintomas:** Tema não alterna entre claro/escuro
**Solução:**
1. Verificar se `next-themes` está configurado no `_app.tsx`
2. Limpar localStorage:
```javascript
localStorage.removeItem('theme')
```

#### ❌ Mobile Layout Broken
**Sintomas:** Layout quebrado em dispositivos móveis
**Solução:**
1. Verificar viewport meta tag
2. Testar com diferentes tamanhos de tela
3. Verificar media queries do Tailwind

---

### 🔐 Problemas de Autenticação

#### ❌ Auth Callback Error
```bash
Error: AuthApiError: Invalid login credentials
```
**Solução:**
1. Verificar callback URLs no Supabase:
   - Development: `http://localhost:3000/auth/callback`  
   - Production: `https://seu-dominio.com/auth/callback`

2. Verificar configuração OAuth (Google, etc.)

#### ❌ Session Expired
**Sintomas:** Usuário logado é redirecionado para login constantemente
**Solução:**
1. Verificar JWT_SECRET nas variáveis de ambiente
2. Verificar middleware.ts:
```typescript
export const config = {
  matcher: ['/dashboard/:path*', '/api/dashboard/:path*']
}
```

#### ❌ Protected Routes Not Working
**Solução:**
1. Verificar implementação do middleware
2. Testar manualmente as rotas protegidas
3. Verificar logs de auth no Supabase

---

### ⚡ Problemas de Performance

#### ❌ Slow Page Load
**Sintomas:** Página carrega lentamente
**Solução:**
1. Analisar bundle:
```bash
npm run analyze
```

2. Otimizar imagens e implementar lazy loading
3. Verificar Core Web Vitals

#### ❌ Memory Leaks
**Sintomas:** Aplicação fica lenta após uso prolongado
**Solução:**
1. Limpar event listeners no useEffect cleanup
2. Cancelar requests em andamento
3. Limpar timers/intervals

---

### 🌐 Problemas de Domínio

#### ❌ Domain Not Pointing to Vercel
**Sintomas:** Domínio não carrega a aplicação
**Solução:**
1. Verificar DNS no registrar (GoDaddy, etc.):
```
Tipo: CNAME
Nome: www  
Valor: cname.vercel-dns.com

Tipo: A
Nome: @
Valor: 76.76.19.61
```

2. Aguardar propagação DNS (até 48h)

#### ❌ SSL Certificate Issues
**Sintomas:** "Connection not secure" warning
**Solução:**
1. Verificar se domínio está configurado na Vercel
2. Aguardar emissão automática do certificado
3. Forçar renewal se necessário

---

## 🛠️ Ferramentas de Debug

### Logs e Monitoramento
```bash
# Vercel logs
vercel logs https://seu-dominio.com

# Logs locais
npm run dev -- --debug

# Build analysis
npm run analyze
```

### Health Checks
```bash
# API health check
curl https://seu-dominio.com/api/health

# Provider test
curl -X POST https://seu-dominio.com/api/test-key \
  -H "Content-Type: application/json" \
  -d '{"provider": "gemini"}'
```

### Database Diagnostics
```bash
# Conexão com Supabase
psql -h db.xxxxx.supabase.co -U postgres

# Verificar tabelas
\dt

# Verificar dados
SELECT * FROM users LIMIT 5;
```

---

## 🚨 Emergency Recovery

### Rollback Deploy
```bash
# Listar deploys
vercel ls

# Fazer rollback para versão anterior
vercel rollback https://creative-ai-studio-xxxxx.vercel.app
```

### Reset Database
```bash
# CUIDADO: Isso apaga todos os dados!
supabase db reset

# Restaurar backup
psql -h host -U user -d db < backup.sql
```

### Clear All Cache
```bash
# Limpar cache local
rm -rf .next node_modules/.cache

# Invalidar cache da Vercel
vercel env rm CACHE_VERSION
vercel env add CACHE_VERSION $(date +%s)
```

---

## 📞 Onde Buscar Ajuda

### Documentação Oficial
- **Vercel**: [vercel.com/docs](https://vercel.com/docs)
- **Next.js**: [nextjs.org/docs](https://nextjs.org/docs)  
- **Supabase**: [supabase.com/docs](https://supabase.com/docs)
- **Gemini AI**: [ai.google.dev](https://ai.google.dev)

### Monitoramento
- **Vercel Dashboard**: Analytics e logs
- **Sentry**: Error tracking (se configurado)
- **Supabase Dashboard**: Database e auth logs

### Community Support
- **Stack Overflow**: Buscar por erros específicos
- **GitHub Issues**: Reportar bugs dos packages
- **Discord/Reddit**: Comunidades Next.js/Vercel

---

## 🎯 Checklist de Diagnóstico

Quando algo não funciona, siga esta ordem:

- [ ] **1. Verificar variáveis de ambiente**
  ```bash
  vercel env ls
  ```

- [ ] **2. Testar build local**
  ```bash
  npm run build && npm start
  ```

- [ ] **3. Verificar logs**
  ```bash
  vercel logs
  ```

- [ ] **4. Testar APIs isoladamente**
  ```bash
  curl https://app.com/api/health
  ```

- [ ] **5. Verificar status de serviços**
  - Vercel Status Page
  - Supabase Status Page  
  - Google Cloud Status

- [ ] **6. Rollback se crítico**
  ```bash
  vercel rollback
  ```

---

**💡 Lembre-se: A maioria dos problemas são de configuração de ambiente ou API keys!**

---

*Guia atualizado em: ${new Date().toISOString()}*