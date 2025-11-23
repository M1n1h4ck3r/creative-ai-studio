'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Icons } from '@/components/ui/icons'
import { toast } from 'sonner'
import { Loader2, Sparkles } from 'lucide-react'

function AuthContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/dashboard'
  const { signIn, signUp, signInWithGoogle, loading } = useAuth()

  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('signin')

  const handleEmailAuth = async (e: React.FormEvent<HTMLFormElement>, isSignUp: boolean) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('fullName') as string

    try {
      if (isSignUp) {
        await signUp(email, password, fullName)
        toast.success('Conta criada com sucesso! Bem-vindo!')
        router.refresh()
        router.push(redirectTo)
      } else {
        await signIn(email, password)
        toast.success('Login realizado com sucesso!')
        router.refresh()
        router.push(redirectTo)
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro na autenticação')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    try {
      await signInWithGoogle()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao conectar com Google')
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 px-4'>
      <div className='w-full max-w-md'>
        <div className='flex items-center justify-center mb-8'>
          <div className='flex items-center space-x-2'>
            <div className='bg-primary rounded-lg p-2'>
              <Sparkles className='h-6 w-6 text-primary-foreground' />
            </div>
            <div>
              <h1 className='text-2xl font-bold'>Creative AI Studio</h1>
              <p className='text-sm text-muted-foreground'>Gere criativos incríveis com IA</p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader className='space-y-1'>
            <CardTitle className='text-2xl text-center'>Bem-vindo</CardTitle>
            <CardDescription className='text-center'>
              Entre na sua conta ou crie uma nova para começar
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
              <TabsList className='grid w-full grid-cols-2'>
                <TabsTrigger value='signin'>Entrar</TabsTrigger>
                <TabsTrigger value='signup'>Criar Conta</TabsTrigger>
              </TabsList>

              <TabsContent value='signin' className='space-y-4 mt-6'>
                <form onSubmit={(e) => handleEmailAuth(e, false)} className='space-y-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='signin-email'>Email</Label>
                    <Input
                      id='signin-email'
                      name='email'
                      type='email'
                      placeholder='seu@email.com'
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='signin-password'>Senha</Label>
                    <Input
                      id='signin-password'
                      name='password'
                      type='password'
                      placeholder='********'
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <Button type='submit' className='w-full' disabled={isLoading || loading}>
                    {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                    Entrar
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value='signup' className='space-y-4 mt-6'>
                <form onSubmit={(e) => handleEmailAuth(e, true)} className='space-y-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='signup-name'>Nome Completo</Label>
                    <Input
                      id='signup-name'
                      name='fullName'
                      type='text'
                      placeholder='Seu nome'
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='signup-email'>Email</Label>
                    <Input
                      id='signup-email'
                      name='email'
                      type='email'
                      placeholder='seu@email.com'
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='signup-password'>Senha</Label>
                    <Input
                      id='signup-password'
                      name='password'
                      type='password'
                      placeholder='********'
                      required
                      minLength={6}
                      disabled={isLoading}
                    />
                  </div>
                  <Button type='submit' className='w-full' disabled={isLoading || loading}>
                    {isLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                    Criar Conta
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className='relative my-6'>
              <div className='absolute inset-0 flex items-center'>
                <span className='w-full border-t' />
              </div>
              <div className='relative flex justify-center text-xs uppercase'>
                <span className='bg-background px-2 text-muted-foreground'>
                  Ou continue com
                </span>
              </div>
            </div>

            <Button
              variant='outline'
              className='w-full'
              onClick={handleGoogleAuth}
              disabled={isLoading || loading}
            >
              <Icons.google className='mr-2 h-4 w-4' />
              Google
            </Button>
          </CardContent>

          <CardFooter className='flex flex-col space-y-2 text-sm text-center text-muted-foreground'>
            {activeTab === 'signin' && (
              <Link href='/auth/forgot-password' className='hover:text-primary'>
                Esqueceu sua senha?
              </Link>
            )}
            <p className='text-xs'>
              Ao continuar, você concorda com nossos{' '}
              <Link href='/terms' className='underline hover:text-primary'>
                Termos de Uso
              </Link>{' '}
              e{' '}
              <Link href='/privacy' className='underline hover:text-primary'>
                Política de Privacidade
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <AuthContent />
    </Suspense>
  )
}