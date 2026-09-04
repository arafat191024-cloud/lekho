import { useState, useEffect, useRef } from 'react'
import { translations } from './translations'
import { supabase } from './supabaseClient'
import { containsProfanity } from './profanityFilter'
import ProfilePage from './ProfilePage'
import Logo from './Logo'

const POSTS_PER_PAGE = 10
const ADMIN_EMAILS = ['ahariyan173@gmail.com', 'arafatofficial2242@gmail.com']

const CATEGORIES = [
  { key: 'literature', bn: 'সাহিত্য', en: 'Literature & Writing' },
  { key: 'opinion', bn: 'মতামত', en: 'Opinion' },
  { key: 'society', bn: 'সমাজ', en: 'Society' },
  { key: 'religion', bn: 'ধর্ম', en: 'Religion' },
  { key: 'history', bn: 'ইতিহাস', en: 'History' },
  { key: 'bangladesh', bn: 'বাংলাদেশ', en: 'Bangladesh' },
  { key: 'world', bn: 'বিশ্ব', en: 'World' },
  { key: 'geopolitics', bn: 'ভূরাজনীতি', en: 'Geopolitics' },
  { key: 'war', bn: 'যুদ্ধ', en: 'War' },
  { key: 'analysis', bn: 'বিশ্লেষণ', en: 'Analysis' },
  { key: 'science_tech', bn: 'বিজ্ঞান-প্রযুক্তি', en: 'Science & Technology' },
  { key: 'culture', bn: 'সংস্কৃতি', en: 'Culture' },
  { key: 'life', bn: 'জীবন', en: 'Life Experience' },
  { key: 'ideas', bn: 'ভাবনা', en: 'Ideas' },
  { key: 'education', bn: 'শিক্ষা', en: 'Education' },
  { key: 'career', bn: 'ক্যারিয়ার', en: 'Career' },
  { key: 'business', bn: 'ব্যবসা', en: 'Business' },
  { key: 'creativity', bn: 'সৃজনশীলতা', en: 'Creativity' },
  { key: 'self_improvement', bn: 'আত্ম-উন্নয়ন', en: 'Self Improvement' },
  { key: 'mental_growth', bn: 'মানসিক বিকাশ', en: 'Mental Growth' },
  { key: 'others', bn: 'অন্যান্য', en: 'Others' },
]

function categoryLabel(key, lang) {
  const c = CATEGORIES.find(c => c.key === key)
  if (!c) return key
  return lang === 'bn' ? c.bn : c.en
}

const formatNumber = (num) => {
  if (!num) return '0'
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
  return num
}

const formatDateTime = (dateStr, lang) => {
  if (!dateStr) return ''
  const locale = lang === 'bn' ? 'bn-BD' : 'en-US'
  return new Date(dateStr).toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const calculateReadingTime = (text, lang) => {
  if (!text) return lang === 'bn' ? '১ মিনিট পাঠ' : '1 min read'
  const words = text.trim().split(/\s+/).filter(Boolean).length
  const minutes = Math.max(1, Math.ceil(words / 180))
  if (lang === 'bn') {
    const bnNums = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']
    const bnMin = minutes.toString().split('').map(d => bnNums[d] || d).join('')
    return `${bnMin} মিনিট পাঠ`
  }
  return `${minutes} min read`
}

const playPopSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(580, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1)
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.1)
  } catch (e) {}
}

function SkeletonPostCard({ colors, isDark }) {
  return (
    <div style={{
      border: `1px solid ${colors.cardBorder}`,
      background: colors.cardBg,
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '14px',
      animation: 'pulse 1.5s infinite ease-in-out',
      textAlign: 'left'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: isDark ? '#2a2b30' : '#e2e8f0' }} />
        <div style={{ width: '120px', height: '14px', borderRadius: '4px', background: isDark ? '#2a2b30' : '#e2e8f0' }} />
      </div>
      <div style={{ width: '60%', height: '16px', borderRadius: '4px', background: isDark ? '#2a2b30' : '#e2e8f0', marginBottom: '8px' }} />
      <div style={{ width: '95%', height: '12px', borderRadius: '4px', background: isDark ? '#2a2b30' : '#e2e8f0', marginBottom: '6px' }} />
      <div style={{ width: '80%', height: '12px', borderRadius: '4px', background: isDark ? '#2a2b30' : '#e2e8f0', marginBottom: '12px' }} />
    </div>
  )
}

function ProfileNoteBox({ profileUserId, session, lang, colors, isDark, showToast }) {
  const [note, setNote] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isMyProfile = session.user.id === profileUserId

  useEffect(() => {
    loadNote()
  }, [profileUserId])

  const loadNote = async () => {
    const { data } = await supabase
      .from('profile_notes')
      .select('*')
      .eq('user_id', profileUserId)
      .maybeSingle()

    if (data) {
      const createdAt = new Date(data.created_at).getTime()
      const now = new Date().getTime()
      const hoursPassed = (now - createdAt) / (1000 * 60 * 60)

      if (hoursPassed > 24) {
        setNote(null)
      } else {
        setNote(data)
      }
    } else {
      setNote(null)
    }
  }

  const handleSaveNote = async (e) => {
    e.preventDefault()
    if (!noteText.trim()) return

    setSubmitting(true)
    const { error } = await supabase
      .from('profile_notes')
      .upsert({
        user_id: session.user.id,
        note: noteText.trim(),
        created_at: new Date().toISOString()
      }, { onConflict: 'user_id' })

    setSubmitting(false)
    if (!error) {
      setIsEditing(false)
      setNoteText('')
      loadNote()
      showToast(lang === 'bn' ? '💬 ২৪ ঘণ্টার প্রফাইল নোট আপডেট হয়েছে!' : '💬 24-hour profile note updated!', 'success')
    } else {
      showToast('Error: ' + error.message, 'error')
    }
  }

  return (
    <div style={{ margin: '10px 0', textAlign: 'center' }}>
      {note ? (
        <div style={{
          display: 'inline-block',
          background: colors.inputBg,
          border: `1px solid ${colors.cardBorder}`,
          borderRadius: '16px',
          padding: '6px 14px',
          fontSize: '13.5px',
          color: colors.text,
          position: 'relative',
          boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
        }}>
          💬 "{note.note}"
          {isMyProfile && (
            <button
              onClick={() => { setIsEditing(true); setNoteText(note.note) }}
              style={{ background: 'none', border: 'none', color: '#0066cc', cursor: 'pointer', fontSize: '11px', marginLeft: '8px' }}
            >
              {lang === 'bn' ? 'এডিট' : 'Edit'}
            </button>
          )}
        </div>
      ) : isMyProfile && !isEditing ? (
        <button
          onClick={() => setIsEditing(true)}
          style={{
            background: 'none',
            border: `1px dashed ${colors.cardBorder}`,
            color: colors.textMuted,
            borderRadius: '16px',
            padding: '4px 12px',
            fontSize: '12.5px',
            cursor: 'pointer'
          }}
        >
          + {lang === 'bn' ? 'একটি ২৪ ঘণ্টার নোট যোগ করুন...' : 'Add a 24h note...'}
        </button>
      ) : null}

      {isEditing && (
        <form onSubmit={handleSaveNote} style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginTop: '8px' }}>
          <input
            type="text"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            maxLength={50}
            placeholder={lang === 'bn' ? 'মনোভাব বা নোট লিখুন (সর্বোচ্চ ৫০ অক্ষর)...' : 'Write a note (max 50 chars)...'}
            style={{ padding: '6px 10px', fontSize: '13px', borderRadius: '8px', border: `1px solid ${colors.inputBorder}`, background: colors.inputBg, color: colors.text, width: '220px' }}
            required
          />
          <button type="submit" disabled={submitting} style={{ padding: '6px 12px', background: '#0066cc', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
            {submitting ? '...' : (lang === 'bn' ? 'সেভ' : 'Save')}
          </button>
          <button type="button" onClick={() => setIsEditing(false)} style={{ padding: '6px 8px', background: isDark ? '#444' : '#cbd5e1', color: colors.text, border: 'none', borderRadius: '8px', fontSize: '12px' }}>
            ✕
          </button>
        </form>
      )}
    </div>
  )
}

function NewPostForm({ session, lang, colors, isDark, onPostCreated, showToast }) {
  const [title, setTitle] = useState(localStorage.getItem('lekho_draft_title') || '')
  const [content, setContent] = useState(localStorage.getItem('lekho_draft_content') || '')
  const [category, setCategory] = useState(CATEGORIES[0].key)
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    localStorage.setItem('lekho_draft_title', title)
  }, [title])

  useEffect(() => {
    localStorage.setItem('lekho_draft_content', content)
  }, [content])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim()) return

    if (containsProfanity(content) || containsProfanity(title)) {
      showToast(translations[lang].profanityPost, 'error')
      return
    }

    setPosting(true)

    const { error } = await supabase.from('posts').insert({
      author_id: session.user.id,
      title: title,
      content: content,
      category: category
    })

    setPosting(false)

    if (error) {
      showToast('Error: ' + error.message, 'error')
    } else {
      setTitle('')
      setContent('')
      localStorage.removeItem('lekho_draft_title')
      localStorage.removeItem('lekho_draft_content')
      showToast(lang === 'bn' ? '✅ পোস্ট সফলভাবে প্রকাশিত হয়েছে!' : '✅ Post published successfully!', 'success')
      onPostCreated()
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{
      background: colors.cardBg,
      border: `1px solid ${colors.cardBorder}`,
      borderRadius: '12px',
      padding: '12px',
      marginBottom: '16px',
      textAlign: 'left',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
    }}>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={lang === 'bn' ? 'শিরোনাম (ঐচ্ছিক)' : 'Title (optional)'}
        style={{
          width: '100%',
          padding: '6px 8px',
          background: 'transparent',
          border: 'none',
          borderBottom: `1px solid ${colors.cardBorder}`,
          color: colors.text,
          fontSize: '14px',
          fontWeight: '600',
          marginBottom: '8px',
          boxSizing: 'border-box',
          outline: 'none',
          textAlign: 'left'
        }}
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={translations[lang].postPlaceholder}
        rows={2}
        style={{
          width: '100%',
          padding: '6px 8px',
          background: 'transparent',
          border: 'none',
          color: colors.text,
          fontSize: '14px',
          lineHeight: '1.5',
          fontFamily: 'inherit',
          boxSizing: 'border-box',
          resize: 'vertical',
          outline: 'none',
          textAlign: 'left'
        }}
        required
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', borderTop: `1px solid ${colors.cardBorder}`, paddingTop: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{
              padding: '6px 10px',
              background: colors.inputBg,
              color: colors.text,
              border: `1px solid ${colors.inputBorder}`,
              borderRadius: '8px',
              fontSize: '12px',
              outline: 'none'
            }}
          >
            {CATEGORIES.map(c => (
              <option key={c.key} value={c.key}>{lang === 'bn' ? c.bn : c.en}</option>
            ))}
          </select>
          {(title || content) && (
            <span style={{ fontSize: '11px', color: colors.textMuted }}>
              💾 {lang === 'bn' ? 'ড্রাফট সংরক্ষিত' : 'Draft saved'}
            </span>
          )}
        </div>
        <button
          type="submit"
          disabled={posting}
          style={{
            padding: '6px 18px',
            background: '#0066cc',
            color: '#fff',
            border: 'none',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 'bold',
            minHeight: '36px'
          }}
        >
          {posting ? translations[lang].posting : translations[lang].postButton}
        </button>
      </div>
    </form>
  )
}

