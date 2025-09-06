'use client'

import { createClient } from '@/lib/supabase'
import { AuditLogger } from '@/lib/audit'

export interface PluginMetadata {
  id: string
  name: string
  version: string
  description: string
  author: string
  website?: string
  repository?: string
  license: string
  keywords: string[]
  category: 'ai-provider' | 'image-processor' | 'workflow' | 'integration' | 'utility' | 'template'
  icon?: string
  screenshots?: string[]
  minimal_app_version: string
  dependencies?: Record<string, string>
}

export interface PluginHook {
  name: string
  description: string
  parameters: PluginParameter[]
  returns?: PluginParameter
}

export interface PluginParameter {
  name: string
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  description: string
  required: boolean
  default?: any
  validation?: {
    min?: number
    max?: number
    pattern?: string
    options?: string[]
  }
}

export interface PluginConfig {
  enabled: boolean
  settings: Record<string, any>
  permissions: {
    network_access: boolean
    file_system_access: boolean
    api_access: boolean
    storage_access: boolean
  }
  resource_limits: {
    max_memory_mb: number
    max_execution_time_ms: number
    max_api_calls_per_minute: number
  }
}

export interface InstalledPlugin {
  id: string
  user_id: string
  plugin_id: string
  version: string
  config: PluginConfig
  installed_at: Date
  updated_at: Date
  enabled: boolean
  status: 'active' | 'inactive' | 'error' | 'suspended'
  error_message?: string
  usage_stats: {
    executions: number
    last_execution: Date | null
    total_runtime_ms: number
    errors: number
  }
}

export interface PluginExecution {
  id: string
  plugin_id: string
  user_id: string
  hook_name: string
  input_data: any
  output_data?: any
  status: 'running' | 'completed' | 'failed' | 'timeout'
  started_at: Date
  completed_at?: Date
  execution_time_ms?: number
  error_message?: string
  resource_usage: {
    memory_peak_mb: number
    api_calls: number
  }
}

export interface PluginStore {
  id: string
  metadata: PluginMetadata
  code: string // JavaScript/TypeScript code
  manifest: {
    hooks: PluginHook[]
    permissions: string[]
    settings_schema: PluginParameter[]
  }
  verification: {
    verified: boolean
    verified_at?: Date
    verified_by?: string
    security_scan_passed: boolean
    code_review_passed: boolean
  }
  stats: {
    downloads: number
    active_installations: number
    average_rating: number
    review_count: number
  }
  published_at: Date
  updated_at: Date
}

// Plugin execution sandbox
class PluginSandbox {
  private executionContext: Record<string, any>
  private timeoutId: NodeJS.Timeout | null = null

  constructor(
    private plugin: InstalledPlugin,
    private pluginCode: string,
    private hooks: Record<string, Function>
  ) {
    this.executionContext = this.createSafeContext()
  }

