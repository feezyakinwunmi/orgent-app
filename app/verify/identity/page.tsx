'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/client'
import { Button } from '@/app/components/ui/Button'
import { Card } from '@/app/components/ui/Card'
import { 
  ChevronLeft, Upload, Loader2, CheckCircle, 
  AlertCircle, Shield, BadgeCheck, Camera, X,
  Clock
} from 'lucide-react'

export default function IdentityVerificationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [verificationStatus, setVerificationStatus] = useState<string>('pending')
  const [idFile, setIdFile] = useState<File | null>(null)
  const [selfieFile, setSelfieFile] = useState<File | null>(null)
  const [idPreview, setIdPreview] = useState('')
  const [selfiePreview, setSelfiePreview] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  const supabase = createClient()

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      setProfile(profileData)
      setVerificationStatus(profileData?.identity_verification_status || 'pending')
      
      // Check existing verification request
      const { data: existingRequest } = await supabase
        .from('verification_requests')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'identity')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (existingRequest && existingRequest.status === 'pending') {
        setVerificationStatus('pending')
      } else if (existingRequest && existingRequest.status === 'approved') {
        setVerificationStatus('approved')
      } else if (existingRequest && existingRequest.status === 'rejected') {
        setVerificationStatus('rejected')
      }
      
      setLoading(false)
    }

    fetchProfile()
  }, [router, supabase])

  const handleIdFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setIdFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setIdPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleSelfieChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelfieFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setSelfiePreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async () => {
    if (!idFile || !selfieFile) {
      setError('Please upload both ID document and selfie')
      return
    }

    setSubmitting(true)
    setError('')
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Upload ID document
    const idFileName = `${user.id}_id_${Date.now()}`
    const { error: idError } = await supabase.storage
      .from('verification_docs')
      .upload(idFileName, idFile)

    if (idError) {
      setError('Failed to upload ID document')
      setSubmitting(false)
      return
    }

    const { data: idUrl } = supabase.storage
      .from('verification_docs')
      .getPublicUrl(idFileName)

    // Upload selfie
    const selfieFileName = `${user.id}_selfie_${Date.now()}`
    const { error: selfieError } = await supabase.storage
      .from('verification_docs')
      .upload(selfieFileName, selfieFile)

    if (selfieError) {
      setError('Failed to upload selfie')
      setSubmitting(false)
      return
    }

    const { data: selfieUrl } = supabase.storage
      .from('verification_docs')
      .getPublicUrl(selfieFileName)

    // Create verification request
    const { error: requestError } = await supabase
      .from('verification_requests')
      .insert({
        user_id: user.id,
        type: 'identity',
        status: 'pending',
        documents: {
          id_document: idUrl.publicUrl,
          selfie: selfieUrl.publicUrl
        }
      })

    if (requestError) {
      setError('Failed to submit verification request')
    } else {
      // Update profile status
      await supabase
        .from('profiles')
        .update({ 
          identity_verification_status: 'pending',
          identity_submitted_at: new Date().toISOString()
        })
        .eq('id', user.id)
      
      setSuccess(true)
    }
    
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    )
  }

  if (verificationStatus === 'approved') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Identity Verified!</h2>
          <p className="text-gray-400 mb-6">
            Your identity has been verified. You now have the Bronze Badge!
          </p>
          <Button onClick={() => router.push('/profile')}>Return to Profile</Button>
        </div>
      </div>
    )
  }

  if (verificationStatus === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-10 h-10 text-yellow-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Verification Pending</h2>
          <p className="text-gray-400 mb-4">
            Your documents are being reviewed by our team. This usually takes 24-48 hours.
          </p>
          <Button variant="outline" onClick={() => router.push('/profile')}>
            Return to Profile
          </Button>
        </div>
      </div>
    )
  }

  if (verificationStatus === 'rejected') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Verification Rejected</h2>
          <p className="text-gray-400 mb-4">
            Your verification was not approved. Please submit clear documents.
          </p>
          <Button onClick={() => {
            setVerificationStatus('pending')
            setSuccess(false)
          }}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
      <header className="sticky top-0 z-30 bg-gray-900/80 backdrop-blur-md border-b border-gray-800">
        <div className="px-4 py-3">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 hover:text-white transition">
            <ChevronLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
        </div>
      </header>

      <main className="px-4 py-8 max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-10 h-10 text-orange-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Identity Verification</h1>
          <p className="text-gray-400 mt-2">Submit your documents for admin review</p>
        </div>

        <Card className="p-6 mb-6">
          <div className="space-y-6">
            <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
              <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-400" />
                How it works
              </h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>1. Upload your government ID and a selfie</li>
                <li>2. Our admin team reviews your documents (24-48 hours)</li>
                <li>3. You'll receive the Bronze Badge upon approval</li>
                <li>4. +100 points added to your account</li>
              </ul>
            </div>

            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            {success ? (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Submitted Successfully!</h3>
                <p className="text-gray-400">Your documents are being reviewed. You'll be notified once verified.</p>
                <Button className="mt-6" onClick={() => router.push('/profile')}>Return to Profile</Button>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Government ID *</label>
                  <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-purple-500 transition cursor-pointer">
                    <input type="file" accept="image/*,.pdf" onChange={handleIdFileChange} className="hidden" id="id-upload" />
                    <label htmlFor="id-upload" className="cursor-pointer block">
                      {idPreview ? (
                        <div className="relative">
                          <img src={idPreview} alt="ID Preview" className="max-h-48 mx-auto rounded-lg" />
                          <button onClick={() => { setIdFile(null); setIdPreview('') }} className="absolute top-2 right-2 p-1 bg-red-500 rounded-full">
                            <X className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      ) : (
                        <div>
                          <Upload className="w-12 h-12 text-gray-500 mx-auto mb-2" />
                          <p className="text-gray-400">Click to upload ID document</p>
                          <p className="text-gray-500 text-sm mt-1">Driver's License, Passport, or National ID</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Selfie with ID *</label>
                  <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-purple-500 transition cursor-pointer">
                    <input type="file" accept="image/*" onChange={handleSelfieChange} className="hidden" id="selfie-upload" />
                    <label htmlFor="selfie-upload" className="cursor-pointer block">
                      {selfiePreview ? (
                        <div className="relative">
                          <img src={selfiePreview} alt="Selfie Preview" className="max-h-48 mx-auto rounded-lg" />
                          <button onClick={() => { setSelfieFile(null); setSelfiePreview('') }} className="absolute top-2 right-2 p-1 bg-red-500 rounded-full">
                            <X className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      ) : (
                        <div>
                          <Camera className="w-12 h-12 text-gray-500 mx-auto mb-2" />
                          <p className="text-gray-400">Click to upload selfie</p>
                          <p className="text-gray-500 text-sm mt-1">Take a photo holding your ID</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                <Button onClick={handleSubmit} disabled={submitting || !idFile || !selfieFile} className="w-full">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Shield className="w-4 h-4 mr-2" />}
                  Submit for Review
                </Button>
              </>
            )}
          </div>
        </Card>
      </main>
    </div>
  )
}