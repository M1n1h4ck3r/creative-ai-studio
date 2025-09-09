# 🚀 Guia de Deploy - Creative AI Studio na Vercel com Domínio GoDaddy

## 📋 Todo List de Deploy
- [ ] Configure environment variables for production
- [ ] Setup domain configuration with GoDaddy  
- [ ] Deploy application to Vercel
- [ ] Configure SSL and security settings
- [ ] Test production deployment and functionality

## 🔧 Variáveis de Ambiente Obrigatórias

### ⚡ **ESSENCIAIS para funcionamento básico:**
```bash
# App básico
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://seudominio.com
NEXT_PUBLIC_APP_NAME="Creative AI Studio"

# AI Providers (pelo menos 1 é obrigatório)
GEMINI_API_KEY=sua_gemini_key_aqui
OPENAI_API_KEY=sua_openai_key_aqui

# Segurança (OBRIGATÓRIOS)
JWT_SECRET=seu-jwt-secreto-aqui-minimo-32-caracteres-longo
ENCRYPTION_KEY=sua-chave-32-caracteres-aqui-deve-ter-32-chars
ENCRYPTION_SALT=seu-salt-unico-aqui-16-chars
WEBHOOK_SECRET=seu-webhook-secret-aqui
```

### 🎯 **RECOMENDADAS para produção:**
```bash
# Supabase (para persistência de dados)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx

# Analytics
NEXT_PUBLIC_GA_ID=G-XXXXX
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=xxxxx

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

### 🔍 **OPCIONAIS para funcionalidades extras:**
```bash
# Mais AI Providers
REPLICATE_API_TOKEN=xxxxx
ANTHROPIC_API_KEY=xxxxx
HUGGINGFACE_API_KEY=xxxxx

# Email (Resend)
RESEND_API_KEY=re_xxxxx
EMAIL_FROM=noreply@seudominio.com

# Monitoramento
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx

# Analytics Externos
MIXPANEL_TOKEN=xxxxx
```

## 🌐 Configuração do Domínio GoDaddy

### **Passo 1: Deploy inicial na Vercel (sem domínio custom)**

1. **Conecte seu repositório na Vercel:**
```bash
# Se ainda não tem conta na Vercel
npm i -g vercel
vercel login
```

2. **Configure as variáveis de ambiente na Vercel:**
   - Acesse [vercel.com/dashboard](https://vercel.com/dashboard)
   - Selecione seu projeto → Settings → Environment Variables
   - Adicione as variáveis **ESSENCIAIS** listadas acima

3. **Deploy inicial:**
```bash
vercel --prod
```

### **Passo 2: Configuração no GoDaddy**

1. **Acesse o painel da GoDaddy:**
   - Faça login em [godaddy.com](https://godaddy.com)
   - Vá em "Meus Produtos" → "Domínios"
   - Clique em "Gerenciar" no seu domínio

2. **Configure os DNS:**
   - Vá para "Configurações de DNS"
   - **Adicione/Edite os registros:**

```
Tipo: CNAME
Nome: www
Valor: cname.vercel-dns.com
TTL: 3600

Tipo: A  
Nome: @
Valor: 76.76.19.61
TTL: 3600
```

### **Passo 3: Configuração na Vercel**

1. **Adicione o domínio na Vercel:**
   - No dashboard da Vercel → Seu projeto → Settings → Domains
   - Adicione: `seudominio.com` e `www.seudominio.com`

2. **Aguarde a verificação** (pode levar até 48h, mas geralmente 5-10 min)

## 📦 Deploy Passo a Passo

### **Opção A: Deploy via Dashboard Vercel (Recomendado)**

1. **Conecte repositório:**
   - Vá para [vercel.com/new](https://vercel.com/new)
   - Conecte sua conta GitHub/GitLab
   - Selecione o repositório `creative-ai-studio`

2. **Configure build:**
   ```
   Framework: Next.js
   Root Directory: ./
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install
   ```

3. **Adicione variáveis de ambiente** (pelo menos as ESSENCIAIS)

4. **Deploy!**

### **Opção B: Deploy via CLI**

```bash
# No diretório do projeto
cd creative-ai-studio

