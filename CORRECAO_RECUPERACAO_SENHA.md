# Correção do Erro de Recuperação de Senha

## Erro Original
```
Failed to execute 'fetch' on 'Window': Invalid value
```

## Causa do Problema
O erro ocorria porque as variáveis de ambiente do Supabase não estavam sendo carregadas corretamente no cliente, resultando em uma URL `undefined` sendo passada para o método `fetch`.

## Correções Aplicadas

### 1. Melhorias no Cliente Supabase (`src/lib/supabase.ts`)

**Mudanças:**
- ✅ Adicionada validação de URL antes de criar o cliente
- ✅ Adicionados logs detalhados para debugging
- ✅ Melhor tratamento de erros com mensagens específicas
- ✅ Fallback para variáveis de ambiente do window

**Código atualizado:**
```typescript
export const createClient = () => {
  // Busca variáveis de ambiente tanto do processo quanto do window
  const supabaseUrl = typeof window !== 'undefined'
    ? (window as any).ENV?.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    : process.env.NEXT_PUBLIC_SUPABASE_URL

  const supabaseAnonKey = typeof window !== 'undefined'
    ? (window as any).ENV?.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Valida se as variáveis existem
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(`Missing Supabase environment variables`)
  }

  // Valida formato da URL
  try {
    new URL(supabaseUrl)
  } catch (e) {
    throw new Error(`Invalid Supabase URL format: ${supabaseUrl}`)
  }

  return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  })
}
```

### 2. Configuração do Next.js (`next.config.mjs`)

**Adicionado:**
```javascript
env: {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
}
```

### 3. Script de Verificação (`verify-env.js`)

Criado script para verificar se as variáveis de ambiente estão configuradas corretamente.

**Como usar:**
```bash
node verify-env.js
```

## Como Testar

### 1. Verificar Variáveis de Ambiente
```bash
cd creative-ai-studio
node verify-env.js
```

Você deve ver:
```
✓ .env.local file exists
✓ NEXT_PUBLIC_SUPABASE_URL: https://...
✓ NEXT_PUBLIC_SUPABASE_ANON_KEY: Present
```

### 2. Reiniciar o Servidor
```bash
# Parar o servidor atual (Ctrl+C)
# Iniciar novamente
npm run dev
```

### 3. Testar Recuperação de Senha

1. Acesse: http://localhost:3000/auth/forgot-password
2. Digite um email válido cadastrado
3. Clique em "Enviar Link de Recuperação"

**O que você deve ver no console do navegador (F12):**
```
Supabase Client Config: {
  url: "https://rfgblanjqz...",
  key: "Present",
  env: "development"
}
```

### 4. Verificar no Console

Se ainda houver erro, verifique:

**Console do navegador (F12) deve mostrar:**
- ✅ Supabase Client Config com URL presente
- ✅ Sem erros de "Invalid value"
- ✅ Requisição para Supabase completada

**Se aparecer erro:**
- Verifique se as variáveis estão no `.env.local`
- Reinicie o servidor completamente
- Limpe o cache do navegador (Ctrl+Shift+R)

## Próximos Passos

1. **Configure o Supabase Dashboard** (veja `SUPABASE_CONFIG.md`):
   - Adicionar URLs de redirecionamento
   - Configurar template de email
   - Configurar SMTP (opcional)

2. **Teste o fluxo completo:**
   - Solicitar recuperação
   - Receber email
   - Clicar no link
   - Redefinir senha

## Troubleshooting

### Erro persiste após correções

**Solução 1: Limpar cache e reiniciar**
```bash
# Parar servidor
rm -rf .next
npm run dev
```

**Solução 2: Verificar .env.local**
```bash
cat .env.local | grep SUPABASE
```

Deve mostrar:
```
NEXT_PUBLIC_SUPABASE_URL=https://rfgblanjqzrizimzrxmb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

**Solução 3: Verificar no código**
Adicione um console.log temporário em `src/app/auth/forgot-password/page.tsx`:
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  console.log('Environment check:', {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  })
  // ... resto do código
}
```

## Arquivos Modificados

1. ✅ `src/lib/supabase.ts` - Cliente Supabase com validação
2. ✅ `src/lib/auth.ts` - Melhor tratamento de erros
3. ✅ `next.config.mjs` - Exposição de variáveis de ambiente
4. ✅ `verify-env.js` - Script de verificação (novo)
5. ✅ `SUPABASE_CONFIG.md` - Documentação de configuração
6. ✅ `CORRECAO_RECUPERACAO_SENHA.md` - Este arquivo

## Suporte

Se o problema persistir:

1. Verifique os logs do console do navegador
2. Verifique os logs do servidor Next.js
3. Execute `node verify-env.js` para verificar configuração
4. Verifique se o servidor foi reiniciado após mudanças
