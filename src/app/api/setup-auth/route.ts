import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const instructions = `
  Para resolver o problema de email:
  
  1. Acesse: https://supabase.com/dashboard/project/rfgblanjqzrizimzrxmb/auth/settings
  
  2. Em "Email confirmation":
     - DESABILITE "Enable email confirmations"
     
  3. Em "Site URL":
     - Adicione: http://localhost:3001
     
  4. Em "Redirect URLs":
     - Adicione: http://localhost:3001/auth/callback
     - Adicione: http://localhost:3001/**
     
  5. Salve as configurações
  
  6. Teste criar conta novamente (não precisará confirmar email)
  `

  return NextResponse.json({
    message: 'Configuração do Supabase necessária',
    instructions
  })
}