# Login na Vercel
vercel login

# Deploy
vercel

# Deploy para produção
vercel --prod
```

## 🔒 Configuração de Segurança

### **Headers de Segurança (já configurados no código):**
- CSP (Content Security Policy)
- HSTS (HTTP Strict Transport Security)  
- X-Frame-Options
- X-Content-Type-Options
- Referrer-Policy

### **SSL/HTTPS:**
- ✅ **Automático na Vercel** - SSL gratuito via Let's Encrypt
- ✅ **Força HTTPS** - Redirecionamento automático
- ✅ **HSTS** - Headers de segurança já configurados

## ⚙️ Configurações de Produção

### **1. Otimizações já implementadas:**
- [x] Bundle splitting e lazy loading
- [x] Image optimization (WebP/AVIF)
- [x] Gzip compression
- [x] Cache headers otimizados

### **2. Configurações do next.config.mjs:**
```javascript
// Já configurado para produção
const nextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-*']
  },
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384]
  }
}
```

## 🧪 Teste de Produção

### **Checklist de Funcionalidades:**
- [ ] Geração de imagens funciona
- [ ] Sistema de variações ativo
- [ ] Coleções salvam/carregam corretamente
- [ ] Compartilhamento social funciona
- [ ] Editor de imagem operacional
- [ ] Analytics coletando dados
- [ ] Tema claro/escuro funcionando
- [ ] Responsividade mobile OK

### **Comandos de teste local com produção:**
```bash
# Build de produção local
npm run build

# Teste da build
npm start

# Análise do bundle
npm run analyze
```

## 🚀 Scripts Úteis de Deploy

### **Script de deploy completo:**
```bash
#!/bin/bash
echo "🚀 Iniciando deploy do Creative AI Studio..."

# Build local para testar
echo "📦 Building aplicação..."
npm run build

# Deploy para Vercel
echo "🌐 Deploy para Vercel..."
vercel --prod

# Teste automatizado
echo "🧪 Testando deploy..."
curl -f https://seudominio.com || exit 1

echo "✅ Deploy concluído com sucesso!"
```

## 📊 Monitoramento Pós-Deploy

### **Métricas importantes:**
- **Core Web Vitals** via Vercel Analytics
- **Error Rate** via Sentry
- **Usage Metrics** via sistema de analytics interno
- **Performance** via Lighthouse

### **Logs e Debug:**
```bash
# Ver logs da Vercel
vercel logs seudominio.com

# Funcionalidades da Vercel
vercel env ls    # Listar env vars
vercel domains   # Gerenciar domínios  
vercel inspect   # Debug de deploy
```

## 🎯 Próximos Passos Após Deploy

1. **Configure monitoramento**
2. **Setup backup automático** (se usando Supabase)
3. **Configure alertas** de erro/performance
4. **Documente APIs** para futuros desenvolvedores
5. **Setup CI/CD** para deploys automáticos

---

## ⚡ **Início Rápido - Só o Essencial**

Se quiser fazer deploy AGORA com o mínimo necessário:

```bash
# 1. Suba para Vercel
vercel --prod

# 2. Configure APENAS estas variáveis na Vercel:
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://seu-projeto.vercel.app
GEMINI_API_KEY=sua_gemini_key
JWT_SECRET=qualquer-string-de-32-caracteres-ou-mais
ENCRYPTION_KEY=exatamente-32-caracteres-aqui-ok!
ENCRYPTION_SALT=exatos-16-chars!!

# 3. Configure domínio depois (opcional)
```

**🎉 Pronto! Sua aplicação estará online e funcional!**

---

*Guia criado em: ${new Date().toISOString()}*