  private createSafeContext(): Record<string, any> {
    // Create a restricted execution context
    return {
      // Safe globals
      console: {
        log: (...args: any[]) => console.log(`[Plugin:${this.plugin.plugin_id}]`, ...args),
        warn: (...args: any[]) => console.warn(`[Plugin:${this.plugin.plugin_id}]`, ...args),
        error: (...args: any[]) => console.error(`[Plugin:${this.plugin.plugin_id}]`, ...args)
      },
      
      // Plugin API
      plugin: {
        id: this.plugin.plugin_id,
        version: this.plugin.version,
        config: this.plugin.config.settings,
        
        // Safe HTTP client
        http: {
          get: async (url: string, options: any = {}) => {
            if (!this.plugin.config.permissions.network_access) {
              throw new Error('Network access not permitted')
            }
            return this.makeHttpRequest('GET', url, options)
          },
          post: async (url: string, data: any, options: any = {}) => {
            if (!this.plugin.config.permissions.network_access) {
              throw new Error('Network access not permitted')
            }
            return this.makeHttpRequest('POST', url, { ...options, body: data })
          }
        },
        
        // Storage API
        storage: {
          get: async (key: string) => {
            if (!this.plugin.config.permissions.storage_access) {
              throw new Error('Storage access not permitted')
            }
            return this.getPluginStorage(key)
          },
          set: async (key: string, value: any) => {
            if (!this.plugin.config.permissions.storage_access) {
              throw new Error('Storage access not permitted')
            }
            return this.setPluginStorage(key, value)
          },
          delete: async (key: string) => {
            if (!this.plugin.config.permissions.storage_access) {
              throw new Error('Storage access not permitted')
            }
            return this.deletePluginStorage(key)
          }
        },
        
        // App API hooks
        hooks: this.hooks
      },

      // Utility functions
      JSON,
      Date,
      Math,
      String,
      Number,
      Boolean,
      Array,
      Object,
      RegExp,
      
      // Async/Promise support
      Promise,
      setTimeout: (fn: Function, ms: number) => {
        if (ms > this.plugin.config.resource_limits.max_execution_time_ms) {
          throw new Error('Timeout exceeds allowed limit')
        }
        return setTimeout(fn, ms)
      },
      
      // Prevent access to dangerous globals
      window: undefined,
      document: undefined,
      global: undefined,
      process: undefined,
      require: undefined,
      module: undefined,
      exports: undefined,
      eval: undefined,
      Function: undefined
    }
  }

  async executeHook(hookName: string, parameters: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now()
      
      // Set execution timeout
      this.timeoutId = setTimeout(() => {
        reject(new Error(`Plugin execution timeout (${this.plugin.config.resource_limits.max_execution_time_ms}ms)`))
      }, this.plugin.config.resource_limits.max_execution_time_ms)

      try {
        // Create function from plugin code
        const pluginFunction = new Function(
          ...Object.keys(this.executionContext),
          `
            ${this.pluginCode}
            
            // Execute the specific hook
            if (typeof ${hookName} === 'function') {
              return ${hookName}(${JSON.stringify(parameters)});
            } else {
              throw new Error('Hook ${hookName} not found in plugin');
            }
          `
        )

        // Execute with restricted context
        const result = pluginFunction.apply(null, Object.values(this.executionContext))

        // Handle async results
        if (result && typeof result.then === 'function') {
          result
            .then((asyncResult: any) => {
              this.cleanup()
              resolve(asyncResult)
            })
            .catch((error: Error) => {
              this.cleanup()
              reject(error)
            })
        } else {
          this.cleanup()
          resolve(result)
        }

      } catch (error) {
        this.cleanup()
        reject(error)
      }
    })
  }

  private cleanup() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }
  }

  private async makeHttpRequest(method: string, url: string, options: any): Promise<any> {
    // Implement rate-limited HTTP client
    // This would integrate with the existing rate limiting system
    const response = await fetch(url, {
      method,
      ...options,
      headers: {
        'User-Agent': `CreativeAI-Plugin/${this.plugin.plugin_id}`,
        ...options.headers
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const contentType = response.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      return response.json()
    } else if (contentType?.includes('text/')) {
      return response.text()
    } else {
      return response.arrayBuffer()
    }
  }

  private async getPluginStorage(key: string): Promise<any> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('plugin_storage')
      .select('value')
      .eq('plugin_id', this.plugin.id)
      .eq('key', key)
      .single()

    if (error && error.code !== 'PGRST116') { // Not found is OK
      throw new Error(`Storage error: ${error.message}`)
    }

    return data?.value || null
  }

  private async setPluginStorage(key: string, value: any): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('plugin_storage')
      .upsert({
        plugin_id: this.plugin.id,
        key,
        value
      })

    if (error) {
      throw new Error(`Storage error: ${error.message}`)
    }
  }

  private async deletePluginStorage(key: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('plugin_storage')
      .delete()
      .eq('plugin_id', this.plugin.id)
      .eq('key', key)

    if (error) {
      throw new Error(`Storage error: ${error.message}`)
    }
  }
}

