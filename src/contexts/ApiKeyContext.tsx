'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from './AuthContext'
import { decrypt } from '@/lib/encryption'
import { toast } from 'sonner'
import type { ApiKey as DatabaseApiKey, UpdateApiKey } from '@/types/supabase'

interface ApiKey extends DatabaseApiKey {
  decrypted_key?: string
}

interface ApiKeyContextType {
  apiKeys: ApiKey[]
  loading: boolean
  getApiKey: (provider: string) => string | null
  refreshApiKeys: () => Promise<void>
  hasApiKey: (provider: string) => boolean
  updateLastUsed: (provider: string) => Promise<void>
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined)

export function ApiKeyProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const loadApiKeys = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Decrypt the keys client-side is not secure
      // Keys should only be decrypted server-side when needed
      const keysWithoutDecryption = (data || []).map(key => ({
        ...key,
        // Don't decrypt keys on client side for security
        decrypted_key: undefined
      }))

      setApiKeys(keysWithoutDecryption)
    } catch (error: any) {
      console.error('Error loading API keys:', error)
      toast.error('Erro ao carregar API keys')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      loadApiKeys()
    } else {
      setApiKeys([])
      setLoading(false)
    }
  }, [user, loadApiKeys])

  const refreshApiKeys = async () => {
    await loadApiKeys()
  }

  const getApiKey = (provider: string): string | null => {
    const key = apiKeys.find(k => k.provider === provider && k.is_active)
    // Return encrypted key - it will be decrypted server-side when needed
    return key?.encrypted_key || null
  }

  const hasApiKey = (provider: string): boolean => {
    return apiKeys.some(k => k.provider === provider && k.is_active)
  }

  const updateLastUsed = async (provider: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('api_keys')
        .update({ last_used_at: new Date().toISOString() } satisfies UpdateApiKey)
        .eq('user_id', user.id)
        .eq('provider', provider)
        .eq('is_active', true)

      if (error) throw error
      
      // Update local state
      setApiKeys(prev => prev.map(key => 
        key.provider === provider 
          ? { ...key, last_used_at: new Date().toISOString() }
          : key
      ))
    } catch (error) {
      console.error('Error updating last used:', error)
    }
  }

  const value = {
    apiKeys,
    loading,
    getApiKey,
    refreshApiKeys,
    hasApiKey,
    updateLastUsed,
  }

  return (
    <ApiKeyContext.Provider value={value}>
      {children}
    </ApiKeyContext.Provider>
  )
}

export function useApiKeys() {
  const context = useContext(ApiKeyContext)
  if (context === undefined) {
    throw new Error('useApiKeys must be used within an ApiKeyProvider')
  }
  return context
}