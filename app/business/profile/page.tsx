// 'use client'

// import { useState, useEffect } from 'react'
// import { useRouter } from 'next/navigation'
// import { createClient } from '@/app/lib/supabase/client'
// import { Button } from '@/app/components/ui/Button'
// import { Card } from '@/app/components/ui/Card'
// import { 
//   Building, Mail, Phone, MapPin, Globe, 
//   Edit2, Save, X, Loader2, Camera, 
//   Briefcase, DollarSign, Users, Clock,
//   CheckCircle, AlertCircle,
//   Eye
// } from 'lucide-react'

// export default function BusinessProfilePage() {
//   const router = useRouter()
//   const [loading, setLoading] = useState(true)
//   const [saving, setSaving] = useState(false)
//   const [editing, setEditing] = useState(false)
//   const [profile, setProfile] = useState<any>(null)
//   const [businessProfile, setBusinessProfile] = useState<any>(null)
//   const [stats, setStats] = useState({
//     totalJobs: 0,
//     activeJobs: 0,
//     totalSpent: 0,
//     totalHires: 0
//   })
  
//   // Form fields
//   const [businessName, setBusinessName] = useState('')
//   const [businessType, setBusinessType] = useState('')
//   const [description, setDescription] = useState('')
//   const [phone, setPhone] = useState('')
//   const [address, setAddress] = useState('')
//   const [website, setWebsite] = useState('')
//   const [logoUrl, setLogoUrl] = useState('')
//   const [uploadingLogo, setUploadingLogo] = useState(false)
  
//   const supabase = createClient()

//   useEffect(() => {
//     fetchBusinessData()
//   }, [])

// const fetchBusinessData = async () => {
//   const { data: { user } } = await supabase.auth.getUser()
//   if (!user) {
//     router.push('/auth/login')
//     return
//   }

//   // Get profile
//   const { data: profileData } = await supabase
//     .from('profiles')
//     .select('*')
//     .eq('id', user.id)
//     .single()
//   setProfile(profileData)

//   // Get business profile
//   const { data: businessData } = await supabase
//     .from('business_profiles')
//     .select('*')
//     .eq('user_id', user.id)
//     .single()
  
//   if (businessData) {
//     setBusinessProfile(businessData)
//     setBusinessName(businessData.business_name || '')
//     setBusinessType(businessData.business_type || '')
//     setDescription(businessData.description || '')
//     setPhone(businessData.phone || '')
//     setAddress(businessData.address || '')
//     setWebsite(businessData.website || '')
//     setLogoUrl(businessData.logo_url || '')

//     // Get stats - only count paid/completed jobs
//     const { data: jobs } = await supabase
//       .from('jobs')
//       .select('id, status')
//       .eq('business_id', businessData.id)

//     let totalSpent = 0
//     let totalHires = 0
//     let activeJobs = 0

//     if (jobs && jobs.length > 0) {
//       activeJobs = jobs.filter(j => j.status === 'open').length
      
//       const jobIds = jobs.map(j => j.id)
      
//       // Get conversations for these jobs
//       const { data: conversations } = await supabase
//         .from('conversations')
//         .select('id')
//         .in('job_id', jobIds)
      
//       if (conversations && conversations.length > 0) {
//         const conversationIds = conversations.map(c => c.id)
        
//         // Get job offers that are paid/released/completed
//         const { data: paidOffers } = await supabase
//           .from('job_offers')
//           .select('offered_amount')
//           .in('conversation_id', conversationIds)
//           .in('status', ['paid', 'released', 'completed'])
        
//         if (paidOffers) {
//           totalSpent = paidOffers.reduce((sum, offer) => sum + (offer.offered_amount || 0), 0)
//           totalHires = paidOffers.length
//         }
//       }
//     }

//     setStats({
//       totalJobs: jobs?.length || 0,
//       activeJobs: activeJobs,
//       totalSpent: totalSpent,
//       totalHires: totalHires
//     })
//   }

//   setLoading(false)
// }

//   const handleSave = async () => {
//     setSaving(true)
//     const { data: { user } } = await supabase.auth.getUser()
    
//     const { error } = await supabase
//       .from('business_profiles')
//       .update({
//         business_name: businessName,
//         business_type: businessType,
//         description: description,
//         phone: phone,
//         address: address,
//         website: website,
//         logo_url: logoUrl,
//         updated_at: new Date().toISOString()
//       })
//       .eq('user_id', user?.id)

//     if (error) {
//       console.error('Error saving:', error)
//       alert('Failed to save profile')
//     } else {
//       alert('Profile saved successfully!')
//       setEditing(false)
//     }
//     setSaving(false)
//   }