class PluginManager {
  private supabase = createClient()
  private auditLogger = new AuditLogger()
  private installedPlugins = new Map<string, InstalledPlugin>()
  private pluginSandboxes = new Map<string, PluginSandbox>()

  // Built-in hooks that plugins can use
  private appHooks = {
    // Generation hooks
    beforeGeneration: async (params: any) => {
      // Allow plugins to modify generation parameters
      return params
    },
    
    afterGeneration: async (result: any) => {
      // Allow plugins to process generation results
      return result
    },
    
    // Template hooks
    registerTemplate: async (template: any) => {
      // Allow plugins to register custom templates
      console.log('Plugin registered template:', template)
    },
    
    // Export hooks
    beforeExport: async (data: any, format: string) => {
      // Allow plugins to modify export data
      return data
    },
    
    afterExport: async (result: any) => {
      // Allow plugins to process export results
      return result
    },
    
    // UI hooks
    registerMenuItem: async (menuItem: any) => {
      // Allow plugins to add menu items
      console.log('Plugin registered menu item:', menuItem)
    },
    
    registerToolbarButton: async (button: any) => {
      // Allow plugins to add toolbar buttons
      console.log('Plugin registered toolbar button:', button)
    }
  }

  async initialize(userId: string): Promise<void> {
    try {
      // Load user's installed plugins
      await this.loadInstalledPlugins(userId)
      
      // Initialize enabled plugins
      for (const [pluginId, plugin] of this.installedPlugins) {
        if (plugin.enabled && plugin.status === 'active') {
          await this.initializePlugin(plugin)
        }
      }

      await this.auditLogger.log(
        'plugin_manager_initialized',
        'system',
        { 
          installed_plugins: this.installedPlugins.size,
          active_plugins: Array.from(this.installedPlugins.values()).filter(p => p.enabled).length
        },
        'info',
        userId
      )
    } catch (error) {
      console.error('Plugin manager initialization error:', error)
    }
  }

  private async loadInstalledPlugins(userId: string): Promise<void> {
    const { data: plugins, error } = await this.supabase
      .from('installed_plugins')
      .select('*')
      .eq('user_id', userId)

    if (error) {
      throw new Error(`Failed to load installed plugins: ${error.message}`)
    }

    for (const plugin of plugins || []) {
      this.installedPlugins.set(plugin.plugin_id, plugin as InstalledPlugin)
    }
  }

  private async initializePlugin(plugin: InstalledPlugin): Promise<void> {
    try {
      // Get plugin code from store
      const { data: storePlugin, error } = await this.supabase
        .from('plugin_store')
        .select('code, manifest')
        .eq('id', plugin.plugin_id)
        .single()

      if (error) {
        throw new Error(`Plugin code not found: ${error.message}`)
      }

      // Create sandbox
      const sandbox = new PluginSandbox(plugin, storePlugin.code, this.appHooks)
      this.pluginSandboxes.set(plugin.plugin_id, sandbox)

      // Execute initialization hook if exists
      try {
        await sandbox.executeHook('initialize', { config: plugin.config.settings })
      } catch (error) {
        console.warn(`Plugin ${plugin.plugin_id} initialization hook failed:`, error)
      }

    } catch (error) {
      console.error(`Failed to initialize plugin ${plugin.plugin_id}:`, error)
      
      // Mark plugin as error
      await this.updatePluginStatus(plugin.plugin_id, 'error', error.message)
    }
  }

