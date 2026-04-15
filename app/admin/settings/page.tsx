'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import { Card } from '@/app/components/ui/Card'
import { Button } from '@/app/components/ui/Button'
import { 
  DollarSign, Percent, Wallet, Save, 
  Loader2, Shield, Bell, Globe, TrendingUp,
  Users, Briefcase
} from 'lucide-react'

interface Settings {
  platform_fee_percent: number
  min_withdrawal_amount: number
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    platform_fee_percent: 10,
    min_withdrawal_amount: 1000
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const supabase = createClient()

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('admin_settings')
      .select('*')
      .single()
    
    if (data) {
      setSettings({
        platform_fee_percent: data.platform_fee_percent,
        min_withdrawal_amount: data.min_withdrawal_amount
      })
    }
    setLoading(false)
  }

  const saveSettings = async () => {
    setSaving(true)
    setMessage('')
    
    const { error } = await supabase
      .from('admin_settings')
      .upsert({
        platform_fee_percent: settings.platform_fee_percent,
        min_withdrawal_amount: settings.min_withdrawal_amount,
        updated_at: new Date().toISOString()
      })
    
    if (error) {
      setMessage('Error: ' + error.message)
    } else {
      setMessage('Settings saved successfully!')
      setTimeout(() => setMessage(''), 3000)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Platform Settings</h1>
        <p className="text-gray-400">Configure global platform settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Fee Card */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-800">
            <div className="p-2 bg-purple-500/20 rounded-xl">
              <Percent className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Platform Fee</h2>
              <p className="text-sm text-gray-500">Percentage taken from each transaction</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <input
                type="number"
                value={settings.platform_fee_percent}
                onChange={(e) => setSettings({ ...settings, platform_fee_percent: parseInt(e.target.value) || 0 })}
                className="w-24 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white text-center text-lg"
                step="1"
                min="0"
                max="50"
              />
              <span className="text-white text-lg">%</span>
            </div>
            
            <div className="p-3 bg-gray-800/50 rounded-lg">
              <p className="text-sm text-gray-400">Example calculation:</p>
              <div className="mt-2 space-y-1 text-sm">
                <p>Job amount: <span className="text-white">₦10,000</span></p>
                <p>Platform fee ({settings.platform_fee_percent}%): <span className="text-purple-400">₦{(10000 * settings.platform_fee_percent / 100).toLocaleString()}</span></p>
                <p>Hunter receives: <span className="text-green-400">₦{(10000 - (10000 * settings.platform_fee_percent / 100)).toLocaleString()}</span></p>
              </div>
            </div>
          </div>
        </Card>

        {/* Minimum Withdrawal Card */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-800">
            <div className="p-2 bg-green-500/20 rounded-xl">
              <Wallet className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Minimum Withdrawal</h2>
              <p className="text-sm text-gray-500">Minimum amount hunters can withdraw</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₦</span>
              <input
                type="number"
                value={settings.min_withdrawal_amount}
                onChange={(e) => setSettings({ ...settings, min_withdrawal_amount: parseInt(e.target.value) || 0 })}
                className="pl-8 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white w-40 text-lg"
                step="500"
                min="500"
              />
            </div>
            <p className="text-sm text-gray-500">Minimum allowed: <span className="text-white">₦500</span></p>
          </div>
        </Card>
      </div>

      {/* Stats Preview */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Platform Fee Collected</p>
              <p className="text-2xl font-bold text-white">₦0</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-400 opacity-70" />
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Users</p>
              <p className="text-2xl font-bold text-white">0</p>
            </div>
            <Users className="w-8 h-8 text-blue-400 opacity-70" />
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Jobs</p>
              <p className="text-2xl font-bold text-white">0</p>
            </div>
            <Briefcase className="w-8 h-8 text-green-400 opacity-70" />
          </div>
        </Card>
      </div>

      {/* Save Button */}
      <div className="mt-8 flex items-center justify-between">
        <Button onClick={saveSettings} disabled={saving} className="px-8 py-3">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
        </Button>
        {message && (
          <span className={`text-sm ${message.includes('success') ? 'text-green-400' : 'text-red-400'}`}>
            {message}
          </span>
        )}
      </div>
    </div>
  )
}