//   const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0]
//     if (!file) return
    
//     setUploadingLogo(true)
//     const { data: { user } } = await supabase.auth.getUser()
//     const fileName = `business_${user?.id}_logo_${Date.now()}`
    
//     const { error } = await supabase.storage
//       .from('business_logos')
//       .upload(fileName, file)
    
//     if (!error) {
//       const { data: { publicUrl } } = supabase.storage
//         .from('business_logos')
//         .getPublicUrl(fileName)
      
//       setLogoUrl(publicUrl)
//     }
//     setUploadingLogo(false)
//   }

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-black">
//         <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
//       </div>
//     )
//   }

//   return (
//     <div className="min-h-screen bg-black">
//       <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-black to-black" />

//       <main className="relative z-10 px-4 py-6 max-w-3xl mx-auto">
//         {/* Header */}
//         <div className="mb-6">
//           <h1 className="text-2xl font-bold text-white">Business Profile</h1>
//           <p className="text-gray-400 text-sm">Manage your business information</p>
//         </div>

//        {/* Stats Cards */}
// <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
//   <Card className="p-4 text-center">
//     <Briefcase className="w-5 h-5 text-purple-400 mx-auto mb-1" />
//     <p className="text-2xl font-bold text-white">{stats.totalJobs}</p>
//     <p className="text-xs text-gray-500">Total Jobs</p>
//   </Card>
//   <Card className="p-4 text-center">
//     <Clock className="w-5 h-5 text-green-400 mx-auto mb-1" />
//     <p className="text-2xl font-bold text-white">{stats.activeJobs}</p>
//     <p className="text-xs text-gray-500">Active Jobs</p>
//   </Card>
//   <Card className="p-4 text-center">
//     <DollarSign className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
//     <p className="text-2xl font-bold text-yellow-400">₦{stats.totalSpent.toLocaleString()}</p>
//     <p className="text-xs text-gray-500">Total Spent</p>
//   </Card>
//   <Card className="p-4 text-center">
//     <Users className="w-5 h-5 text-blue-400 mx-auto mb-1" />
//     <p className="text-2xl font-bold text-white">{stats.totalHires}</p>
//     <p className="text-xs text-gray-500">Hires</p>
//   </Card>
// </div>

//         {/* Profile Form */}
//         <Card className="p-6">
//           {/* Logo */}
//           <div className="flex justify-center mb-6">
//             <div className="relative">
//               {logoUrl ? (
//                 <img src={logoUrl} alt="Business Logo" className="w-24 h-24 rounded-full object-cover border-4 border-purple-500" />
//               ) : (
//                 <div className="w-24 h-24 rounded-full bg-purple-600 flex items-center justify-center border-4 border-purple-500">
//                   <Building className="w-10 h-10 text-white" />
//                 </div>
//               )}
//               {editing && (
//                 <label className="absolute bottom-0 right-0 p-1.5 bg-purple-600 rounded-full cursor-pointer hover:bg-purple-700 transition">
//                   {uploadingLogo ? <Loader2 className="w-3 h-3 text-white animate-spin" /> : <Camera className="w-3 h-3 text-white" />}
//                   <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
//                 </label>
//               )}
//             </div>
//           </div>

//           <div className="space-y-4">
//             {/* Business Name */}
//             <div>
//               <label className="block text-sm font-medium text-gray-300 mb-1">Business Name</label>
//               {editing ? (
//                 <input
//                   type="text"
//                   value={businessName}
//                   onChange={(e) => setBusinessName(e.target.value)}
//                   className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white"
//                   required
//                 />
//               ) : (
//                 <p className="text-white">{businessName || 'Not set'}</p>
//               )}
//             </div>

//             {/* Business Type */}
//             <div>
//               <label className="block text-sm font-medium text-gray-300 mb-1">Business Type</label>
//               {editing ? (
//                 <select
//                   value={businessType}
//                   onChange={(e) => setBusinessType(e.target.value)}
//                   className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white"
//                 >
//                   <option value="">Select type</option>
//                   <option value="tech">Tech / IT</option>
//                   <option value="retail">Retail / E-commerce</option>
//                   <option value="service">Service Provider</option>
//                   <option value="restaurant">Restaurant / Food</option>
//                   <option value="creative">Creative Agency</option>
//                   <option value="other">Other</option>
//                 </select>
//               ) : (
//                 <p className="text-white capitalize">{businessType || 'Not set'}</p>
//               )}
//             </div>