  async installPlugin(userId: string, pluginId: string, version?: string): Promise<boolean> {
    try {
      // Get plugin from store
      const { data: storePlugin, error } = await this.supabase
        .from('plugin_store')
        .select('*')
        .eq('id', pluginId)
        .single()

      if (error) {
        throw new Error(`Plugin not found: ${error.message}`)
      }

      // Check if already installed
      if (this.installedPlugins.has(pluginId)) {
        throw new Error('Plugin already installed')
      }

      // Create installation record
      const installation: Omit<InstalledPlugin, 'id'> = {
        user_id: userId,
        plugin_id: pluginId,
        version: version || storePlugin.metadata.version,
        config: {
          enabled: false, // Start disabled for safety
          settings: {},
          permissions: {
            network_access: false,
            file_system_access: false,
            api_access: false,
            storage_access: true
          },
          resource_limits: {
            max_memory_mb: 50,
            max_execution_time_ms: 5000,
            max_api_calls_per_minute: 10
          }
        },
        installed_at: new Date(),
        updated_at: new Date(),
        enabled: false,
        status: 'inactive',
        usage_stats: {
          executions: 0,
          last_execution: null,
          total_runtime_ms: 0,
          errors: 0
        }
      }

      const { data: installed, error: installError } = await this.supabase
        .from('installed_plugins')
        .insert(installation)
        .select()
        .single()

      if (installError) {
        throw new Error(`Installation failed: ${installError.message}`)
      }

      this.installedPlugins.set(pluginId, installed as InstalledPlugin)

      // Update download counter
      await this.supabase.rpc('increment_plugin_downloads', { plugin_id: pluginId })

      await this.auditLogger.log(
        'plugin_installed',
        'system',
        { 
          plugin_id: pluginId,
          plugin_name: storePlugin.metadata.name,
          version: installation.version
        },
        'info',
        userId
      )

      return true
    } catch (error) {
      console.error('Plugin installation error:', error)
      
      await this.auditLogger.log(
        'plugin_installation_failed',
        'system',
        { 
          plugin_id: pluginId,
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        'error',
        userId
      )
      
      return false
    }
  }

  async uninstallPlugin(userId: string, pluginId: string): Promise<boolean> {
    try {
      // Remove from memory
      this.installedPlugins.delete(pluginId)
      this.pluginSandboxes.delete(pluginId)

      // Remove from database
      const { error } = await this.supabase
        .from('installed_plugins')
        .delete()
        .eq('user_id', userId)
        .eq('plugin_id', pluginId)

      if (error) {
        throw new Error(`Uninstallation failed: ${error.message}`)
      }

      // Clean up plugin storage
      await this.supabase
        .from('plugin_storage')
        .delete()
        .eq('plugin_id', pluginId)

      await this.auditLogger.log(
        'plugin_uninstalled',
        'system',
        { plugin_id: pluginId },
        'info',
        userId
      )

      return true
    } catch (error) {
      console.error('Plugin uninstallation error:', error)
      return false
    }
  }

  async enablePlugin(userId: string, pluginId: string): Promise<boolean> {
    try {
      const plugin = this.installedPlugins.get(pluginId)
      if (!plugin) {
        throw new Error('Plugin not installed')
      }

      // Update database
      const { error } = await this.supabase
        .from('installed_plugins')
        .update({ 
          enabled: true, 
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('plugin_id', pluginId)

      if (error) {
        throw new Error(`Failed to enable plugin: ${error.message}`)
      }

      // Update memory
      plugin.enabled = true
      plugin.status = 'active'

      // Initialize plugin
      await this.initializePlugin(plugin)

      await this.auditLogger.log(
        'plugin_enabled',
        'system',
        { plugin_id: pluginId },
        'info',
        userId
      )

      return true
    } catch (error) {
      console.error('Plugin enable error:', error)
      return false
    }
  }

  async disablePlugin(userId: string, pluginId: string): Promise<boolean> {
    try {
      const plugin = this.installedPlugins.get(pluginId)
      if (!plugin) {
        throw new Error('Plugin not installed')
      }

      // Update database
      const { error } = await this.supabase
        .from('installed_plugins')
        .update({ 
          enabled: false, 
          status: 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('plugin_id', pluginId)

      if (error) {
        throw new Error(`Failed to disable plugin: ${error.message}`)
      }

      // Update memory and cleanup
      plugin.enabled = false
      plugin.status = 'inactive'
      this.pluginSandboxes.delete(pluginId)

      await this.auditLogger.log(
        'plugin_disabled',
        'system',
        { plugin_id: pluginId },
        'info',
        userId
      )

      return true
    } catch (error) {
      console.error('Plugin disable error:', error)
      return false
    }
  }

  async executePluginHook(pluginId: string, hookName: string, parameters: any): Promise<any> {
    const sandbox = this.pluginSandboxes.get(pluginId)
    if (!sandbox) {
      throw new Error(`Plugin ${pluginId} not active`)
    }

    const plugin = this.installedPlugins.get(pluginId)!
    const execution: Omit<PluginExecution, 'id'> = {
      plugin_id: pluginId,
      user_id: plugin.user_id,
      hook_name: hookName,
      input_data: parameters,
      status: 'running',
      started_at: new Date(),
      resource_usage: {
        memory_peak_mb: 0,
        api_calls: 0
      }
    }

    try {
      const result = await sandbox.executeHook(hookName, parameters)
      
      execution.status = 'completed'
      execution.completed_at = new Date()
      execution.execution_time_ms = execution.completed_at.getTime() - execution.started_at.getTime()
      execution.output_data = result

      // Update plugin usage stats
      plugin.usage_stats.executions++
      plugin.usage_stats.total_runtime_ms += execution.execution_time_ms
      plugin.usage_stats.last_execution = new Date()

      await this.updatePluginUsageStats(pluginId, plugin.usage_stats)

      return result
    } catch (error) {
      execution.status = 'failed'
      execution.completed_at = new Date()
      execution.error_message = error instanceof Error ? error.message : 'Unknown error'

      // Update error count
      plugin.usage_stats.errors++
      await this.updatePluginUsageStats(pluginId, plugin.usage_stats)

      throw error
    } finally {
      // Log execution
      await this.supabase
        .from('plugin_executions')
        .insert(execution)
    }
  }

  private async updatePluginStatus(pluginId: string, status: InstalledPlugin['status'], errorMessage?: string): Promise<void> {
    const plugin = this.installedPlugins.get(pluginId)
    if (plugin) {
      plugin.status = status
      plugin.error_message = errorMessage

      await this.supabase
        .from('installed_plugins')
        .update({ 
          status, 
          error_message: errorMessage,
          updated_at: new Date().toISOString()
        })
        .eq('plugin_id', pluginId)
    }
  }

  private async updatePluginUsageStats(pluginId: string, stats: InstalledPlugin['usage_stats']): Promise<void> {
    await this.supabase
      .from('installed_plugins')
      .update({ 
        usage_stats: stats,
        updated_at: new Date().toISOString()
      })
      .eq('plugin_id', pluginId)
  }

  getInstalledPlugins(): InstalledPlugin[] {
    return Array.from(this.installedPlugins.values())
  }

  getPluginById(pluginId: string): InstalledPlugin | null {
    return this.installedPlugins.get(pluginId) || null
  }

  async searchPlugins(query: string, category?: string): Promise<PluginStore[]> {
    let queryBuilder = this.supabase
      .from('plugin_store')
      .select('*')
      .eq('verification.verified', true)

    if (query) {
      queryBuilder = queryBuilder.or(`metadata->>name.ilike.%${query}%,metadata->>description.ilike.%${query}%`)
    }

    if (category) {
      queryBuilder = queryBuilder.eq('metadata->category', category)
    }

    const { data, error } = await queryBuilder
      .order('stats->downloads', { ascending: false })
      .limit(50)

    if (error) {
      throw new Error(`Plugin search failed: ${error.message}`)
    }

    return data as PluginStore[] || []
  }
}

export const pluginManager = new PluginManager()
export { PluginManager }