# Configuração do Supabase para Recuperação de Senha

## Problema Identificado
O sistema de recuperação de senha não estava funcionando devido à falta de configuração no Supabase.

## Passos para Configurar

### 1. Acessar o Dashboard do Supabase
1. Acesse https://supabase.com/dashboard
2. Faça login na sua conta
3. Selecione o projeto: **rfgblanjqzrizimzrxmb**

### 2. Configurar URLs de Redirecionamento
1. No menu lateral, vá em **Authentication** > **URL Configuration**
2. Adicione as seguintes URLs em **Redirect URLs**:
   - `http://localhost:3000/auth/reset-password`
   - `http://localhost:3000/auth/callback`
   - `https://creative-ai-studio-xi.vercel.app/auth/reset-password` (produção)
   - `https://creative-ai-studio-xi.vercel.app/auth/callback` (produção)

### 3. Configurar Template de Email
1. Vá em **Authentication** > **Email Templates**
2. Selecione **Reset Password**
3. Copie o conteúdo do arquivo `email-templates/reset-password.html`
4. Cole no editor de template do Supabase
5. Certifique-se de que a variável `{{ .ConfirmationURL }}` está presente no template

### 4. Configurar SMTP (Opcional - Para produção)
Para produção, configure um provedor de email SMTP:

1. Vá em **Project Settings** > **Auth** > **SMTP Settings**
2. Configure com seu provedor (Resend, SendGrid, etc.):
   - **SMTP Host**: smtp.resend.com
   - **SMTP Port**: 587
   - **SMTP User**: resend
   - **SMTP Password**: Sua chave API do Resend
   - **Sender Email**: contact@workfusion.pro
   - **Sender Name**: Creative AI Studio

### 5. Configurar Rate Limiting
1. Vá em **Project Settings** > **Auth** > **Rate Limits**
2. Configure:
   - **Password Reset**: 5 tentativas por hora por email

### 6. Testar a Configuração
1. Execute o servidor de desenvolvimento: `npm run dev`
2. Acesse http://localhost:3000/auth/forgot-password
3. Digite um email válido cadastrado
4. Verifique se o email é recebido
5. Clique no link e teste a redefinição de senha

## Código Atualizado
O arquivo `src/lib/auth.ts` foi atualizado para:
- Melhor tratamento de erros
- Logs mais detalhados para debugging
- Retorno adequado dos dados

## Verificação
Para verificar se está funcionando:

```bash
# Verificar logs do servidor
npm run dev

# No console do navegador (F12), verificar:
# 1. Sem erros CORS
# 2. Requisição bem-sucedida para Supabase
# 3. Email enviado (verificar inbox/spam)
```

## Troubleshooting

### Email não está sendo enviado
- Verifique se o email existe no sistema
- Verifique o console do navegador para erros
- Verifique os logs do Supabase Dashboard
- Verifique se as URLs estão corretas nas configurações

### Link de recuperação não funciona
- Verifique se a URL de redirecionamento está na lista de URLs permitidas
- Verifique se o link não expirou (1 hora)
- Verifique se há erros no console do navegador

### Erro de CORS
- Adicione o domínio nas configurações do Supabase
- Verifique se as variáveis de ambiente estão corretas

## Próximos Passos
1. Configurar SMTP para produção
2. Testar em produção (Vercel)
3. Adicionar analytics para monitorar taxa de sucesso
