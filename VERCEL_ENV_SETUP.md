# 🔧 Configuração de Variáveis de Ambiente - Vercel

## 📋 PASSO A PASSO PARA DEPLOY IMEDIATO

### **1. 🚀 Acesse seu projeto na Vercel**
- Vá para: https://vercel.com/dashboard
- Selecione seu projeto `creative-ai-studio` 
- Vá em: **Settings** → **Environment Variables**

### **2. ⚡ Configure as VARIÁVEIS ESSENCIAIS**

Copie e cole estas variáveis **UMA POR VEZ** na Vercel:

```bash
# === OBRIGATÓRIAS ===
NODE_ENV
```
Valor: `production`

```bash
NEXT_PUBLIC_APP_URL
```
Valor: `https://creative-ai-studio-seu-username.vercel.app` (será gerado automaticamente)

```bash
NEXT_PUBLIC_APP_NAME
```
Valor: `Creative AI Studio`

```bash
GEMINI_API_KEY
```
Valor: `SUA_GEMINI_API_KEY_AQUI`

```bash
OPENAI_API_KEY
```
Valor: `SUA_OPENAI_API_KEY_AQUI` (opcional, mas recomendado)

```bash
JWT_SECRET
```
Valor: `creative-ai-studio-jwt-secret-key-2024-super-secure-string-here`

```bash
ENCRYPTION_KEY
```
Valor: `creative-ai-32-char-encryption!!` (exatamente 32 caracteres)

```bash
ENCRYPTION_SALT
```
Valor: `creative-salt-16!` (exatamente 16 caracteres)

```bash
WEBHOOK_SECRET
```
Valor: `creative-webhook-secret-2024`

---

### **3. 📊 Configure ANALYTICS (Recomendado)**

```bash
NEXT_PUBLIC_ENABLE_ANALYTICS
```
Valor: `true`

```bash
NEXT_PUBLIC_VERCEL_ANALYTICS_ID
```
Valor: `1` (para habilitar Vercel Analytics gratuito)

---

### **4. 🎯 OPCIONAL - Supabase (para persistir dados)**

Se você tem conta no Supabase:

```bash
NEXT_PUBLIC_SUPABASE_URL
```
Valor: `https://seu-projeto.supabase.co`

```bash
NEXT_PUBLIC_SUPABASE_ANON_KEY
```
Valor: `sua_anon_key_aqui`

```bash
SUPABASE_SERVICE_ROLE_KEY
```
Valor: `sua_service_role_key_aqui`

---

## 🚀 COMANDOS DE DEPLOY

### **Opção A: Deploy via Dashboard (Recomendado)**
1. Após configurar as variáveis
2. Vá na aba **Deployments** 
3. Clique **"Redeploy"** no último deploy
4. Aguarde o build completar

### **Opção B: Deploy via CLI**
```bash
# No terminal, dentro da pasta do projeto
vercel --prod

# Se pedir configurações, responda:
# Project name: creative-ai-studio
# Directory: ./
# Auto-deploy: Yes
```

---

## 🌐 CONFIGURAÇÃO DO DOMÍNIO GODADDY

### **Depois do deploy inicial, configure seu domínio:**

1. **No painel da GoDaddy:**
   - Login → Meus Produtos → Domínios → Gerenciar DNS
   
2. **Adicione estes registros DNS:**
   ```
   Tipo: CNAME
   Nome: www
   Valor: cname.vercel-dns.com
   TTL: 3600 (ou padrão)
   
   Tipo: A
   Nome: @ (ou deixe vazio)
   Valor: 76.76.19.61
   TTL: 3600 (ou padrão)
   ```

3. **Na Vercel:**
   - Settings → Domains → Add Domain
   - Digite: `seudominio.com`
   - Digite também: `www.seudominio.com`

4. **Aguarde 5-30 minutos** para propagar

---

## ✅ CHECKLIST DE VERIFICAÇÃO

Após o deploy, teste estas URLs:

- [ ] `https://seu-projeto.vercel.app` - App funcionando
- [ ] `https://seu-projeto.vercel.app/dashboard` - Dashboard carregando  
- [ ] `https://seu-projeto.vercel.app/analytics` - Analytics funcionando
- [ ] Teste gerar uma imagem com Gemini
- [ ] Teste alterar tema claro/escuro
- [ ] Teste em mobile (responsivo)

---

## 🆘 SOLUÇÃO DE PROBLEMAS

### **Erro: "ENCRYPTION_KEY must be exactly 32 characters"**
- Certifique-se que a `ENCRYPTION_KEY` tem exatamente 32 caracteres
- Exemplo: `creative-ai-32-char-encryption!!`

### **Erro: "Missing GEMINI_API_KEY"**
- Verifique se configurou a `GEMINI_API_KEY` na Vercel
- Obtenha uma key gratuita em: https://makersuite.google.com/app/apikey

### **Build Error**
- Verifique os logs na aba "Functions" da Vercel
- Geralmente é variável de ambiente faltando

### **Domain não conecta**
- Aguarde até 48h para DNS propagar
- Verifique se os registros DNS estão corretos
- Use `dig seudominio.com` para testar

---

## 🎯 RESULTADO ESPERADO

Após seguir estes passos, você terá:

✅ **App rodando em:** `https://creative-ai-studio-xxx.vercel.app`
✅ **Geração de imagens** funcionando
✅ **Todas as funcionalidades** ativas  
✅ **SSL automático** configurado
✅ **Performance otimizada** 
✅ **Analytics** coletando dados

**🎉 Seu Creative AI Studio estará LIVE em produção!**

---

*Criado em: ${new Date().toISOString()}*