function App() {
  const [session, setSession] = useState(null)
  const [lang, setLang] = useState(localStorage.getItem('lekho_lang') || 'bn')
  
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('lekho_theme')
    if (saved) return saved
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    return prefersDark ? 'dark' : 'light'
  })

  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('feed') // 'feed', 'profile', 'saved', 'notifications'
  const [feedTab, setFeedTab] = useState('explore')
  const [viewedUserId, setViewedUserId] = useState(null)
  const [singlePostId, setSinglePostId] = useState(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [showNavMenu, setShowNavMenu] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadNotifCount, setUnreadNotifCount] = useState(0)

  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [showAdminModal, setShowAdminModal] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(null)

  const [showExitConfirm, setShowExitConfirm] = useState(false)

  const [toast, setToast] = useState(null)
  const toastTimerRef = useRef(null)

  const navMenuRef = useRef(null)

  useEffect(() => {
    window.history.pushState({ view: 'feed' }, '')

    const handlePopState = (event) => {
      if (view === 'profile' || view === 'notifications' || singlePostId || view === 'saved' || searchTerm) {
        setView('feed')
        setSinglePostId(null)
        setViewedUserId(null)
        setSearchTerm('')
        window.history.pushState({ view: 'feed' }, '')
      } else {
        window.history.pushState({ view: 'feed' }, '')
        setShowExitConfirm(true)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [view, singlePostId, searchTerm])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navMenuRef.current && !navMenuRef.current.contains(event.target)) {
        setShowNavMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [])

  const showToast = (message, type = 'info') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToast({ message, type })
    toastTimerRef.current = setTimeout(() => {
      setToast(null)
    }, 3200)
  }

  const [authMode, setAuthMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [gender, setGender] = useState('male')
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [updatingPassword, setUpdatingPassword] = useState(false)

  const [refreshFeed, setRefreshFeed] = useState(0)

  const isAdmin = session?.user?.email && ADMIN_EMAILS.includes(session.user.email)

  useEffect(() => {
    if (singlePostId) {
      document.title = lang === 'bn' ? 'পোস্ট | লেখো' : 'Post | Lekho'
    } else if (view === 'profile') {
      document.title = lang === 'bn' ? 'প্রোফাইল | লেখো' : 'Profile | Lekho'
    } else if (view === 'notifications') {
      document.title = lang === 'bn' ? 'নোটিফিকেশন | লেখো' : 'Notifications | Lekho'
    } else if (view === 'saved') {
      document.title = lang === 'bn' ? 'সংরক্ষিত পোস্ট | লেখো' : 'Saved Posts | Lekho'
    } else {
      document.title = lang === 'bn' ? 'লেখো — আপনার ভাবনা প্রকাশ করুন' : 'Lekho — Share Your Thoughts'
    }
  }, [singlePostId, view, lang])

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    localStorage.setItem('lekho_theme', nextTheme)
  }

  const handleSetLang = (newLang) => {
    setLang(newLang)
    localStorage.setItem('lekho_lang', newLang)
  }

  const isDark = theme === 'dark'
  
  const colors = {
    bg: isDark ? '#121316' : '#f1f5f9',
    cardBg: isDark ? '#191a1d' : '#ffffff',
    cardBorder: isDark ? '#2e3035' : '#cbd5e1',
    text: isDark ? '#f3f4f6' : '#0f172a',
    textMuted: isDark ? '#9ca3af' : '#475569',
    inputBg: isDark ? '#111215' : '#ffffff',
    inputBorder: isDark ? '#373a40' : '#94a3b8',
    navBg: isDark ? '#1a1b1f' : '#ffffff',
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const postId = params.get('post')
    if (postId) {
      setSinglePostId(postId)
      setView('feed')
    }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
      if (session) loadNotifications(session.user.id)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true)
      }
      setSession(session)
      if (session) loadNotifications(session.user.id)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const loadNotifications = async (userId) => {
    const uid = userId || session?.user?.id
    if (!uid) return

    const { data } = await supabase
      .from('notifications')
      .select('*, profiles:actor_id(name, full_name, avatar_url), posts(title)')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(50)

    if (data) {
      const prevUnread = unreadNotifCount
      const unread = data.filter(n => !n.is_read).length
      setNotifications(data)
      setUnreadNotifCount(unread)

      if (unread > prevUnread && prevUnread !== 0) {
        playPopSound()
      }
    }
  }

  const markNotificationsAsRead = async () => {
    if (!session || unreadNotifCount === 0) return

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', session.user.id)
      .eq('is_read', false)

    setUnreadNotifCount(0)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const handleOpenNotifications = () => {
    setView('notifications')
    setSinglePostId(null)
    setViewedUserId(null)
    setSearchTerm('')
    markNotificationsAsRead()
  }

  const handleNotificationClick = (notif) => {
    if (notif.type === 'follow') {
      setViewedUserId(notif.actor_id)
      setView('profile')
    } else if (notif.post_id) {
      setSinglePostId(notif.post_id)
      setView('feed')
    }
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
          full_name: name,
          gender: gender
        }
      }
    })

    if (error) {
      setErrorMsg(error.message)
    } else if (data?.user) {
      await supabase.from('profiles').update({
        gender: gender,
        full_name: name,
        name: name
      }).eq('id', data.user.id)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) setErrorMsg(error.message)
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin
    })

    if (error) {
      setErrorMsg(error.message)
    } else {
      setSuccessMsg(lang === 'bn' 
        ? 'আপনার ইমেইলে পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে! ইনবক্স চেক করুন।' 
        : 'Password reset link sent to your email! Please check your inbox.')
    }
  }

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')
    setUpdatingPassword(true)

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    setUpdatingPassword(false)

    if (error) {
      setErrorMsg(error.message)
    } else {
      showToast(lang === 'bn' ? '✅ পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে!' : '✅ Password updated successfully!', 'success')
      setIsPasswordRecovery(false)
      setNewPassword('')
    }
  }

  const handleLogout = async () => {
    setShowNavMenu(false)
    await supabase.auth.signOut()
  }

  const handleDeleteAccount = async () => {
    const confirmText = lang === 'bn' ? 'আপনি কি সত্যিই আপনার অ্যাকাউন্ট এবং সমস্ত ডেটা চিরতরে মুছে ফেলতে চান?' : 'Are you sure you want to delete your account permanently?'
    if (!window.confirm(confirmText)) return

    const userId = session.user.id
    await supabase.from('posts').delete().eq('author_id', userId)
    await supabase.from('profiles').delete().eq('id', userId)
    
    await supabase.auth.signOut()
    showToast(lang === 'bn' ? 'অ্যাকাউন্ট মুছে ফেলা হয়েছে।' : 'Account deleted.', 'info')
  }

  const handleFeedTabClick = () => {
    setView('feed')
    setSinglePostId(null)
    setViewedUserId(null)
    setSearchTerm('')
    setRefreshFeed(r => r + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    window.history.pushState({}, '', window.location.pathname)
  }

  const clearSinglePostView = () => {
    setSinglePostId(null)
    window.history.pushState({}, '', window.location.pathname)
  }

  if (loading) return <p style={{ textAlign: 'center', marginTop: '50px', color: '#888' }}>Loading...</p>

  if (isPasswordRecovery) {
    return (
      <div style={{ minHeight: '100vh', background: colors.bg, color: colors.text, padding: '40px 15px', boxSizing: 'border-box' }}>
        <div style={{ maxWidth: '400px', margin: '40px auto 0', fontFamily: 'sans-serif', textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
            <Logo size={46} isDark={isDark} />
            <h1 style={{ margin: 0, fontSize: '26px', color: colors.text }}>{translations[lang].appName}</h1>
          </div>

          <h2 style={{ textAlign: 'center', fontSize: '18px', marginBottom: '16px', color: colors.text }}>
            🔒 {lang === 'bn' ? 'নতুন পাসওয়ার্ড সেট করুন' : 'Set New Password'}
          </h2>

          <form onSubmit={handleUpdatePassword}>
            <div style={{ marginBottom: '15px' }}>
              <input
                type="password"
                placeholder={lang === 'bn' ? 'কমপক্ষে ৬ ডিজিটের নতুন পাসওয়ার্ড' : 'Enter new password (min 6 chars)'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${colors.inputBorder}`, background: colors.inputBg, color: colors.text, boxSizing: 'border-box', fontSize: '15px' }}
              />
            </div>

            {errorMsg && <p style={{ color: '#ff4d4f', fontSize: '14px', margin: '0 0 10px' }}>{errorMsg}</p>}

            <button type="submit" disabled={updatingPassword} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'none', background: '#0066cc', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px', minHeight: '44px' }}>
              {updatingPassword ? '...' : (lang === 'bn' ? 'পাসওয়ার্ড পরিবর্তন সম্পন্ন করুন' : 'Update Password')}
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div style={{ minHeight: '100vh', background: colors.bg, color: colors.text, padding: '40px 15px', boxSizing: 'border-box' }}>
        <div style={{ maxWidth: '400px', margin: '0 auto', fontFamily: 'sans-serif', textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
            <Logo size={46} isDark={isDark} />
            <h1 style={{ margin: 0, fontSize: '26px', color: colors.text }}>{translations[lang].appName}</h1>
          </div>

          <h2 style={{ textAlign: 'center', fontSize: '18px', marginBottom: '20px', color: colors.text }}>
            {authMode === 'signup' && (lang === 'bn' ? 'নতুন একাউন্ট তৈরি করুন' : translations[lang].createAccount)}
            {authMode === 'login' && (lang === 'bn' ? 'লগইন করুন' : translations[lang].login)}
            {authMode === 'forgot' && (lang === 'bn' ? 'পাসওয়ার্ড রিসেট করুন' : 'Reset Password')}
          </h2>

          <form onSubmit={
            authMode === 'signup' ? handleSignUp : authMode === 'login' ? handleLogin : handleForgotPassword
          }>
            {authMode === 'signup' && (
              <>
                <div style={{ marginBottom: '12px' }}>
                  <input
                    type="text"
                    placeholder={translations[lang].namePlaceholder}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${colors.inputBorder}`, background: colors.inputBg, color: colors.text, boxSizing: 'border-box', fontSize: '15px' }}
                  />
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: colors.textMuted, fontWeight: '600' }}>
                    {lang === 'bn' ? 'লিঙ্গ / জেন্ডার' : 'Gender'}
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${colors.inputBorder}`, background: colors.inputBg, color: colors.text, boxSizing: 'border-box', fontSize: '15px' }}
                  >
                    <option value="male">{lang === 'bn' ? 'পুরুষ (Male)' : 'Male'}</option>
                    <option value="female">{lang === 'bn' ? 'নারী (Female)' : 'Female'}</option>
                    <option value="other">{lang === 'bn' ? 'অন্যান্য (Other)' : 'Other'}</option>
                  </select>
                </div>
              </>
            )}

            <div style={{ marginBottom: '12px' }}>
              <input
                type="email"
                placeholder={translations[lang].emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${colors.inputBorder}`, background: colors.inputBg, color: colors.text, boxSizing: 'border-box', fontSize: '15px' }}
              />
            </div>

            {authMode !== 'forgot' && (
              <div style={{ marginBottom: '12px' }}>
                <input
                  type="password"
                  placeholder={translations[lang].passwordPlaceholder}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${colors.inputBorder}`, background: colors.inputBg, color: colors.text, boxSizing: 'border-box', fontSize: '15px' }}
                />
              </div>
            )}

            {authMode === 'login' && (
              <div style={{ textAlign: 'right', marginBottom: '15px' }}>
                <button
                  type="button"
                  onClick={() => { setAuthMode('forgot'); setErrorMsg(''); setSuccessMsg('') }}
                  style={{ background: 'none', border: 'none', color: '#0066cc', cursor: 'pointer', fontSize: '13px', padding: 0 }}
                >
                  {lang === 'bn' ? 'পাসওয়ার্ড ভুলে গেছেন?' : 'Forgot Password?'}
                </button>
              </div>
            )}

            {errorMsg && <p style={{ color: '#ff4d4f', fontSize: '13.5px', margin: '0 0 10px', fontWeight: '600' }}>{errorMsg}</p>}
            {successMsg && <p style={{ color: '#10b981', fontSize: '13.5px', margin: '0 0 10px', fontWeight: '600' }}>{successMsg}</p>}

            <button type="submit" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'none', background: '#0066cc', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px', minHeight: '44px' }}>
              {authMode === 'signup' && translations[lang].signUp}
              {authMode === 'login' && translations[lang].login}
              {authMode === 'forgot' && (lang === 'bn' ? 'রিসেট লিংক পাঠান' : 'Send Reset Link')}
            </button>
          </form>

          <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '14px' }}>
            {authMode === 'forgot' ? (
              <button onClick={() => { setAuthMode('login'); setErrorMsg(''); setSuccessMsg('') }} style={{ background: 'none', border: 'none', color: '#0066cc', cursor: 'pointer', textDecoration: 'underline' }}>
                ← {lang === 'bn' ? 'লগইনে ফিরে যান' : 'Back to Login'}
              </button>
            ) : (
              <p style={{ margin: 0, color: colors.text }}>
                {authMode === 'signup' ? translations[lang].haveAccount : translations[lang].newUser}{' '}
                <button onClick={() => { setAuthMode(authMode === 'signup' ? 'login' : 'signup'); setErrorMsg(''); setSuccessMsg('') }} style={{ background: 'none', border: 'none', color: '#0066cc', cursor: 'pointer', textDecoration: 'underline', fontWeight: '600' }}>
                  {authMode === 'signup' ? translations[lang].switchToLogin : translations[lang].switchToSignUp}
                </button>
              </p>
            )}
          </div>

          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '15px', fontSize: '13.5px' }}>
            <button onClick={toggleTheme} style={{ background: 'none', border: 'none', color: colors.text, cursor: 'pointer', fontWeight: '600' }}>
              {isDark ? `☀️ ${translations[lang].dayMode}` : `🌙 ${translations[lang].nightMode}`}
            </button>
            <span style={{ color: colors.cardBorder }}>|</span>
            <div>
              <span onClick={() => handleSetLang('bn')} style={{ cursor: 'pointer', color: lang === 'bn' ? '#0066cc' : colors.textMuted, fontWeight: lang === 'bn' ? 'bold' : 'normal' }}>বাংলা</span>
              {' / '}
              <span onClick={() => handleSetLang('en')} style={{ cursor: 'pointer', color: lang === 'en' ? '#0066cc' : colors.textMuted, fontWeight: lang === 'en' ? 'bold' : 'normal' }}>EN</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: colors.bg, color: colors.text, transition: 'background-color 0.3s ease, color 0.3s ease', display: 'flex', flexDirection: 'column' }}>
      
      <style>{`
        *, *::before, *::after {
          transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
        @keyframes slideIn {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes popScale {
          0% { transform: scale(1); }
          50% { transform: scale(1.35); }
          100% { transform: scale(1); }
        }
        .reaction-pop {
          animation: popScale 0.25s ease-in-out;
        }
      `}</style>

      {showExitConfirm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000, padding: '15px'
        }}>
          <div style={{
            background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: '14px',
            maxWidth: '320px', width: '100%', padding: '20px', boxShadow: '0 8px 30px rgba(0,0,0,0.4)', textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 10px', color: colors.text, fontSize: '18px' }}>
              {lang === 'bn' ? 'আপনি কি সাইট ছেড়ে যেতে চান?' : 'Do you want to leave this site?'}
            </h3>
            <p style={{ color: colors.textMuted, fontSize: '13.5px', margin: '0 0 20px' }}>
              {lang === 'bn' ? 'আপনি লেখো প্ল্যাটফর্ম থেকে বের হয়ে যাচ্ছেন।' : 'You are exiting Lekho platform.'}
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => setShowExitConfirm(false)}
                style={{
                  flex: 1, padding: '10px', background: isDark ? '#333' : '#e2e8f0', color: colors.text,
                  border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px'
                }}
              >
                No
              </button>
              <button
                onClick={() => {
                  window.history.back()
                }}
                style={{
                  flex: 1, padding: '10px', background: '#ff4d4f', color: '#fff',
                  border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px'
                }}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          background: toast.type === 'success' ? '#10b981' : toast.type === 'error' ? '#ef4444' : '#0066cc',
          color: '#ffffff',
          padding: '10px 22px',
          borderRadius: '24px',
          fontSize: '13.5px',
          fontWeight: 'bold',
          boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
          animation: 'slideIn 0.25s ease-out',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>{toast.message}</span>
        </div>
      )}

      <div style={{ maxWidth: '620px', width: '100%', margin: '0 auto', fontFamily: 'sans-serif', padding: '15px 12px', boxSizing: 'border-box', flex: 1 }}>
        
        {view === 'profile' ? (
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              background: colors.cardBg,
              borderRadius: '12px',
              border: `1px solid ${colors.cardBorder}`,
              marginBottom: '15px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
            }}>
              <button
                onClick={() => { setView('feed'); setViewedUserId(null); clearSinglePostView() }}
                style={{
                  background: isDark ? '#25262a' : '#f1f5f9',
                  color: '#0066cc',
                  border: `1px solid ${colors.cardBorder}`,
                  borderRadius: '8px',
                  padding: '6px 14px',
                  cursor: 'pointer',
                  fontSize: '13.5px',
                  fontWeight: 'bold',
                  minHeight: '38px'
                }}
              >
                ← {lang === 'bn' ? 'ফিডে ফিরে যান' : 'Feed'}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Logo size={30} isDark={isDark} />
                <span style={{ fontWeight: 'bold', fontSize: '16px', color: colors.text }}>{translations[lang].appName}</span>
              </div>

              <button
                onClick={toggleTheme}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', padding: '6px' }}
                title={isDark ? 'Day Mode' : 'Night Mode'}
              >
                {isDark ? '☀️' : '🌙'}
              </button>
            </div>

            <ProfileNoteBox
              profileUserId={viewedUserId || session.user.id}
              session={session}
              lang={lang}
              colors={colors}
              isDark={isDark}
              showToast={showToast}
            />

            <ProfilePage
              session={session}
              lang={lang}
              theme={theme}
              targetUserId={viewedUserId}
              PostCard={(props) => <PostCard {...props} showToast={showToast} />}
              onViewProfile={(userId) => { setViewedUserId(userId); setView('profile') }}
              onAvatarClick={(avatarData) => setAvatarPreview(avatarData)}
            />
          </div>
        ) : view === 'notifications' ? (
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              background: colors.cardBg,
              borderRadius: '12px',
              border: `1px solid ${colors.cardBorder}`,
              marginBottom: '15px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
            }}>
              <button
                onClick={() => setView('feed')}
                style={{
                  background: isDark ? '#25262a' : '#f1f5f9',
                  color: '#0066cc',
                  border: `1px solid ${colors.cardBorder}`,
                  borderRadius: '8px',
                  padding: '6px 14px',
                  cursor: 'pointer',
                  fontSize: '13.5px',
                  fontWeight: 'bold',
                  minHeight: '38px'
                }}
              >
                ← {lang === 'bn' ? 'ফিডে ফিরে যান' : 'Feed'}
              </button>

              <h2 style={{ margin: 0, fontSize: '17px', color: colors.text }}>
                🔔 {lang === 'bn' ? 'সকল নোটিফিকেশন' : 'All Notifications'}
              </h2>

              <button
                onClick={toggleTheme}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', padding: '6px' }}
                title={isDark ? 'Day Mode' : 'Night Mode'}
              >
                {isDark ? '☀️' : '🌙'}
              </button>
            </div>

            <div style={{
              background: colors.cardBg,
              border: `1px solid ${colors.cardBorder}`,
              borderRadius: '12px',
              padding: '16px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
              {notifications.length === 0 ? (
                <p style={{ textAlign: 'center', color: colors.textMuted, fontSize: '14px', margin: '40px 0' }}>
                  {lang === 'bn' ? 'কোনো নোটিফিকেশন নেই।' : 'No notifications yet.'}
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {notifications.map(n => {
                    const actor = n.profiles
                    const actorName = actor?.full_name || actor?.name || (lang === 'bn' ? 'একজন পাঠক' : 'A reader')
                    let text = ''

                    if (n.type === 'love') text = lang === 'bn' ? 'আপনার লেখায় লাভ (❤️) দিয়েছেন।' : 'loved your post.'
                    else if (n.type === 'insightful') text = lang === 'bn' ? 'আপনার লেখায় তথ্যবহুল (💡) দিয়েছেন।' : 'found your post insightful.'
                    else if (n.type === 'comment') text = lang === 'bn' ? 'আপনার লেখায় মন্তব্য করেছেন।' : 'commented on your post.'
                    else if (n.type === 'reply') text = lang === 'bn' ? 'আপনার মন্তব্যে রিপ্লাই দিয়েছেন।' : 'replied to your comment.'
                    else if (n.type === 'follow') text = lang === 'bn' ? 'আপনাকে ফলো করা শুরু করেছেন।' : 'started following you.'

                    return (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px 14px',
                          borderRadius: '10px',
                          background: n.is_read ? (isDark ? '#191a1d' : '#ffffff') : (isDark ? '#25262c' : '#f1f5f9'),
                          cursor: 'pointer',
                          border: `1px solid ${colors.cardBorder}`
                        }}
                      >
                        {actor?.avatar_url ? (
                          <img src={actor.avatar_url} alt="" style={{ width: '42px', height: '42px', borderRadius: '50%', flexShrink: 0, border: '1.5px solid #0066cc' }} />
                        ) : (
                          <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: isDark ? '#444' : '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                            👤
                          </div>
                        )}
                        <div style={{ flex: 1, fontSize: '14px', textAlign: 'left' }}>
                          <strong style={{ color: '#0066cc' }}>{actorName}</strong>{' '}
                          <span style={{ color: colors.text }}>{text}</span>
                          <div style={{ fontSize: '12px', color: colors.textMuted, marginTop: '4px' }}>
                            {formatDateTime(n.created_at, lang)}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <div
              onClick={handleFeedTabClick}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '14px', cursor: 'pointer' }}
            >
              <Logo size={42} isDark={isDark} />
              <h1 style={{ margin: 0, fontSize: '24px', letterSpacing: '0.8px', color: colors.text }}>{translations[lang].appName}</h1>
            </div>

            <div style={{ position: 'relative', marginBottom: '12px' }}>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  if (view !== 'feed') setView('feed')
                  if (singlePostId) clearSinglePostView()
                }}
                placeholder={lang === 'bn' ? '🔍 খুঁজুন... (@ইউজার, #ট্যাগ বা পোস্ট)' : '🔍 Search... (@user, #tag or post)'}
                style={{
                  width: '100%',
                  padding: '10px 40px 10px 14px',
                  borderRadius: '24px',
                  border: `1px solid ${colors.inputBorder}`,
                  background: colors.inputBg,
                  color: colors.text,
                  fontSize: '14.5px',
                  boxSizing: 'border-box',
                  outline: 'none',
                  textAlign: 'left'
                }}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: colors.textMuted,
                    cursor: 'pointer',
                    fontSize: '16px',
                    padding: '4px'
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 12px',
              background: colors.navBg,
              borderRadius: '12px',
              border: `1px solid ${colors.cardBorder}`,
              marginBottom: '15px',
              position: 'relative',
              boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
            }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={handleFeedTabClick}
                  style={{
                    background: view === 'feed' && !singlePostId ? (isDark ? '#333' : '#e2e8f0') : 'transparent',
                    color: view === 'feed' && !singlePostId ? colors.text : colors.textMuted,
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '13.5px',
                    fontWeight: view === 'feed' && !singlePostId ? 'bold' : 'normal',
                    minHeight: '38px'
                  }}
                >
                  🏠 {lang === 'bn' ? 'ফিড' : 'Feed'}
                </button>

                <button
                  onClick={() => { setView('saved'); clearSinglePostView(); setViewedUserId(null) }}
                  style={{
                    background: view === 'saved' ? (isDark ? '#333' : '#e2e8f0') : 'transparent',
                    color: view === 'saved' ? colors.text : colors.textMuted,
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '13.5px',
                    fontWeight: view === 'saved' ? 'bold' : 'normal',
                    minHeight: '38px'
                  }}
                >
                  📑 {lang === 'bn' ? 'সেভড' : 'Saved'}
                </button>

                {/* ফুল-পেজ নোটিফিকেশন ট্যাব খোলার বাটন */}
                <button
                  onClick={handleOpenNotifications}
                  style={{
                    background: 'transparent',
                    color: unreadNotifCount > 0 ? '#ff9900' : colors.textMuted,
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '13.5px',
                    fontWeight: unreadNotifCount > 0 ? 'bold' : 'normal',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    minHeight: '38px'
                  }}
                >
                  🔔 {lang === 'bn' ? 'নোটিফিকেশন' : 'Notifications'}
                  {unreadNotifCount > 0 && (
                    <span style={{
                      background: '#ff3366',
                      color: '#fff',
                      borderRadius: '10px',
                      padding: '1px 6px',
                      fontSize: '10px',
                      fontWeight: 'bold'
                    }}>
                      {unreadNotifCount}
                    </span>
                  )}
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  onClick={toggleTheme}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '18px',
                    padding: '6px'
                  }}
                  title={isDark ? 'Switch to Day Mode' : 'Switch to Night Mode'}
                >
                  {isDark ? '☀️' : '🌙'}
                </button>

                <div ref={navMenuRef} style={{ position: 'relative' }}>
                  <button
                    onClick={() => setShowNavMenu(!showNavMenu)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: colors.text,
                      fontSize: '20px',
                      cursor: 'pointer',
                      padding: '6px'
                    }}
                  >
                    ⋮
                  </button>

                  {showNavMenu && (
                    <div style={{
                      position: 'absolute',
                      right: 0,
                      top: '36px',
                      background: colors.cardBg,
                      border: `1px solid ${colors.cardBorder}`,
                      borderRadius: '10px',
                      boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                      zIndex: 100,
                      minWidth: '190px',
                      padding: '6px 0',
                      textAlign: 'left'
                    }}>
                      <button
                        onClick={() => {
                          setViewedUserId(null)
                          setView('profile')
                          setShowNavMenu(false)
                        }}
                        style={{ display: 'block', width: '100%', padding: '10px 16px', background: 'none', border: 'none', color: colors.text, textAlign: 'left', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}
                      >
                        👤 {lang === 'bn' ? 'নিজের প্রোফাইল' : 'My Profile'}
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => {
                            setShowAdminModal(true)
                            setShowNavMenu(false)
                          }}
                          style={{ display: 'block', width: '100%', padding: '10px 16px', background: 'none', border: 'none', color: '#0066cc', textAlign: 'left', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}
                        >
                          🛠️ {lang === 'bn' ? 'অ্যাডমিন প্যানেল' : 'Admin Panel'}
                        </button>
                      )}

                      <div style={{ padding: '8px 16px', fontSize: '13px', color: colors.textMuted, borderTop: `1px solid ${colors.cardBorder}`, borderBottom: `1px solid ${colors.cardBorder}` }}>
                        🌐 {lang === 'bn' ? 'ভাষা:' : 'Lang:'}{' '}
                        <span onClick={() => handleSetLang('bn')} style={{ cursor: 'pointer', color: lang === 'bn' ? '#0066cc' : colors.textMuted, fontWeight: lang === 'bn' ? 'bold' : 'normal' }}>বাংলা</span>
                        {' | '}
                        <span onClick={() => handleSetLang('en')} style={{ cursor: 'pointer', color: lang === 'en' ? '#0066cc' : colors.textMuted, fontWeight: lang === 'en' ? 'bold' : 'normal' }}>EN</span>
                      </div>

                      <button
                        onClick={handleDeleteAccount}
                        style={{ display: 'block', width: '100%', padding: '10px 16px', background: 'none', border: 'none', color: '#ff4d4f', textAlign: 'left', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}
                      >
                        ⚠️ {lang === 'bn' ? 'অ্যাকাউন্ট ডিলিট করুন' : 'Delete Account'}
                      </button>

                      <button
                        onClick={handleLogout}
                        style={{ display: 'block', width: '100%', padding: '10px 16px', background: 'none', border: 'none', color: colors.text, textAlign: 'left', cursor: 'pointer', fontSize: '14px', fontWeight: '500', borderTop: `1px solid ${colors.cardBorder}` }}
                      >
                        🚪 {translations[lang].logout}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {view === 'feed' && !singlePostId && !searchTerm && (
              <div style={{ display: 'flex', borderBottom: `2px solid ${colors.cardBorder}`, marginBottom: '16px' }}>
                <button
                  onClick={() => setFeedTab('explore')}
                  style={{
                    flex: 1,
                    padding: '10px 0',
                    background: 'none',
                    border: 'none',
                    borderBottom: feedTab === 'explore' ? '3px solid #0066cc' : 'none',
                    color: feedTab === 'explore' ? '#0066cc' : colors.textMuted,
                    fontWeight: feedTab === 'explore' ? 'bold' : 'normal',
                    cursor: 'pointer',
                    fontSize: '14px',
                    minHeight: '40px'
                  }}
                >
                  🔥 {lang === 'bn' ? 'সবার জন্য' : 'Explore'}
                </button>

                <button
                  onClick={() => setFeedTab('trending')}
                  style={{
                    flex: 1,
                    padding: '10px 0',
                    background: 'none',
                    border: 'none',
                    borderBottom: feedTab === 'trending' ? '3px solid #0066cc' : 'none',
                    color: feedTab === 'trending' ? '#0066cc' : colors.textMuted,
                    fontWeight: feedTab === 'trending' ? 'bold' : 'normal',
                    cursor: 'pointer',
                    fontSize: '14px',
                    minHeight: '40px'
                  }}
                >
                  📈 {lang === 'bn' ? 'ট্রেন্ডিং' : 'Trending'}
                </button>

                <button
                  onClick={() => setFeedTab('following')}
                  style={{
                    flex: 1,
                    padding: '10px 0',
                    background: 'none',
                    border: 'none',
                    borderBottom: feedTab === 'following' ? '3px solid #0066cc' : 'none',
                    color: feedTab === 'following' ? '#0066cc' : colors.textMuted,
                    fontWeight: feedTab === 'following' ? 'bold' : 'normal',
                    cursor: 'pointer',
                    fontSize: '14px',
                    minHeight: '40px'
                  }}
                >
                  👥 {lang === 'bn' ? 'ফলোয়িং' : 'Following'}
                </button>
              </div>
            )}

            {view === 'feed' && !singlePostId && (
              <NewPostForm
                session={session}
                lang={lang}
                colors={colors}
                isDark={isDark}
                showToast={showToast}
                onPostCreated={() => setRefreshFeed(r => r + 1)}
              />
            )}

            <Feed
              session={session}
              lang={lang}
              colors={colors}
              isDark={isDark}
              searchTerm={searchTerm}
              viewMode={view}
              feedTab={feedTab}
              singlePostId={singlePostId}
              refreshFeed={refreshFeed}
              showToast={showToast}
              onViewProfile={(userId) => { setViewedUserId(userId); setView('profile') }}
              onAvatarClick={(avatarData) => setAvatarPreview(avatarData)}
              onOpenOriginalPost={(postId) => {
                setSinglePostId(postId)
                window.scrollTo({ top: 0, behavior: 'smooth' })
                window.history.pushState({}, '', `?post=${postId}`)
              }}
            />
          </>
        )}

        {avatarPreview && (
          <div
            onClick={() => setAvatarPreview(null)}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(3px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 1000, padding: '20px'
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: '16px',
                padding: '24px 20px', textAlign: 'center', maxWidth: '300px', width: '100%',
                boxShadow: '0 8px 30px rgba(0,0,0,0.4)', position: 'relative'
              }}
            >
              <button
                onClick={() => setAvatarPreview(null)}
                style={{ position: 'absolute', right: '12px', top: '12px', background: 'none', border: 'none', color: colors.textMuted, fontSize: '18px', cursor: 'pointer', padding: '6px' }}
              >
                ✕
              </button>

              <img
                src={avatarPreview.url}
                alt=""
                style={{
                  width: '120px', height: '120px', borderRadius: '50%',
                  border: '3px solid #0066cc', boxShadow: '0 4px 15px rgba(0,102,204,0.3)',
                  margin: '0 auto 15px', display: 'block'
                }}
              />

              <h3 style={{ margin: '0 0 6px', color: colors.text, fontSize: '18px' }}>{avatarPreview.name}</h3>

              <button
                onClick={() => {
                  const uid = avatarPreview.userId
                  setAvatarPreview(null)
                  if (uid) {
                    setViewedUserId(uid)
                    setView('profile')
                  }
                }}
                style={{
                  marginTop: '12px', padding: '10px 20px', background: '#0066cc', color: '#fff',
                  border: 'none', borderRadius: '20px', cursor: 'pointer', fontSize: '13.5px', fontWeight: 'bold'
                }}
              >
                👤 {lang === 'bn' ? 'প্রোফাইল দেখুন' : 'View Profile'}
              </button>
            </div>
          </div>
        )}

      </div>

      {view !== 'profile' && view !== 'notifications' && (
        <footer style={{
          marginTop: 'auto',
          borderTop: `1px solid ${colors.cardBorder}`,
          padding: '18px 12px',
          textAlign: 'center',
          background: colors.cardBg
        }}>
          <button
            onClick={() => setShowFeedbackModal(true)}
            style={{
              background: 'none',
              border: `1px solid ${colors.cardBorder}`,
              color: '#0066cc',
              padding: '8px 18px',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '13.5px',
              fontWeight: 'bold',
              minHeight: '40px'
            }}
          >
            💡 {lang === 'bn' ? 'মতামত বা সমস্যা জানান (Feedback)' : 'Send Feedback / Report Issue'}
          </button>
          <div style={{ fontSize: '12px', color: colors.textMuted, marginTop: '10px' }}>
            © 2026 {translations[lang].appName}. All rights reserved.
          </div>
        </footer>
      )}

      {showFeedbackModal && (
        <FeedbackModal
          session={session}
          lang={lang}
          colors={colors}
          isDark={isDark}
          showToast={showToast}
          onClose={() => setShowFeedbackModal(false)}
        />
      )}

      {showAdminModal && isAdmin && (
        <AdminDashboardModal
          lang={lang}
          colors={colors}
          isDark={isDark}
          showToast={showToast}
          onClose={() => setShowAdminModal(false)}
          onRefreshFeed={() => setRefreshFeed(r => r + 1)}
          onOpenOriginalPost={(postId) => {
            setShowAdminModal(false)
            setSinglePostId(postId)
            window.scrollTo({ top: 0, behavior: 'smooth' })
            window.history.pushState({}, '', `?post=${postId}`)
          }}
        />
      )}

    </div>
  )
}

function Feed({ session, lang, colors, isDark, searchTerm, viewMode, feedTab, singlePostId, refreshFeed, showToast, onViewProfile, onAvatarClick, onOpenOriginalPost }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const [userResults, setUserResults] = useState([])

  useEffect(() => {
    setPosts([])
    setPage(0)
    setHasMore(true)
    loadPosts(0, true)
  }, [refreshFeed, searchTerm, viewMode, feedTab, singlePostId])

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 300) {
        if (!loadingMore && hasMore && !singlePostId) {
          const nextPage = page + 1
          setPage(nextPage)
          loadPosts(nextPage, false)
        }
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [loadingMore, hasMore, page, singlePostId])

  const applySmartRanking = (rawPosts, isTrending = false) => {
    const now = Date.now()
    return [...rawPosts].map(post => {
      const ageInHours = Math.max(0.1, (now - new Date(post.created_at).getTime()) / (1000 * 60 * 60))
      const loveCount = post.likes ? post.likes.filter(l => l.type === 'love' || l.type === 'insightful').length : 0
      const commentCount = post.comments ? post.comments.length : 0
      const viewCount = post.post_views ? post.post_views.length : 0

      const engagement = (loveCount * 4) + (commentCount * 6) + (viewCount * 1)
      const timeDivisor = isTrending ? Math.pow(ageInHours + 2, 0.9) : Math.pow(ageInHours + 2, 1.25)
      const score = (engagement + 5) / timeDivisor
      return { ...post, smartScore: score }
    }).sort((a, b) => b.smartScore - a.smartScore)
  }

  const loadPosts = async (pageNumber, isInitial = false) => {
    if (isInitial) setLoading(true)
    else setLoadingMore(true)
    setUserResults([])

    if (singlePostId) {
      const { data } = await supabase
        .from('posts')
        .select('*, profiles(name, full_name, avatar_url)')
        .eq('id', singlePostId)

      setPosts(data || [])
      setHasMore(false)
      setLoading(false)
      setLoadingMore(false)
      return
    }

    if (viewMode === 'saved') {
      const { data: bData } = await supabase
        .from('bookmarks')
        .select('post_id')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (!bData || bData.length === 0) {
        setPosts([])
        setHasMore(false)
        setLoading(false)
        setLoadingMore(false)
        return
      }

      const postIds = bData.map(b => b.post_id)
      const from = pageNumber * POSTS_PER_PAGE
      const to = from + POSTS_PER_PAGE - 1

      const { data } = await supabase
        .from('posts')
        .select('*, profiles(name, full_name, avatar_url)', { count: 'exact' })
        .in('id', postIds)
        .range(from, to)

      const newPosts = data || []
      if (newPosts.length < POSTS_PER_PAGE) setHasMore(false)
      setPosts(prev => isInitial ? newPosts : [...prev, ...newPosts])
      setLoading(false)
      setLoadingMore(false)
      return
    }

    const queryText = searchTerm.trim()
    if (queryText.startsWith('@')) {
      const usernameQuery = queryText.slice(1).trim()
      if (usernameQuery) {
        const { data: matchedUsers } = await supabase
          .from('profiles')
          .select('id, name, full_name, avatar_url')
          .or(`name.ilike.%${usernameQuery}%,full_name.ilike.%${usernameQuery}%`)
          .limit(5)

        if (matchedUsers && matchedUsers.length > 0) {
          setUserResults(matchedUsers)
          const userIds = matchedUsers.map(u => u.id)

          const { data } = await supabase
            .from('posts')
            .select('*, profiles(name, full_name, avatar_url), likes(type), comments(id), post_views(id)')
            .in('author_id', userIds)

          const ranked = applySmartRanking(data || [])
          setPosts(ranked)
          setHasMore(false)
        }
        setLoading(false)
        setLoadingMore(false)
        return
      }
    }

    if (queryText.startsWith('#')) {
      const tagQuery = queryText.slice(1).trim().toLowerCase()
      if (tagQuery) {
        const matchedCategory = CATEGORIES.find(c =>
          c.key.toLowerCase().includes(tagQuery) ||
          c.bn.toLowerCase().includes(tagQuery) ||
          c.en.toLowerCase().includes(tagQuery)
        )

        let q = supabase
          .from('posts')
          .select('*, profiles(name, avatar_url), likes(type), comments(id), post_views(id)')

        if (matchedCategory) {
          q = q.eq('category', matchedCategory.key)
        } else {
          q = q.or(`title.ilike.%${tagQuery}%,content.ilike.%${tagQuery}%`)
        }

        const { data } = await q
        const ranked = applySmartRanking(data || [])
        setPosts(ranked)
        setHasMore(false)
        setLoading(false)
        setLoadingMore(false)
        return
      }
    }

    if (feedTab === 'following' && !queryText) {
      const { data: followData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', session.user.id)

      const followingIds = followData ? followData.map(f => f.following_id) : []

      if (followingIds.length === 0) {
        setPosts([])
        setHasMore(false)
        setLoading(false)
        setLoadingMore(false)
        return
      }

      const from = pageNumber * POSTS_PER_PAGE
      const to = from + POSTS_PER_PAGE - 1

      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles(name, full_name, avatar_url), likes(type), comments(id), post_views(id)')
        .in('author_id', followingIds)
        .order('created_at', { ascending: false })
        .range(from, to)

      if (!error) {
        const newPosts = data || []
        if (newPosts.length < POSTS_PER_PAGE) setHasMore(false)
        setPosts(prev => isInitial ? newPosts : [...prev, ...newPosts])
      }
      setLoading(false)
      setLoadingMore(false)
      return
    }

    let q = supabase
      .from('posts')
      .select('*, profiles(name, full_name, avatar_url), likes(type), comments(id), post_views(id)')

    if (queryText) {
      q = q.or(`title.ilike.%${queryText}%,content.ilike.%${queryText}%`)
    }

    const { data, error } = await q
    if (!error) {
      const isTrending = feedTab === 'trending'
      const ranked = applySmartRanking(data || [], isTrending)
      
      const from = pageNumber * POSTS_PER_PAGE
      const to = from + POSTS_PER_PAGE
      const sliced = ranked.slice(from, to)

      if (sliced.length < POSTS_PER_PAGE) setHasMore(false)
      setPosts(prev => isInitial ? sliced : [...prev, ...sliced])
    }
    setLoading(false)
    setLoadingMore(false)
  }

  return (
    <div style={{ textAlign: 'left' }}>
      {userResults.length > 0 && (
        <div style={{ background: colors.cardBg, padding: '10px 14px', borderRadius: '10px', marginBottom: '14px', border: `1px solid ${colors.cardBorder}` }}>
          <div style={{ fontSize: '12px', color: colors.textMuted, marginBottom: '6px' }}>
            {lang === 'bn' ? '👤 প্রাপ্ত লেখক/ইউজার:' : '👤 Matched Authors:'}
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {userResults.map(u => (
              <div
                key={u.id}
                onClick={() => onViewProfile(u.id)}
                style={{
                  background: isDark ? '#2a2b30' : '#f1f5f9',
                  padding: '6px 12px',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: '#0066cc',
                  border: `1px solid ${colors.cardBorder}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  minHeight: '36px'
                }}
              >
                {u.avatar_url && (
                  <img src={u.avatar_url} alt="" style={{ width: '20px', height: '20px', borderRadius: '50%' }} />
                )}
                <span>@{u.full_name || u.name}</span>
                <span style={{ fontSize: '11px', color: colors.textMuted }}>↗</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div>
          <SkeletonPostCard colors={colors} isDark={isDark} />
          <SkeletonPostCard colors={colors} isDark={isDark} />
          <SkeletonPostCard colors={colors} isDark={isDark} />
        </div>
      ) : posts.length === 0 ? (
        <p style={{ color: colors.textMuted, textAlign: 'center', margin: '30px 0', fontSize: '14.5px' }}>
          {feedTab === 'following'
            ? (lang === 'bn' ? 'আপনি এখনো কাউকে ফলো করেননি বা তারা কোনো পোস্ট করেননি।' : 'You are not following anyone yet or they have not posted.')
            : feedTab === 'trending'
            ? (lang === 'bn' ? 'এই মুহূর্তে কোনো ট্রেন্ডিং পোস্ট নেই।' : 'No trending posts right now.')
            : (lang === 'bn' ? 'কোনো পোস্ট পাওয়া যায়নি।' : translations[lang].noPosts)}
        </p>
      ) : (
        <div>
          {posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              session={session}
              lang={lang}
              colors={colors}
              isDark={isDark}
              showToast={showToast}
              onChanged={() => loadPosts(0, true)}
              onViewProfile={onViewProfile}
              onAvatarClick={onAvatarClick}
              onOpenOriginalPost={onOpenOriginalPost}
            />
          ))}

          {loadingMore && (
            <div style={{ textAlign: 'center', margin: '20px 0', color: colors.textMuted, fontSize: '13.5px' }}>
              {lang === 'bn' ? 'আরও পোস্ট লোড হচ্ছে...' : 'Loading more posts...'}
            </div>
          )}

          {!hasMore && posts.length > 5 && (
            <div style={{ textAlign: 'center', margin: '20px 0', color: colors.textMuted, fontSize: '12.5px' }}>
              ✨ {lang === 'bn' ? 'সব পোস্ট দেখা শেষ!' : 'You have reached the end!'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function PostCard({ post, session, lang, colors, isDark, showToast, onChanged, onViewProfile, onAvatarClick, onOpenOriginalPost }) {
  const [loveCount, setLoveCount] = useState(0)
  const [insightfulCount, setInsightfulCount] = useState(0)
  const [unlikeCount, setUnlikeCount] = useState(0)
  const [myReaction, setMyReaction] = useState(null)
  const [loadingLike, setLoadingLike] = useState(false)
  const [popEffect, setPopEffect] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const [showReactionPicker, setShowReactionPicker] = useState(false)
  const pressTimer = useRef(null)

  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [showComments, setShowComments] = useState(false)
  const [postingComment, setPostingComment] = useState(false)
  const [viewCount, setViewCount] = useState(0)

  const [isBookmarked, setIsBookmarked] = useState(false)

  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(post.title || '')
  const [editContent, setEditContent] = useState(post.content)
  const [editCategory, setEditCategory] = useState(post.category)
  const [saving, setSaving] = useState(false)
  const [showPostMenu, setShowPostMenu] = useState(false)

  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState('spam')
  const [customReason, setCustomReason] = useState('')
  const [submittingReport, setSubmittingReport] = useState(false)

  const [showRepostModal, setShowRepostModal] = useState(false)
  const [repostCaption, setRepostCaption] = useState('')
  const [reposting, setReposting] = useState(false)

  const [editingCommentId, setEditingCommentId] = useState(null)
  const [editingCommentText, setEditingCommentText] = useState('')
  const [savingCommentEdit, setSavingCommentEdit] = useState(false)
  const [openCommentMenuId, setOpenCommentMenuId] = useState(null)

  const [replyingToId, setReplyingToId] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [postingReply, setPostingReply] = useState(false)

  const postMenuRef = useRef(null)

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (postMenuRef.current && !postMenuRef.current.contains(e.target)) {
        setShowPostMenu(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('touchstart', handleOutsideClick)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('touchstart', handleOutsideClick)
    }
  }, [])

  const isOwner = session?.user?.id === post.author_id

  const isRepost = post.content && post.content.includes('--- Original Post ---')
  let repostCaptionText = ''
  let originalAuthorName = 'Original Author'
  let originalPostContent = ''
  let originalPostId = post.original_post_id || null

  if (isRepost) {
    const parts = post.content.split('--- Original Post ---')
    repostCaptionText = parts[0].trim()
    const origBlock = parts[1] || ''
    
    const authorMatch = origBlock.match(/@([^\n:]+):/)
    if (authorMatch && authorMatch[1].trim() !== 'Original Author') {
      originalAuthorName = authorMatch[1].trim()
      originalPostContent = origBlock.replace(authorMatch[0], '').trim()
    } else {
      originalAuthorName = post.profiles?.full_name || post.profiles?.name || 'User'
      originalPostContent = origBlock.replace(/@([^\n:]+):/, '').trim()
    }
  }

  useEffect(() => {
    if (post?.id && session?.user?.id) {
      loadReactions()
      loadComments()
      loadBookmarkStatus()
      recordView()
    }
  }, [post.id, session?.user?.id])

  const loadBookmarkStatus = async () => {
    const { data } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('post_id', post.id)
      .eq('user_id', session.user.id)
      .maybeSingle()

    setIsBookmarked(!!data)
  }

  const handleBookmarkToggle = async () => {
    setShowPostMenu(false)
    if (isBookmarked) {
      await supabase
        .from('bookmarks')
        .delete()
        .eq('post_id', post.id)
        .eq('user_id', session.user.id)
      setIsBookmarked(false)
      showToast(lang === 'bn' ? 'পোস্ট সেভ তালিকা থেকে সরানো হয়েছে' : 'Removed from saved', 'info')
    } else {
      await supabase
        .from('bookmarks')
        .insert({ post_id: post.id, user_id: session.user.id })
      setIsBookmarked(true)
      showToast(lang === 'bn' ? '⭐ পোস্ট সেভ করা হয়েছে!' : '⭐ Post saved!', 'success')
    }
  }

  const handleShare = async () => {
    setShowPostMenu(false)
    const shareUrl = `${window.location.origin}?post=${post.id}`
    const shareData = {
      title: post.title || 'Lekho',
      text: post.content ? post.content.slice(0, 100) + '...' : '',
      url: shareUrl,
    }

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData)
        return
      } catch (err) {
        if (err.name !== 'AbortError') console.error(err)
      }
    }

    await navigator.clipboard.writeText(shareUrl)
    showToast(lang === 'bn' ? '📋 পোস্টের লিংক কপি করা হয়েছে!' : '📋 Link copied to clipboard!', 'success')
  }

  const handleRepostSubmit = async (e) => {
    e.preventDefault()
    setReposting(true)

    const authorName = post.profiles?.full_name || post.profiles?.name || 'User'
    const sharedContent = `${repostCaption ? repostCaption + '\n\n' : ''}--- Original Post ---\n@${authorName}:\n${post.content}`

    const { error } = await supabase.from('posts').insert({
      author_id: session.user.id,
      title: null,
      content: sharedContent,
      category: post.category,
      original_post_id: post.id
    })

    setReposting(false)
    setShowRepostModal(false)
    setRepostCaption('')

    if (!error) {
      showToast(lang === 'bn' ? '🚀 আপনার টাইমলাইনে পোস্টটি শেয়ার করা হয়েছে!' : '🚀 Post shared to your timeline!', 'success')
      if (onChanged) onChanged()
    } else {
      showToast('Error: ' + error.message, 'error')
    }
  }

  const handleSubmitReport = async (e) => {
    e.preventDefault()
    setSubmittingReport(true)

    const finalReason = reportReason === 'other' ? customReason : reportReason

    const { error } = await supabase.from('reports').insert({
      post_id: post.id,
      reporter_id: session.user.id,
      reason: finalReason
    })

    setSubmittingReport(false)
    setShowReportModal(false)

    if (!error) {
      showToast(lang === 'bn' ? '✅ পোস্টটি রিপোর্ট করা হয়েছে।' : '✅ Post reported successfully.', 'success')
    } else {
      showToast('Error: ' + error.message, 'error')
    }
  }

  const loadReactions = async () => {
    const { count: loveC } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post.id)
      .eq('type', 'love')

    const { count: insightC } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post.id)
      .eq('type', 'insightful')

    const { count: unlikeC } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post.id)
      .eq('type', 'unlike')

    setLoveCount(loveC || 0)
    setInsightfulCount(insightC || 0)
    setUnlikeCount(unlikeC || 0)

    const { data } = await supabase
      .from('likes')
      .select('type')
      .eq('post_id', post.id)
      .eq('user_id', session.user.id)
      .maybeSingle()

    setMyReaction(data ? data.type : null)
  }

  const handleReaction = async (type) => {
    setShowReactionPicker(false)
    const prevReaction = myReaction

    setPopEffect(true)
    setTimeout(() => setPopEffect(false), 300)

    await supabase
      .from('likes')
      .delete()
      .eq('post_id', post.id)
      .eq('user_id', session.user.id)

    if (prevReaction === type) {
      setMyReaction(null)
    } else {
      setMyReaction(type)
      await supabase
        .from('likes')
        .insert({ post_id: post.id, user_id: session.user.id, type })
    }
    loadReactions()
  }

  const startPressTimer = () => {
    pressTimer.current = setTimeout(() => {
      setShowReactionPicker(true)
    }, 450)
  }

  const clearPressTimer = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current)
  }

  const handleLoveButtonClick = () => {
    if (showReactionPicker) return
    handleReaction('love')
  }

  const loadComments = async () => {
    const { data } = await supabase
      .from('comments')
      .select('*, profiles(name, full_name, avatar_url)')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true })

    setComments(data || [])
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setPostingComment(true)

    const { error } = await supabase.from('comments').insert({
      post_id: post.id,
      user_id: session.user.id,
      content: newComment.trim(),
      parent_id: null
    })

    setPostingComment(false)

    if (!error) {
      setNewComment('')
      loadComments()
    } else {
      showToast('Error: ' + error.message, 'error')
    }
  }

  const handleAddReply = async (e, parentId) => {
    e.preventDefault()
    if (!replyText.trim()) return

    setPostingReply(true)

    const { error } = await supabase.from('comments').insert({
      post_id: post.id,
      user_id: session.user.id,
      content: replyText.trim(),
      parent_id: parentId
    })

    setPostingReply(false)

    if (!error) {
      setReplyText('')
      setReplyingToId(null)
      loadComments()
    } else {
      showToast('Error: ' + error.message, 'error')
    }
  }

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm(lang === 'bn' ? 'তুমি কি নিশ্চিত এই মন্তব্যটি মুছে ফেলতে চাও?' : 'Delete this comment?')) return

    const { error } = await supabase.from('comments').delete().eq('id', commentId)
    if (error) {
      showToast('Error: ' + error.message, 'error')
    } else {
      setOpenCommentMenuId(null)
      loadComments()
    }
  }

  const handleSaveCommentEdit = async (e, commentId) => {
    e.preventDefault()
    if (!editingCommentText.trim()) return

    setSavingCommentEdit(true)
    const { error } = await supabase
      .from('comments')
      .update({ content: editingCommentText.trim() })
      .eq('id', commentId)

    setSavingCommentEdit(false)

    if (error) {
      showToast('Error: ' + error.message, 'error')
    } else {
      setEditingCommentId(null)
      setEditingCommentText('')
      setOpenCommentMenuId(null)
      loadComments()
    }
  }

  const recordView = async () => {
    const { data: existing } = await supabase
      .from('post_views')
      .select('id')
      .eq('post_id', post.id)
      .eq('user_id', session.user.id)
      .maybeSingle()

    if (!existing) {
      await supabase
        .from('post_views')
        .insert({ post_id: post.id, user_id: session.user.id })
    }

    const { count } = await supabase
      .from('post_views')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post.id)

    setViewCount(count || 0)
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    if (!editContent.trim()) return

    setSaving(true)
    const { error } = await supabase
      .from('posts')
      .update({ title: editTitle, content: editContent, category: editCategory })
      .eq('id', post.id)

    setSaving(false)

    if (error) {
      showToast('Error: ' + error.message, 'error')
    } else {
      setEditing(false)
      setShowPostMenu(false)
      showToast(lang === 'bn' ? 'পোস্ট এডিট সম্পন্ন!' : 'Post updated!', 'success')
      if (onChanged) onChanged()
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(lang === 'bn' ? 'তুমি কি নিশ্চিত এই পোস্ট মুছে ফেলতে চাও?' : 'Delete this post?')) return

    const { error } = await supabase.from('posts').delete().eq('id', post.id)

    if (error) {
      showToast('Error: ' + error.message, 'error')
    } else {
      showToast(lang === 'bn' ? 'পোস্ট মুছে ফেলা হয়েছে।' : 'Post deleted.', 'info')
      if (onChanged) onChanged()
    }
  }

  const renderReactionIcons = () => {
    if (loveCount > 0 && insightfulCount > 0) {
      if (loveCount >= insightfulCount) {
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', marginRight: '5px' }}>
            <span style={{ zIndex: 2 }}>❤️</span>
            <span style={{ zIndex: 1, marginLeft: '-4px', fontSize: '11px' }}>💡</span>
          </span>
        )
      } else {
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', marginRight: '5px' }}>
            <span style={{ zIndex: 2 }}>💡</span>
            <span style={{ zIndex: 1, marginLeft: '-4px', fontSize: '11px' }}>❤️</span>
          </span>
        )
      }
    }
    if (insightfulCount > 0) return <span style={{ marginRight: '5px' }}>💡</span>
    if (loveCount > 0) return <span style={{ marginRight: '5px' }}>❤️</span>
    return <span style={{ marginRight: '5px' }}>{myReaction === 'insightful' ? '💡' : '❤️'}</span>
  }

  if (editing) {
    return (
      <div style={{ border: `1px solid ${colors.cardBorder}`, borderRadius: '12px', padding: '16px', marginBottom: '14px', background: colors.cardBg, textAlign: 'left' }}>
        <form onSubmit={handleSaveEdit}>
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder={lang === 'bn' ? 'শিরোনাম (ঐচ্ছিক)' : 'Title (optional)'}
            style={{ width: '100%', padding: '8px', marginBottom: '10px', background: colors.inputBg, color: colors.text, border: `1px solid ${colors.inputBorder}`, borderRadius: '6px', boxSizing: 'border-box', textAlign: 'left', fontSize: '15px' }}
          />
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={3}
            style={{ width: '100%', padding: '8px', fontFamily: 'inherit', background: colors.inputBg, color: colors.text, border: `1px solid ${colors.inputBorder}`, borderRadius: '6px', boxSizing: 'border-box', textAlign: 'left', fontSize: '15px' }}
            required
          />
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} style={{ padding: '6px 10px', background: colors.inputBg, color: colors.text, border: `1px solid ${colors.inputBorder}`, borderRadius: '6px', fontSize: '13px' }}>
              {CATEGORIES.map(c => <option key={c.key} value={c.key}>{lang === 'bn' ? c.bn : c.en}</option>)}
            </select>
            <button type="submit" disabled={saving} style={{ padding: '6px 16px', background: '#0066cc', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13.5px' }}>
              {saving ? (lang === 'bn' ? 'সেভ...' : 'Saving...') : (lang === 'bn' ? 'সেভ' : 'Save')}
            </button>
            <button type="button" onClick={() => setEditing(false)} style={{ padding: '6px 14px', background: isDark ? '#444' : '#e2e8f0', color: colors.text, border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13.5px' }}>
              {lang === 'bn' ? 'বাতিল' : 'Cancel'}
            </button>
          </div>
        </form>
      </div>
    )
  }

  const rootComments = comments.filter(c => !c.parent_id)

  const renderCommentItem = (c, isReply = false) => {
    const isCommentOwner = session?.user?.id === c.user_id
    const canDelete = isCommentOwner || isOwner
    const replies = comments.filter(r => r.parent_id === c.id)

    return (
      <div key={c.id} style={{ marginBottom: '8px', marginLeft: isReply ? '18px' : '0px', textAlign: 'left' }}>
        <div style={{ background: isReply ? (isDark ? '#25262a' : '#f1f5f9') : (isDark ? '#1e1f23' : '#f8fafc'), padding: '8px 12px', borderRadius: '8px', position: 'relative', border: `1px solid ${colors.cardBorder}` }}>
          {editingCommentId === c.id ? (
            <form onSubmit={(e) => handleSaveCommentEdit(e, c.id)} style={{ display: 'flex', gap: '6px' }}>
              <input
                type="text"
                value={editingCommentText}
                onChange={(e) => setEditingCommentText(e.target.value)}
                required
                style={{ flex: 1, padding: '6px 8px', fontSize: '13.5px', background: colors.inputBg, color: colors.text, border: `1px solid ${colors.inputBorder}`, borderRadius: '6px', textAlign: 'left' }}
              />
              <button type="submit" disabled={savingCommentEdit} style={{ padding: '4px 10px', fontSize: '12px', background: '#0066cc', color: '#fff', border: 'none', borderRadius: '6px' }}>
                {savingCommentEdit ? '...' : (lang === 'bn' ? 'সেভ' : 'Save')}
              </button>
              <button type="button" onClick={() => setEditingCommentId(null)} style={{ padding: '4px 10px', fontSize: '12px', background: isDark ? '#444' : '#cbd5e1', color: colors.text, border: 'none', borderRadius: '6px' }}>
                ✕
              </button>
            </form>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {c.profiles?.avatar_url && (
                  <img
                    src={c.profiles.avatar_url}
                    alt=""
                    onClick={() => onAvatarClick && onAvatarClick({ url: c.profiles.avatar_url, name: c.profiles.full_name || c.profiles.name, userId: c.user_id })}
                    style={{ width: '24px', height: '24px', borderRadius: '50%', cursor: 'pointer', border: '1px solid #0066cc' }}
                  />
                )}
                <div style={{ textAlign: 'left' }}>
                  <strong style={{ fontSize: '13.5px', cursor: 'pointer', color: '#0066cc' }} onClick={() => onViewProfile && onViewProfile(c.user_id)}>
                    {c.profiles?.full_name || c.profiles?.name || translations[lang].unknownCommenter}:
                  </strong>{' '}
                  <span style={{ fontSize: '13.5px', color: colors.text }}>{c.content}</span>
                </div>
              </div>

              {(isCommentOwner || canDelete) && (
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setOpenCommentMenuId(openCommentMenuId === c.id ? null : c.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: colors.textMuted, padding: '2px 6px' }}
                  >
                    ⋮
                  </button>

                  {openCommentMenuId === c.id && (
                    <div style={{
                      position: 'absolute', right: 0, top: '22px', background: colors.cardBg,
                      border: `1px solid ${colors.cardBorder}`, borderRadius: '8px', padding: '4px 0',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 10, minWidth: '90px', textAlign: 'left'
                    }}>
                      {isCommentOwner && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCommentId(c.id)
                            setEditingCommentText(c.content)
                            setOpenCommentMenuId(null)
                          }}
                          style={{ display: 'block', width: '100%', background: 'none', border: 'none', color: '#0066cc', padding: '6px 12px', textAlign: 'left', cursor: 'pointer', fontSize: '13px' }}
                        >
                          {lang === 'bn' ? 'এডিট' : 'Edit'}
                        </button>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => handleDeleteComment(c.id)}
                          style={{ display: 'block', width: '100%', background: 'none', border: 'none', color: '#ff4d4f', padding: '6px 12px', textAlign: 'left', cursor: 'pointer', fontSize: '13px' }}
                        >
                          {lang === 'bn' ? 'ডিলিট' : 'Delete'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {!isReply && (
            <div style={{ marginTop: '4px', marginLeft: '32px', textAlign: 'left' }}>
              <button
                type="button"
                onClick={() => {
                  setReplyingToId(replyingToId === c.id ? null : c.id)
                  setReplyText('')
                }}
                style={{ background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer', fontSize: '12px', padding: 0, fontWeight: '600' }}
              >
                {lang === 'bn' ? 'রিপ্লাই দিন' : 'Reply'}
              </button>
            </div>
          )}
        </div>

        {replyingToId === c.id && (
          <form onSubmit={(e) => handleAddReply(e, c.id)} style={{ display: 'flex', gap: '6px', margin: '6px 0 6px 18px' }}>
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={lang === 'bn' ? 'রিপ্লাই লিখুন...' : 'Write a reply...'}
              style={{ flex: 1, padding: '6px 10px', fontSize: '13px', background: colors.inputBg, color: colors.text, border: `1px solid ${colors.inputBorder}`, borderRadius: '6px', textAlign: 'left' }}
              required
            />
            <button type="submit" disabled={postingReply} style={{ padding: '4px 10px', fontSize: '12px', background: '#0066cc', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}>
              {postingReply ? '...' : (lang === 'bn' ? 'পাঠান' : 'Reply')}
            </button>
            <button type="button" onClick={() => setReplyingToId(null)} style={{ padding: '4px 8px', fontSize: '12px', background: isDark ? '#444' : '#cbd5e1', color: colors.text, border: 'none', borderRadius: '6px' }}>
              ✕
            </button>
          </form>
        )}

        {replies.length > 0 && (
          <div style={{ marginTop: '6px' }}>
            {replies.map(r => renderCommentItem(r, true))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{
      border: `1px solid ${colors.cardBorder}`,
      background: colors.cardBg,
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '16px',
      textAlign: 'left',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      position: 'relative'
    }}>
      {isRepost && (
        <div style={{ fontSize: '12.5px', color: colors.textMuted, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '500' }}>
          <span>🔁</span> <span>{lang === 'bn' ? 'একটি পোস্ট শেয়ার করা হয়েছে' : 'Shared a post'}</span>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
          {post.profiles?.avatar_url ? (
            <img
              src={post.profiles.avatar_url}
              alt="avatar"
              onClick={() => onAvatarClick && onAvatarClick({ url: post.profiles.avatar_url, name: post.profiles.full_name || post.profiles.name, userId: post.author_id })}
              style={{
                width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover',
                cursor: 'pointer', border: '1.5px solid #0066cc', boxShadow: '0 2px 6px rgba(0,0,0,0.1)', flexShrink: 0
              }}
              title={lang === 'bn' ? 'বড় করে দেখতে ক্লিক করুন' : 'Click to zoom'}
            />
          ) : (
            <div
              onClick={() => onViewProfile && onViewProfile(post.author_id)}
              style={{
                width: '40px', height: '40px', borderRadius: '50%', background: isDark ? '#23252a' : '#e2e8f0',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
                color: '#0066cc', cursor: 'pointer', fontWeight: 'bold', border: `1px solid ${colors.cardBorder}`, flexShrink: 0
              }}
            >
              {(post.profiles?.full_name || post.profiles?.name) ? (post.profiles?.full_name || post.profiles?.name)[0].toUpperCase() : '?'}
            </div>
          )}

          <div style={{ textAlign: 'left', minWidth: 0, flex: 1 }}>
            <strong
              onClick={() => onViewProfile && onViewProfile(post.author_id)}
              style={{ cursor: 'pointer', color: '#0066cc', fontSize: '15px', display: 'block', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {post.profiles?.full_name || post.profiles?.name || translations[lang].unknownAuthor}
            </strong>
            
            <div style={{ fontSize: '11.5px', color: colors.textMuted, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px', marginTop: '2px', fontWeight: '500' }}>
              <span>{formatDateTime(post.created_at, lang)}</span>
              {!isRepost && (
                <>
                  <span style={{ opacity: 0.5 }}>•</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap' }}>
                    <span style={{ fontSize: '11px' }}>⏱</span> {calculateReadingTime(post.content, lang)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, marginLeft: '8px' }}>
          <span style={{
            fontSize: '11px',
            background: isDark ? '#212328' : '#e2e8f0',
            color: colors.text,
            padding: '3px 8px',
            borderRadius: '12px',
            border: `1px solid ${colors.cardBorder}`,
            fontWeight: '600',
            whiteSpace: 'nowrap'
          }}>
            {categoryLabel(post.category, lang)}
          </span>

          <div ref={postMenuRef} style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowPostMenu(!showPostMenu)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: colors.textMuted, padding: '4px 6px' }}
            >
              ⋮
            </button>

            {showPostMenu && (
              <div style={{
                position: 'absolute', right: 0, top: '26px', background: colors.cardBg,
                border: `1px solid ${colors.cardBorder}`, borderRadius: '10px', padding: '6px 0',
                boxShadow: '0 6px 20px rgba(0,0,0,0.15)', zIndex: 10, minWidth: '170px', textAlign: 'left'
              }}>
                <button
                  type="button"
                  onClick={handleBookmarkToggle}
                  style={{ display: 'block', width: '100%', background: 'none', border: 'none', color: isBookmarked ? '#ff9900' : colors.text, padding: '8px 14px', textAlign: 'left', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
                >
                  {isBookmarked ? '⭐ ' + (lang === 'bn' ? 'সেভ বাতিল' : 'Unsave') : '📑 ' + (lang === 'bn' ? 'সেভ করুন' : 'Save Post')}
                </button>

                <button
                  type="button"
                  onClick={() => { setShowRepostModal(true); setShowPostMenu(false) }}
                  style={{ display: 'block', width: '100%', background: 'none', border: 'none', color: colors.text, padding: '8px 14px', textAlign: 'left', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
                >
                  🔁 {lang === 'bn' ? 'ক্যাপশন সহ শেয়ার (Repost)' : 'Repost with Caption'}
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  style={{ display: 'block', width: '100%', background: 'none', border: 'none', color: colors.text, padding: '8px 14px', textAlign: 'left', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
                >
                  📤 {lang === 'bn' ? 'লিংক কপি / শেয়ার' : 'Copy Link / Share'}
                </button>

                {!isOwner && (
                  <button
                    type="button"
                    onClick={() => { setShowReportModal(true); setShowPostMenu(false) }}
                    style={{ display: 'block', width: '100%', background: 'none', border: 'none', color: '#ff4d4f', padding: '8px 14px', textAlign: 'left', cursor: 'pointer', fontSize: '13px', fontWeight: '500', borderTop: `1px solid ${colors.cardBorder}` }}
                  >
                    🚨 {lang === 'bn' ? 'রিপোর্ট করুন' : 'Report Post'}
                  </button>
                )}

                {isOwner && (
                  <>
                    <button
                      type="button"
                      onClick={() => { setEditing(true); setShowPostMenu(false) }}
                      style={{ display: 'block', width: '100%', background: 'none', border: 'none', color: '#0066cc', padding: '8px 14px', textAlign: 'left', cursor: 'pointer', fontSize: '13px', fontWeight: '500', borderTop: `1px solid ${colors.cardBorder}` }}
                    >
                      ✏️ {lang === 'bn' ? 'এডিট' : 'Edit'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowPostMenu(false); handleDelete() }}
                      style={{ display: 'block', width: '100%', background: 'none', border: 'none', color: '#ff4d4f', padding: '8px 14px', textAlign: 'left', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
                    >
                      🗑️ {lang === 'bn' ? 'ডিলিট' : 'Delete'}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {!isRepost && post.title && (
        <h3 style={{
          margin: '12px 0 8px',
          fontSize: '18px',
          fontWeight: '700',
          color: colors.text,
          textAlign: 'left',
          lineHeight: '1.4'
        }}>
          {post.title}
        </h3>
      )}

      {isRepost ? (
        <div>
          {repostCaptionText && (
            <p style={{
              margin: '6px 0 12px',
              fontSize: '15px',
              lineHeight: '1.65',
              color: colors.text,
              textAlign: 'left'
            }}>
              {repostCaptionText}
            </p>
          )}

          <div
            onClick={() => {
              if (originalPostId && onOpenOriginalPost) {
                onOpenOriginalPost(originalPostId)
              }
            }}
            style={{
              background: isDark ? '#121316' : '#f8fafc',
              border: `1px solid ${colors.cardBorder}`,
              borderRadius: '10px',
              padding: '12px 14px',
              marginTop: '8px',
              textAlign: 'left',
              cursor: originalPostId ? 'pointer' : 'default',
              transition: 'background 0.15s ease'
            }}
            title={originalPostId ? (lang === 'bn' ? 'মূল পোস্টে যেতে ক্লিক করুন' : 'Click to view original post') : ''}
          >
            <div style={{ fontSize: '12.5px', color: '#0066cc', fontWeight: 'bold', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>@{originalAuthorName}</span>
              {originalPostId && <span style={{ fontSize: '11px', color: colors.textMuted }}>{lang === 'bn' ? 'মূল পোস্ট দেখুন ↗' : 'View original ↗'}</span>}
            </div>
            <p style={{
              margin: 0,
              whiteSpace: 'pre-wrap',
              fontSize: '14.5px',
              lineHeight: '1.6',
              color: colors.text
            }}>
              {originalPostContent}
            </p>
          </div>
        </div>
      ) : (
        <div>
          <p style={{
            margin: '8px 0 4px',
            whiteSpace: 'pre-wrap',
            fontSize: '15px',
            lineHeight: '1.7',
            color: colors.text,
            textAlign: 'left',
            letterSpacing: '0.1px'
          }}>
            {!isExpanded && post.content && post.content.length > 300 
              ? post.content.slice(0, 300) + '...' 
              : post.content}
          </p>

          {post.content && post.content.length > 300 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              style={{
                background: 'none',
                border: 'none',
                color: '#0066cc',
                cursor: 'pointer',
                fontSize: '13.5px',
                fontWeight: 'bold',
                padding: '4px 0 10px',
                display: 'block',
                textAlign: 'left'
              }}
            >
              {isExpanded 
                ? (lang === 'bn' ? 'কম দেখুন (See less)' : 'See less') 
                : (lang === 'bn' ? '... আরও দেখুন (See more)' : '... See more')}
            </button>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginTop: '14px', alignItems: 'center', position: 'relative' }}>
        {showReactionPicker && (
          <div
            onMouseLeave={() => setShowReactionPicker(false)}
            style={{
              position: 'absolute',
              bottom: '42px',
              left: 0,
              background: colors.cardBg,
              border: `1.5px solid ${colors.cardBorder}`,
              boxShadow: '0 8px 25px rgba(0,0,0,0.25)',
              borderRadius: '24px',
              padding: '6px 10px',
              display: 'flex',
              gap: '10px',
              zIndex: 30,
              alignItems: 'center'
            }}
          >
            <button
              onClick={() => handleReaction('love')}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '22px',
                cursor: 'pointer',
                padding: '4px 6px',
                transform: myReaction === 'love' ? 'scale(1.25)' : 'scale(1)',
                transition: 'transform 0.15s'
              }}
              title="Love ❤️"
            >
              ❤️
            </button>
            <button
              onClick={() => handleReaction('insightful')}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '22px',
                cursor: 'pointer',
                padding: '4px 6px',
                transform: myReaction === 'insightful' ? 'scale(1.25)' : 'scale(1)',
                transition: 'transform 0.15s'
              }}
              title="Insightful 💡"
            >
              💡
            </button>
          </div>
        )}

        <button
          onClick={handleLoveButtonClick}
          onMouseDown={startPressTimer}
          onMouseUp={clearPressTimer}
          onTouchStart={startPressTimer}
          onTouchEnd={clearPressTimer}
          onContextMenu={(e) => { e.preventDefault(); setShowReactionPicker(true) }}
          disabled={loadingLike}
          className={popEffect ? 'reaction-pop' : ''}
          style={{
            border: myReaction === 'love'
              ? '1.5px solid #dc2626'
              : myReaction === 'insightful'
              ? '1.5px solid #b45309'
              : `1px solid ${colors.cardBorder}`,
            borderRadius: '18px',
            padding: '6px 12px',
            background: myReaction === 'love'
              ? (isDark ? '#450a0a' : '#fee2e2')
              : myReaction === 'insightful'
              ? (isDark ? '#451a03' : '#fef3c7')
              : (isDark ? '#222327' : '#f1f5f9'),
            color: myReaction === 'love'
              ? (isDark ? '#f87171' : '#991b1b')
              : myReaction === 'insightful'
              ? (isDark ? '#fbbf24' : '#b45309')
              : colors.text,
            cursor: 'pointer',
            fontSize: '13.5px',
            fontWeight: myReaction ? '600' : 'normal',
            boxShadow: myReaction === 'love' 
              ? '0 2px 8px rgba(220, 38, 38, 0.25)' 
              : (myReaction === 'insightful' ? '0 2px 8px rgba(180, 83, 9, 0.25)' : 'none'),
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            minHeight: '36px',
            transition: 'all 0.15s ease'
          }}
          title={lang === 'bn' ? 'ক্লিক করুন বা চেপে ধরে 💡 বেছে নিন' : 'Click or hold to choose reaction'}
        >
          {renderReactionIcons()}
          <span>{loveCount + insightfulCount}</span>
        </button>

        <button
          onClick={() => handleReaction('unlike')}
          disabled={loadingLike}
          style={{
            border: `1px solid ${colors.cardBorder}`,
            borderRadius: '16px',
            padding: '6px 12px',
            background: myReaction === 'unlike' ? '#475569' : (isDark ? '#222' : '#f1f5f9'),
            color: myReaction === 'unlike' ? '#fff' : colors.text,
            cursor: 'pointer',
            fontSize: '13.5px',
            minHeight: '36px'
          }}
        >
          👎 {unlikeCount}
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          style={{
            border: `1px solid ${colors.cardBorder}`,
            borderRadius: '16px',
            padding: '6px 12px',
            background: isDark ? '#222' : '#f1f5f9',
            color: colors.text,
            cursor: 'pointer',
            fontSize: '13.5px',
            minHeight: '36px'
          }}
        >
          💬 {comments.length}
        </button>

        <span
          style={{
            fontSize: '12.5px',
            color: colors.textMuted,
            marginLeft: 'auto',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            fontWeight: '600'
          }}
          title={lang === 'bn' ? `মোট ভিউ: ${viewCount}` : `Total views: ${viewCount}`}
        >
          <span style={{ fontSize: '13px', color: '#0066cc', lineHeight: 1 }}>◉</span>
          <span>{formatNumber(viewCount)}</span>
        </span>
      </div>

      {showComments && (
        <div style={{ marginTop: '16px', borderTop: `1px solid ${colors.cardBorder}`, paddingTop: '12px', textAlign: 'left' }}>
          {rootComments.length === 0 ? (
            <p style={{ fontSize: '13px', color: colors.textMuted }}>{lang === 'bn' ? 'কোনো মন্তব্য নেই।' : 'No comments yet.'}</p>
          ) : (
            rootComments.map(c => renderCommentItem(c, false))
          )}

          <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={translations[lang].commentPlaceholder}
              style={{ flex: 1, padding: '8px 12px', fontSize: '14px', background: colors.inputBg, border: `1px solid ${colors.inputBorder}`, borderRadius: '8px', color: colors.text, textAlign: 'left', minHeight: '40px' }}
            />
            <button type="submit" disabled={postingComment} style={{ padding: '8px 16px', background: '#0066cc', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', minHeight: '40px' }}>
              {translations[lang].sendComment}
            </button>
          </form>
        </div>
      )}

      {showRepostModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '15px'
        }}>
          <div style={{
            background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: '14px',
            maxWidth: '440px', width: '100%', padding: '20px', boxShadow: '0 8px 30px rgba(0,0,0,0.4)', textAlign: 'left'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <strong style={{ color: colors.text, fontSize: '17px' }}>
                🔁 {lang === 'bn' ? 'ক্যাপশন সহ শেয়ার করুন' : 'Repost with Caption'}
              </strong>
              <button onClick={() => setShowRepostModal(false)} style={{ background: 'none', border: 'none', color: colors.textMuted, fontSize: '18px', cursor: 'pointer', padding: '4px' }}>✕</button>
            </div>

            <form onSubmit={handleRepostSubmit}>
              <textarea
                value={repostCaption}
                onChange={(e) => setRepostCaption(e.target.value)}
                placeholder={lang === 'bn' ? 'এই পোস্ট সম্পর্কে আপনার ভাবনা লিখুন (ঐচ্ছিক)...' : 'Write your thoughts about this post...'}
                rows={3}
                style={{ width: '100%', padding: '10px', background: colors.inputBg, color: colors.text, border: `1px solid ${colors.inputBorder}`, borderRadius: '8px', boxSizing: 'border-box', marginBottom: '14px', fontSize: '14px', fontFamily: 'inherit', textAlign: 'left' }}
              />

              <div style={{ background: isDark ? '#121316' : '#f1f5f9', padding: '10px', borderRadius: '8px', border: `1px solid ${colors.cardBorder}`, marginBottom: '16px', fontSize: '13px', color: colors.textMuted, maxHeight: '90px', overflow: 'hidden' }}>
                <strong style={{ color: colors.text }}>@{post.profiles?.full_name || post.profiles?.name || 'User'}:</strong> {post.content}
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowRepostModal(false)}
                  style={{ padding: '8px 16px', background: 'none', border: `1px solid ${colors.cardBorder}`, color: colors.text, borderRadius: '8px', cursor: 'pointer', fontSize: '13.5px', minHeight: '38px' }}
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={reposting}
                  style={{ padding: '8px 20px', background: '#0066cc', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13.5px', minHeight: '38px' }}
                >
                  {reposting ? '...' : (lang === 'bn' ? 'টাইমলাইনে শেয়ার করুন' : 'Share to Timeline')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showReportModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '15px'
        }}>
          <div style={{
            background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: '12px',
            maxWidth: '400px', width: '100%', padding: '18px', boxShadow: '0 6px 25px rgba(0,0,0,0.4)', textAlign: 'left'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <strong style={{ color: '#ff4d4f', fontSize: '16px' }}>
                🚨 {lang === 'bn' ? 'পোস্ট রিপোর্ট করুন' : 'Report Post'}
              </strong>
              <button onClick={() => setShowReportModal(false)} style={{ background: 'none', border: 'none', color: colors.textMuted, fontSize: '16px', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSubmitReport}>
              <p style={{ fontSize: '13px', color: colors.textMuted, margin: '0 0 10px' }}>
                {lang === 'bn' ? 'এই পোস্টে কী সমস্যা হচ্ছে তা জানান:' : 'Please select the problem with this post:'}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                <label style={{ fontSize: '13.5px', color: colors.text, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '500' }}>
                  <input type="radio" name="reason" value="spam" checked={reportReason === 'spam'} onChange={() => setReportReason('spam')} />
                  {lang === 'bn' ? '🚫 স্প্যাম বা প্রতারণামূলক' : 'Spam or Scam'}
                </label>
                <label style={{ fontSize: '13.5px', color: colors.text, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '500' }}>
                  <input type="radio" name="reason" value="hate" checked={reportReason === 'hate'} onChange={() => setReportReason('hate')} />
                  {lang === 'bn' ? '⚠️ ঘৃণা বা আক্রমণাত্মক বক্তব্য' : 'Hate speech or harassment'}
                </label>
                <label style={{ fontSize: '13.5px', color: colors.text, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '500' }}>
                  <input type="radio" name="reason" value="inappropriate" checked={reportReason === 'inappropriate'} onChange={() => setReportReason('inappropriate')} />
                  {lang === 'bn' ? '🔞 অশ্লীল বা অনুপযুক্ত কনটেন্ট' : 'Inappropriate content'}
                </label>
                <label style={{ fontSize: '13.5px', color: colors.text, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '500' }}>
                  <input type="radio" name="reason" value="misleading" checked={reportReason === 'misleading'} onChange={() => setReportReason('misleading')} />
                  {lang === 'bn' ? '❌ ভুল তথ্য বা বিভ্রান্তিকর' : 'Misinformation'}
                </label>
                <label style={{ fontSize: '13.5px', color: colors.text, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '500' }}>
                  <input type="radio" name="reason" value="other" checked={reportReason === 'other'} onChange={() => setReportReason('other')} />
                  {lang === 'bn' ? '💬 অন্যান্য কারণ' : 'Other'}
                </label>
              </div>

              {reportReason === 'other' && (
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder={lang === 'bn' ? 'কারণ বিস্তারিত লিখুন...' : 'Describe the reason...'}
                  rows={2}
                  required
                  style={{ width: '100%', padding: '8px', background: colors.inputBg, color: colors.text, border: `1px solid ${colors.inputBorder}`, borderRadius: '6px', boxSizing: 'border-box', marginBottom: '14px', fontSize: '13px', fontFamily: 'inherit', textAlign: 'left' }}
                />
              )}

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  style={{ padding: '6px 14px', background: 'none', border: `1px solid ${colors.cardBorder}`, color: colors.text, borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submittingReport}
                  style={{ padding: '6px 16px', background: '#ff4d4f', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}
                >
                  {submittingReport ? '...' : (lang === 'bn' ? 'রিপোর্ট পাঠান' : 'Submit Report')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function FeedbackModal({ session, lang, colors, showToast, onClose }) {
  const [type, setType] = useState('bug')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!message.trim()) return

    setSubmitting(true)
    const { error } = await supabase.from('feedbacks').insert({
      user_id: session?.user?.id || null,
      type,
      message
    })

    setSubmitting(false)
    if (!error) {
      showToast(lang === 'bn' ? '✅ আপনার মূল্যবান ফিডব্যাক জমা হয়েছে! ধন্যবাদ।' : '✅ Feedback submitted successfully! Thank you.', 'success')
      onClose()
    } else {
      showToast('Error: ' + error.message, 'error')
    }
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '15px'
    }}>
      <div style={{
        background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: '12px',
        maxWidth: '440px', width: '100%', padding: '20px', boxShadow: '0 6px 30px rgba(0,0,0,0.4)', textAlign: 'left'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ margin: 0, fontSize: '17px', color: colors.text }}>
            💡 {lang === 'bn' ? 'মতামত বা বাগ রিপোর্ট করুন' : 'Feedback & Bug Report'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: colors.textMuted, fontSize: '18px', cursor: 'pointer' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: colors.textMuted }}>
              {lang === 'bn' ? 'বিষয় বা ধরন:' : 'Type:'}
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              style={{ width: '100%', padding: '8px', background: colors.inputBg, color: colors.text, border: `1px solid ${colors.inputBorder}`, borderRadius: '6px', boxSizing: 'border-box' }}
            >
              <option value="bug">🐛 {lang === 'bn' ? 'বাগ বা সমস্যা' : 'Bug / Issue'}</option>
              <option value="feature">✨ {lang === 'bn' ? 'নতুন আইডিয়া' : 'Feature Request'}</option>
              <option value="general">💬 {lang === 'bn' ? 'সাধারণ মতামত' : 'General Feedback'}</option>
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: colors.textMuted }}>
              {lang === 'bn' ? 'বিস্তারিত লিখুন:' : 'Details:'}
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={lang === 'bn' ? 'কোথায় সমস্যা হচ্ছে বা পরামর্শ লিখুন...' : 'Describe your suggestion or issue...'}
              rows={4}
              required
              style={{ width: '100%', padding: '8px', background: colors.inputBg, color: colors.text, border: `1px solid ${colors.inputBorder}`, borderRadius: '6px', boxSizing: 'border-box', fontFamily: 'inherit', textAlign: 'left' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '7px 14px', background: 'none', border: `1px solid ${colors.cardBorder}`, color: colors.text, borderRadius: '6px', cursor: 'pointer' }}>
              {lang === 'bn' ? 'বাতিল' : 'Cancel'}
            </button>
            <button type="submit" disabled={submitting} style={{ padding: '7px 18px', background: '#0066cc', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
              {submitting ? '...' : (lang === 'bn' ? 'পাঠান' : 'Submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AdminDashboardModal({ lang, colors, showToast, onClose, onRefreshFeed, onOpenOriginalPost }) {
  const [tab, setTab] = useState('reports')
  const [feedbacks, setFeedbacks] = useState([])
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData(true)
    
    const interval = setInterval(() => {
      loadData(false)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const loadData = async (showLoading = false) => {
    if (showLoading) setLoading(true)

    const { data: fbData } = await supabase
      .from('feedbacks')
      .select('*, profiles:user_id(name, full_name, avatar_url)')
      .order('created_at', { ascending: false })

    const { data: repData } = await supabase
      .from('reports')
      .select('*, posts(*, profiles(name, full_name, avatar_url)), profiles:reporter_id(name, full_name)')
      .order('created_at', { ascending: false })

    setFeedbacks(fbData || [])
    setReports(repData || [])
    if (showLoading) setLoading(false)
  }

  const handleToggleFeedback = async (item) => {
    const nextStatus = item.status === 'resolved' ? 'pending' : 'resolved'
    await supabase.from('feedbacks').update({ status: nextStatus }).eq('id', item.id)
    loadData(false)
  }

  const handleDeleteFeedback = async (id) => {
    if (!window.confirm('Delete this feedback?')) return
    await supabase.from('feedbacks').delete().eq('id', id)
    loadData(false)
  }

  const handleDeleteReportedPost = async (postId, reportId) => {
    if (!window.confirm(lang === 'bn' ? 'তুমি কি নিশ্চিত এই আপত্তিকর পোস্টটি সম্পূর্ণ মুছে ফেলতে চাও?' : 'Delete this post?')) return

    await supabase.from('posts').delete().eq('id', postId)
    await supabase.from('reports').delete().eq('id', reportId)
    showToast(lang === 'bn' ? '🗑️ পোস্টটি মুছে ফেলা হয়েছে!' : '🗑️ Post deleted successfully!', 'info')
    loadData(false)
    onRefreshFeed()
  }

  const handleDismissReport = async (reportId) => {
    await supabase.from('reports').update({ status: 'dismissed' }).eq('id', reportId)
    loadData(false)
  }

  const handleDeleteReport = async (reportId) => {
    await supabase.from('reports').delete().eq('id', reportId)
    loadData(false)
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '15px'
    }}>
      <div style={{
        background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: '12px',
        maxWidth: '580px', width: '100%', maxHeight: '85vh', overflowY: 'auto', padding: '18px',
        boxShadow: '0 6px 25px rgba(0,0,0,0.5)', textAlign: 'left'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: `1px solid ${colors.cardBorder}`, paddingBottom: '8px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', color: colors.text }}>
            🛠️ {lang === 'bn' ? 'অ্যাডমিন ড্যাশবোর্ড' : 'Admin Dashboard'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: colors.textMuted, fontSize: '18px', cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
          <button
            onClick={() => setTab('reports')}
            style={{
              flex: 1, padding: '8px', borderRadius: '6px', border: 'none',
              background: tab === 'reports' ? '#ff4d4f' : '#374151',
              color: '#fff',
              fontWeight: 'bold', cursor: 'pointer', fontSize: '13px'
            }}
          >
            🚨 {lang === 'bn' ? 'রিপোর্টকৃত পোস্ট' : 'Reported Posts'} ({reports.filter(r => r.status === 'pending').length})
          </button>
          <button
            onClick={() => setTab('feedbacks')}
            style={{
              flex: 1, padding: '8px', borderRadius: '6px', border: 'none',
              background: tab === 'feedbacks' ? '#0066cc' : '#374151',
              color: '#fff',
              fontWeight: 'bold', cursor: 'pointer', fontSize: '13px'
            }}
          >
            💬 {lang === 'bn' ? 'ইউজার ফিডব্যাক' : 'User Feedbacks'} ({feedbacks.length})
          </button>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: colors.textMuted }}>Loading...</p>
        ) : tab === 'reports' ? (
          reports.length === 0 ? (
            <p style={{ textAlign: 'center', color: colors.textMuted, margin: '30px 0' }}>কোনো পোস্টের বিরুদ্ধে রিপোর্ট নেই।</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {reports.map(r => (
                <div key={r.id} style={{
                  background: colors.inputBg, border: `1px solid ${colors.cardBorder}`,
                  borderRadius: '8px', padding: '12px', opacity: r.status === 'dismissed' ? 0.6 : 1, textAlign: 'left'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px' }}>
                    <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>⚠️ কারণ: {r.reason}</span>
                    <span style={{ color: colors.textMuted }}>{formatDateTime(r.created_at, lang)}</span>
                  </div>

                  {r.posts ? (
                    <div 
                      onClick={() => {
                        if (r.posts.id && onOpenOriginalPost) {
                          onOpenOriginalPost(r.posts.id)
                        }
                      }}
                      style={{ 
                        background: colors.cardBg, 
                        padding: '8px 10px', 
                        borderRadius: '6px', 
                        border: `1px solid ${colors.cardBorder}`, 
                        margin: '6px 0', 
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease'
                      }}
                      title={lang === 'bn' ? 'পোস্টে যেতে ক্লিক করুন' : 'Click to view post'}
                    >
                      <div style={{ fontSize: '12px', color: '#0066cc', fontWeight: 'bold', marginBottom: '3px' }}>
                        লেখক: @{r.posts.profiles?.full_name || r.posts.profiles?.name || 'Unknown'}
                        <span style={{ float: 'right', fontSize: '11px', color: colors.textMuted }}>{lang === 'bn' ? 'পোস্ট দেখুন ↗' : 'View post ↗'}</span>
                      </div>
                      {r.posts.title && <div style={{ fontSize: '13px', fontWeight: 'bold', color: colors.text }}>{r.posts.title}</div>}
                      <div style={{ fontSize: '13px', color: colors.text, marginTop: '2px', whiteSpace: 'pre-wrap' }}>
                        {r.posts.content}
                      </div>
                    </div>
                  ) : (
                    <p style={{ fontSize: '12px', color: colors.textMuted, fontStyle: 'italic', margin: '4px 0' }}>
                      [পোস্টটি ইতোমধ্যে মুছে ফেলা হয়েছে]
                    </p>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                    {r.posts && (
                      <button
                        onClick={() => handleDeleteReportedPost(r.posts.id, r.id)}
                        style={{ padding: '4px 10px', fontSize: '11px', background: '#ff4d4f', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        🗑️ পোস্ট ডিলিট
                      </button>
                    )}
                    {r.status === 'pending' && (
                      <button
                        onClick={() => handleDismissReport(r.id)}
                        style={{ padding: '4px 10px', fontSize: '11px', background: '#6b7280', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        ✓ খারিজ (Dismiss)
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteReport(r.id)}
                      style={{ padding: '4px 8px', fontSize: '11px', background: 'none', border: `1px solid ${colors.cardBorder}`, color: colors.textMuted, borderRadius: '4px', cursor: 'pointer' }}
                    >
                      ✕ মুছুন
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          feedbacks.length === 0 ? (
            <p style={{ textAlign: 'center', color: colors.textMuted, margin: '30px 0' }}>কোনো ফিডব্যাক নেই।</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {feedbacks.map(f => (
                <div key={f.id} style={{
                  background: colors.inputBg, border: `1px solid ${colors.cardBorder}`,
                  borderRadius: '8px', padding: '12px', opacity: f.status === 'resolved' ? 0.65 : 1, textAlign: 'left'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', background: f.type === 'bug' ? '#ff4d4f' : '#0066cc', color: '#fff' }}>
                      {f.type}
                    </span>
                    <span style={{ fontSize: '11px', color: colors.textMuted }}>{formatDateTime(f.created_at, lang)}</span>
                  </div>
                  <p style={{ margin: '6px 0', fontSize: '13.5px', color: colors.text }}>{f.message}</p>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button onClick={() => handleToggleFeedback(f)} style={{ padding: '3px 8px', fontSize: '11px', background: f.status === 'resolved' ? '#faad14' : '#52c41a', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                      {f.status === 'resolved' ? 'Pending' : '✓ Resolve'}
                    </button>
                    <button onClick={() => handleDeleteFeedback(f.id)} style={{ padding: '3px 8px', fontSize: '11px', background: '#ff4d4f', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}

export default App