//             {/* Description */}
//             <div>
//               <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
//               {editing ? (
//                 <textarea
//                   value={description}
//                   onChange={(e) => setDescription(e.target.value)}
//                   rows={4}
//                   className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white resize-none"
//                   placeholder="Tell businesses about your company..."
//                 />
//               ) : (
//                 <p className="text-white">{description || 'Not set'}</p>
//               )}
//             </div>

//             {/* Contact Info */}
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-1">
//                   <Phone className="w-4 h-4" /> Phone
//                 </label>
//                 {editing ? (
//                   <input
//                     type="tel"
//                     value={phone}
//                     onChange={(e) => setPhone(e.target.value)}
//                     className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white"
//                     placeholder="+234 XXX XXX XXX"
//                   />
//                 ) : (
//                   <p className="text-white">{phone || 'Not set'}</p>
//                 )}
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-1">
//                   <MapPin className="w-4 h-4" /> Address
//                 </label>
//                 {editing ? (
//                   <input
//                     type="text"
//                     value={address}
//                     onChange={(e) => setAddress(e.target.value)}
//                     className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white"
//                     placeholder="City, State"
//                   />
//                 ) : (
//                   <p className="text-white">{address || 'Not set'}</p>
//                 )}
//               </div>
//             </div>

//             {/* Website */}
//             <div>
//               <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-1">
//                 <Globe className="w-4 h-4" /> Website
//               </label>
//               {editing ? (
//                 <input
//                   type="url"
//                   value={website}
//                   onChange={(e) => setWebsite(e.target.value)}
//                   className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white"
//                   placeholder="https://yourwebsite.com"
//                 />
//               ) : (
//                 website ? (
//                   <a href={website} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">
//                     {website}
//                   </a>
//                 ) : (
//                   <p className="text-white">Not set</p>
//                 )
//               )}
//             </div>
//           </div>

//           {/* Action Buttons */}
//           <div className="flex gap-3 mt-6">
//             {editing ? (
//               <>
//                 <Button variant="outline" className="flex-1" onClick={() => setEditing(false)}>
//                   <X className="w-4 h-4 mr-2" />
//                   Cancel
//                 </Button>
//                 <Button className="flex-1" onClick={handleSave} disabled={saving}>
//                   {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
//                   Save Changes
//                 </Button>
//               </>
//             ) : (
//               <Button className="w-full" onClick={() => setEditing(true)}>
//                 <Edit2 className="w-4 h-4 mr-2" />
//                 Edit Profile
//               </Button>
//             )}
//           </div>
//         </Card>

//         {/* Navigation Links */}
//         <div className="grid grid-cols-2 gap-3 mt-6">
//           <Button variant="outline" onClick={() => router.push('/business/jobs/create')}>
//             <Briefcase className="w-4 h-4 mr-2" />
//             Post New Job
//           </Button>
//           <Button variant="outline" onClick={() => router.push('/business/jobs')}>
//             <Eye className="w-4 h-4 mr-2" />
//             View My Jobs
//           </Button>
//         </div>
//       </main>
//     </div>
//   )
// }




'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/client'
import { Button } from '@/app/components/ui/Button'
import { Card } from '@/app/components/ui/Card'
import { 
  Building, Mail, Phone, MapPin, Globe, 
  Edit2, Save, X, Loader2, Camera, 
  Briefcase, DollarSign, Users, Clock,
  CheckCircle, AlertCircle, Crown, Zap, TrendingUp,
  Eye
} from 'lucide-react'

