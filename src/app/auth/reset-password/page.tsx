'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { ArrowLeft, CheckCircle, Eye, EyeOff, Loader2, Sparkles } from 'lucide-react'
import { authService } from '@/lib/auth'

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isValidToken, setIsValidToken] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // Check if we have valid session from the reset link
    const checkSession = async () => {
      try {
        const session = await authService.getSession()
        if (session) {
          setIsValidToken(true)
        } else {
          toast.error('Link de recuperação inválido ou expirado')
          router.push('/auth/forgot-password')
        }
      } catch (error) {
        toast.error('Link de recuperação inválido ou expirado')
        router.push('/auth/forgot-password')
      } finally {
        setChecking(false)
      }
    }

    checkSession()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem')
      return
    }

    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres')
      return
    }

    setIsLoading(true)

    try {
      await authService.updatePassword(password)
      setIsSuccess(true)
      toast.success('Senha alterada com sucesso!')
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (error: any) {
      toast.error(error.message || 'Erro ao alterar senha')
    } finally {
      setIsLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Verificando link de recuperação...</p>
        </div>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 px-4">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-2">
              <div className="bg-primary rounded-lg p-2">
                <Sparkles className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Creative AI Studio</h1>
                <p className="text-sm text-muted-foreground">Senha Alterada</p>
              </div>
            </div>
          </div>

          <Card>
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle className="text-xl">Senha Alterada!</CardTitle>
              <CardDescription>
                Sua senha foi alterada com sucesso. Você será redirecionado para o dashboard.
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="bg-green-50 p-4 rounded-lg text-sm">
                <p className="text-green-800">
                  Agora você pode fazer login com sua nova senha. Por segurança, certifique-se de:
                </p>
                <ul className="list-disc list-inside mt-2 text-green-700 space-y-1">
                  <li>Não compartilhar sua senha</li>
                  <li>Usar uma senha única</li>
                  <li>Fazer logout em dispositivos não confiáveis</li>
                </ul>
              </div>
            </CardContent>
            
            <CardFooter>
              <Button 
                className="w-full"
                onClick={() => router.push('/dashboard')}
              >
                Ir para o Dashboard
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Link Inválido</CardTitle>
            <CardDescription>
              O link de recuperação de senha é inválido ou expirou.
            </CardDescription>
          </CardHeader>
          
          <CardFooter>
            <Link href="/auth/forgot-password" className="w-full">
              <Button className="w-full">
                Solicitar Novo Link
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-2">
            <div className="bg-primary rounded-lg p-2">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Creative AI Studio</h1>
              <p className="text-sm text-muted-foreground">Nova Senha</p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Criar Nova Senha</CardTitle>
            <CardDescription className="text-center">
              Digite sua nova senha abaixo
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Digite sua nova senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirme sua nova senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              {password && confirmPassword && password !== confirmPassword && (
                <p className="text-sm text-red-600">As senhas não coincidem</p>
              )}
              
              <div className="bg-muted p-3 rounded-lg text-xs">
                <p className="font-medium mb-1">Sua senha deve ter:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li className={password.length >= 6 ? 'text-green-600' : ''}>
                    Pelo menos 6 caracteres
                  </li>
                  <li className={/[A-Z]/.test(password) ? 'text-green-600' : ''}>
                    Uma letra maiúscula (recomendado)
                  </li>
                  <li className={/[0-9]/.test(password) ? 'text-green-600' : ''}>
                    Um número (recomendado)
                  </li>
                </ul>
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || !password || !confirmPassword || password !== confirmPassword}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Alterar Senha
              </Button>
            </form>
          </CardContent>

          <CardFooter>
            <Link href="/auth" className="w-full">
              <Button variant="ghost" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para Login
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}