export default function BusinessProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [businessProfile, setBusinessProfile] = useState<any>(null)
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    totalSpent: 0,
    totalHires: 0
  })
  
  // Form fields
  const [businessName, setBusinessName] = useState('')
  const [businessType, setBusinessType] = useState('')
  const [description, setDescription] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [website, setWebsite] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [uploadingLogo, setUploadingLogo] = useState(false)
  
  const supabase = createClient()

  useEffect(() => {
    fetchBusinessData()
  }, [])

  const fetchBusinessData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }

    // Get profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    setProfile(profileData)

    // Get business profile
    const { data: businessData } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    if (businessData) {
      setBusinessProfile(businessData)
      setBusinessName(businessData.business_name || '')
      setBusinessType(businessData.business_type || '')
      setDescription(businessData.description || '')
      setPhone(businessData.phone || '')
      setAddress(businessData.address || '')
      setWebsite(businessData.website || '')
      setLogoUrl(businessData.logo_url || '')

      // Get stats - only count paid/completed jobs
      const { data: jobs } = await supabase
        .from('jobs')
        .select('id, status')
        .eq('business_id', businessData.id)

      let totalSpent = 0
      let totalHires = 0
      let activeJobs = 0

      if (jobs && jobs.length > 0) {
        activeJobs = jobs.filter(j => j.status === 'open').length
        
        const jobIds = jobs.map(j => j.id)
        
        // Get conversations for these jobs
        const { data: conversations } = await supabase
          .from('conversations')
          .select('id')
          .in('job_id', jobIds)
        
        if (conversations && conversations.length > 0) {
          const conversationIds = conversations.map(c => c.id)
          
          // Get job offers that are paid/released/completed
          const { data: paidOffers } = await supabase
            .from('job_offers')
            .select('offered_amount')
            .in('conversation_id', conversationIds)
            .in('status', ['paid', 'released', 'completed'])
          
          if (paidOffers) {
            totalSpent = paidOffers.reduce((sum, offer) => sum + (offer.offered_amount || 0), 0)
            totalHires = paidOffers.length
          }
        }
      }

      setStats({
        totalJobs: jobs?.length || 0,
        activeJobs: activeJobs,
        totalSpent: totalSpent,
        totalHires: totalHires
      })
    }

    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    const { error } = await supabase
      .from('business_profiles')
      .update({
        business_name: businessName,
        business_type: businessType,
        description: description,
        phone: phone,
        address: address,
        website: website,
        logo_url: logoUrl,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user?.id)

    if (error) {
      console.error('Error saving:', error)
      alert('Failed to save profile')
    } else {
      alert('Profile saved successfully!')
      setEditing(false)
    }
    setSaving(false)
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setUploadingLogo(true)
    const { data: { user } } = await supabase.auth.getUser()
    const fileName = `business_${user?.id}_logo_${Date.now()}`
    
    const { error } = await supabase.storage
      .from('business_logos')
      .upload(fileName, file)
    
    if (!error) {
      const { data: { publicUrl } } = supabase.storage
        .from('business_logos')
        .getPublicUrl(fileName)
      
      setLogoUrl(publicUrl)
    }
    setUploadingLogo(false)
  }

  const getPlanIcon = (tier: string) => {
    switch (tier) {
      case 'pro':
        return <TrendingUp className="w-5 h-5 text-blue-400" />
      case 'enterprise':
        return <Crown className="w-5 h-5 text-purple-400" />
      default:
        return <Zap className="w-5 h-5 text-gray-400" />
    }
  }

  const getPlanColor = (tier: string) => {
    switch (tier) {
      case 'pro':
        return 'from-blue-500/20 to-blue-600/10 border-blue-500/30'
      case 'enterprise':
        return 'from-purple-500/20 to-pink-600/10 border-purple-500/30'
      default:
        return 'from-gray-500/20 to-gray-600/10 border-gray-500/30'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-black to-black" />

      <main className="relative z-10 px-4 py-6 max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Business Profile</h1>
          <p className="text-gray-400 text-sm">Manage your business information</p>
        </div>

        {/* Current Plan Card */}
        <Card className={`p-5 mb-6 bg-gradient-to-r ${getPlanColor(businessProfile?.subscription_tier || 'free')} border`}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                {getPlanIcon(businessProfile?.subscription_tier || 'free')}
              </div>
              <div>
                <p className="text-gray-400 text-sm">Current Plan</p>
                <h3 className="text-2xl font-bold text-white capitalize">
                  {businessProfile?.subscription_tier || 'Free'}
                </h3>
                {businessProfile?.subscription_expires_at && businessProfile.subscription_tier !== 'free' && (
                  <p className="text-xs text-gray-400">
                    Renews: {new Date(businessProfile.subscription_expires_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
            <Button 
              variant="outline" 
              className="border-purple-500 text-purple-400 hover:bg-purple-500/10"
              onClick={() => router.push('/upgrade/business')}
            >
              <Crown className="w-4 h-4 mr-2" />
              {businessProfile?.subscription_tier === 'free' ? 'Upgrade Now' : 'Manage Plan'}
            </Button>
          </div>
          
          {/* Plan Benefits */}
          <div className="mt-4 pt-4 border-t border-gray-700/50">
            <p className="text-xs text-gray-400 mb-2">Plan Benefits:</p>
            <div className="flex flex-wrap gap-3">
              {businessProfile?.subscription_tier === 'pro' && (
                <>
                  <span className="text-xs text-blue-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> 15 jobs/month</span>
                  <span className="text-xs text-blue-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> All ranks (E to S)</span>
                  <span className="text-xs text-blue-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Priority support</span>
                </>
              )}
              {businessProfile?.subscription_tier === 'enterprise' && (
                <>
                  <span className="text-xs text-purple-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Unlimited jobs</span>
                  <span className="text-xs text-purple-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> All ranks (E to S)</span>
                  <span className="text-xs text-purple-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> 24/7 priority support</span>
                  <span className="text-xs text-purple-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Dedicated manager</span>
                </>
              )}
              {(!businessProfile?.subscription_tier || businessProfile.subscription_tier === 'free') && (
                <>
                  <span className="text-xs text-gray-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> 3 jobs/month</span>
                  <span className="text-xs text-gray-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> E-Rank only</span>
                  <span className="text-xs text-gray-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Basic support</span>
                </>
              )}
            </div>
          </div>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Card className="p-4 text-center">
            <Briefcase className="w-5 h-5 text-purple-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-white">{stats.totalJobs}</p>
            <p className="text-xs text-gray-500">Total Jobs</p>
          </Card>
          <Card className="p-4 text-center">
            <Clock className="w-5 h-5 text-green-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-white">{stats.activeJobs}</p>
            <p className="text-xs text-gray-500">Active Jobs</p>
          </Card>
          <Card className="p-4 text-center">
            <DollarSign className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-yellow-400">₦{stats.totalSpent.toLocaleString()}</p>
            <p className="text-xs text-gray-500">Total Spent</p>
          </Card>
          <Card className="p-4 text-center">
            <Users className="w-5 h-5 text-blue-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-white">{stats.totalHires}</p>
            <p className="text-xs text-gray-500">Hires</p>
          </Card>
        </div>

        {/* Profile Form */}
        <Card className="p-6">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              {logoUrl ? (
                <img src={logoUrl} alt="Business Logo" className="w-24 h-24 rounded-full object-cover border-4 border-purple-500" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-purple-600 flex items-center justify-center border-4 border-purple-500">
                  <Building className="w-10 h-10 text-white" />
                </div>
              )}
              {editing && (
                <label className="absolute bottom-0 right-0 p-1.5 bg-purple-600 rounded-full cursor-pointer hover:bg-purple-700 transition">
                  {uploadingLogo ? <Loader2 className="w-3 h-3 text-white animate-spin" /> : <Camera className="w-3 h-3 text-white" />}
                  <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                </label>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {/* Business Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Business Name</label>
              {editing ? (
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white"
                  required
                />
              ) : (
                <p className="text-white">{businessName || 'Not set'}</p>
              )}
            </div>

            {/* Business Type */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Business Type</label>
              {editing ? (
                <select
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white"
                >
                  <option value="">Select type</option>
                  <option value="tech">Tech / IT</option>
                  <option value="retail">Retail / E-commerce</option>
                  <option value="service">Service Provider</option>
                  <option value="restaurant">Restaurant / Food</option>
                  <option value="creative">Creative Agency</option>
                  <option value="other">Other</option>
                </select>
              ) : (
                <p className="text-white capitalize">{businessType || 'Not set'}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
              {editing ? (
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white resize-none"
                  placeholder="Tell businesses about your company..."
                />
              ) : (
                <p className="text-white">{description || 'Not set'}</p>
              )}
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-1">
                  <Phone className="w-4 h-4" /> Phone
                </label>
                {editing ? (
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white"
                    placeholder="+234 XXX XXX XXX"
                  />
                ) : (
                  <p className="text-white">{phone || 'Not set'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-1">
                  <MapPin className="w-4 h-4" /> Address
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white"
                    placeholder="City, State"
                  />
                ) : (
                  <p className="text-white">{address || 'Not set'}</p>
                )}
              </div>
            </div>

            {/* Website */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-1">
                <Globe className="w-4 h-4" /> Website
              </label>
              {editing ? (
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white"
                  placeholder="https://yourwebsite.com"
                />
              ) : (
                website ? (
                  <a href={website} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">
                    {website}
                  </a>
                ) : (
                  <p className="text-white">Not set</p>
                )
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            {editing ? (
              <>
                <Button variant="outline" className="flex-1" onClick={() => setEditing(false)}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Changes
                </Button>
              </>
            ) : (
              <Button className="w-full" onClick={() => setEditing(true)}>
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </Card>

        {/* Navigation Links */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          <Button variant="outline" onClick={() => router.push('/business/jobs/create')}>
            <Briefcase className="w-4 h-4 mr-2" />
            Post New Job
          </Button>
          <Button variant="outline" onClick={() => router.push('/business/jobs')}>
            <Eye className="w-4 h-4 mr-2" />
            View My Jobs
          </Button>
        </div>
      </main>
    </div>
  )
}