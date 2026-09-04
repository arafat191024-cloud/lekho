import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

const makeEmojiAvatar = (emoji, bgColor) => {
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="${encodeURIComponent(bgColor)}"/><text y="58%" x="50%" dominant-baseline="middle" text-anchor="middle" font-size="50">${emoji}</text></svg>`
}

const CATEGORIES = [
  { id: 'all', bn: 'সবগুলো', en: 'All' },
  { id: 'fruit', bn: '🍎 ফলমূল', en: '🍎 Fruits' },
  { id: 'animal', bn: '🦁 প্রাণী', en: '🦁 Animals' },
  { id: 'flower', bn: '🌸 ফুল ও প্রকৃতি', en: '🌸 Flowers' },
  { id: 'vehicle', bn: '🚗 গাড়ি ও যান', en: '🚗 Vehicles' },
  { id: 'object', bn: '💎 প্রতীক ও গেজেট', en: '💎 Objects' }
]

const AVATAR_LIST = [
  { cat: 'fruit', emoji: '🍎', name: 'Apple', bg: '#fee2e2', tags: 'apple fol apil red লাল আপেল ফল' },
  { cat: 'fruit', emoji: '🥭', name: 'Mango', bg: '#fef3c7', tags: 'mango aam am mango yellow আম ফল' },
  { cat: 'fruit', emoji: '🍓', name: 'Strawberry', bg: '#ffe4e6', tags: 'strawberry berry ফল লাল স্ট্রবেরি' },
  { cat: 'fruit', emoji: '🍉', name: 'Watermelon', bg: '#dcfce7', tags: 'watermelon tormuz তরমুজ ফল' },
  { cat: 'fruit', emoji: '🍇', name: 'Grapes', bg: '#f3e8ff', tags: 'grapes angur আঙুর ফল' },
  { cat: 'fruit', emoji: '🍍', name: 'Pineapple', bg: '#fef9c3', tags: 'pineapple anaros আনারস ফল' },
  { cat: 'fruit', emoji: '🍒', name: 'Cherry', bg: '#ffe4e6', tags: 'cherry চেরি ফল লাল' },
  { cat: 'fruit', emoji: '🥑', name: 'Avocado', bg: '#dcfce7', tags: 'avocado অ্যাভোকাডো ফল' },
  { cat: 'fruit', emoji: '🍕', name: 'Pizza', bg: '#ffedd5', tags: 'pizza খাবার পিজ্জা food' },
  { cat: 'fruit', emoji: '🍔', name: 'Burger', bg: '#fef3c7', tags: 'burger খাবার বার্গার food' },
  { cat: 'fruit', emoji: '☕', name: 'Coffee', bg: '#ede9fe', tags: 'coffee চা কফি tea drink' },
  { cat: 'fruit', emoji: '🍦', name: 'Ice cream', bg: '#fce7f3', tags: 'icecream আইসক্রিম মিষ্টি sweet' },
  { cat: 'animal', emoji: '🦁', name: 'Lion', bg: '#fef3c7', tags: 'lion singho সিংহ পশু প্রাণী animal king' },
  { cat: 'animal', emoji: '🐯', name: 'Tiger', bg: '#ffedd5', tags: 'tiger bagh বাঘ প্রাণী animal royal' },
  { cat: 'animal', emoji: '🐼', name: 'Panda', bg: '#e2e8f0', tags: 'panda পান্ডা প্রাণী animal cute' },
  { cat: 'animal', emoji: '🦊', name: 'Fox', bg: '#ffedd5', tags: 'fox shial শিয়াল প্রাণী animal' },
  { cat: 'animal', emoji: '🐺', name: 'Wolf', bg: '#cbd5e1', tags: 'wolf nekde নেকড়ে animal hunter' },
  { cat: 'animal', emoji: '🐶', name: 'Dog', bg: '#fef3c7', tags: 'dog কুকুর puppy pet animal পোষা' },
  { cat: 'animal', emoji: '🐱', name: 'Cat', bg: '#ffedd5', tags: 'cat বিড়াল kitten pet animal বিড়াল' },
  { cat: 'animal', emoji: '🐰', name: 'Rabbit', bg: '#fce7f3', tags: 'rabbit khorgosh খরগোশ pet animal' },
  { cat: 'animal', emoji: '🦅', name: 'Eagle', bg: '#e2e8f0', tags: 'eagle pakhi ঈগল পাখি bird শিকারি' },
  { cat: 'animal', emoji: '🐬', name: 'Dolphin', bg: '#e0f2fe', tags: 'dolphin ডলফিন মাছ fish sea নদী সাগর' },
  { cat: 'animal', emoji: '🦄', name: 'Unicorn', bg: '#fae8ff', tags: 'unicorn ইউনিকর্ন magic ঘোড়া' },
  { cat: 'animal', emoji: '🦉', name: 'Owl', bg: '#f1f5f9', tags: 'owl pecha পেঁচা bird পাখি রাত' },
  { cat: 'flower', emoji: '🌸', name: 'Cherry Blossom', bg: '#ffe4e6', tags: 'flower cherry blossom ফুল pink গোলাপি' },
  { cat: 'flower', emoji: '🌺', name: 'Hibiscus', bg: '#fce7f3', tags: 'flower joba জবা ফুল red' },
  { cat: 'flower', emoji: '🌻', name: 'Sunflower', bg: '#fef9c3', tags: 'sunflower shurjomukhi সূর্যমুখী ফুল yellow' },
  { cat: 'flower', emoji: '🌹', name: 'Rose', bg: '#fee2e2', tags: 'rose golap গোলাপ ফুল red লাল' },
  { cat: 'flower', emoji: '🌷', name: 'Tulip', bg: '#ffe4e6', tags: 'tulip টিউলিপ ফুল বাগান' },
  { cat: 'flower', emoji: '🌼', name: 'Daisy', bg: '#fef3c7', tags: 'daisy ফুল সাদা ডেইজি' },
  { cat: 'flower', emoji: '🍀', name: 'Clover', bg: '#dcfce7', tags: 'leaf clover পাতা luck green সবুজ' },
  { cat: 'flower', emoji: '🍁', name: 'Maple Leaf', bg: '#ffedd5', tags: 'maple leaf পাতা লাল লালচে' },
  { cat: 'flower', emoji: '🌙', name: 'Moon', bg: '#1e293b', tags: 'moon chand চাঁদ রাত night আকাশ' },
  { cat: 'flower', emoji: '☀️', name: 'Sun', bg: '#fef08a', tags: 'sun shurjo সূর্য দিন day আলো' },
  { cat: 'flower', emoji: '🌈', name: 'Rainbow', bg: '#e0f2fe', tags: 'rainbow rongdhonu রংধনু আকাশ মেঘ' },
  { cat: 'flower', emoji: '🔥', name: 'Fire', bg: '#ffedd5', tags: 'fire agun আগুন flame hot শিখা' },
  { cat: 'vehicle', emoji: '🏎️', name: 'Race Car', bg: '#fee2e2', tags: 'race car sports car গাড়ি রেস স্পোর্টস রেসিং' },
  { cat: 'vehicle', emoji: '🚗', name: 'Car', bg: '#ffedd5', tags: 'car red car গাড়ি red লাল গাড়ি' },
  { cat: 'vehicle', emoji: '🚀', name: 'Rocket', bg: '#ede9fe', tags: 'rocket رকেট space মহাকাশ দ্রুত' },
  { cat: 'vehicle', emoji: '✈️', name: 'Airplane', bg: '#e0f2fe', tags: 'plane airplane বিমান উড়োজাহাজ আকাশ fly' },
  { cat: 'vehicle', emoji: '🚁', name: 'Helicopter', bg: '#fef3c7', tags: 'helicopter হেলিকপ্টার উড়া' },
  { cat: 'vehicle', emoji: '🏍️', name: 'Motorcycle', bg: '#f1f5f9', tags: 'bike motorcycle বাইক মোটরসাইকেল বাইকার' },
  { cat: 'vehicle', emoji: '⛵', name: 'Sailboat', bg: '#e0f2fe', tags: 'boat ship নৌকা জাহাজ নদী সাগর পালতোলা' },
  { cat: 'vehicle', emoji: '🚂', name: 'Train', bg: '#e2e8f0', tags: 'train rail ট্রেন রেল গাড়ি রেলপথ' },
  { cat: 'vehicle', emoji: '🛸', name: 'UFO', bg: '#312e81', tags: 'ufo ইউএফও alien space মহাকাশযান' },
  { cat: 'object', emoji: '👑', name: 'Crown', bg: '#fef08a', tags: 'crown mukut মুকুট king রাজা queen রানি' },
  { cat: 'object', emoji: '💎', name: 'Diamond', bg: '#e0f2fe', tags: 'diamond hira হীরা gem precious রত্ন' },
  { cat: 'object', emoji: '⚡', name: 'Lightning', bg: '#fef9c3', tags: 'lightning bijli বিদ্যুৎ power shock কারেন্ট' },
  { cat: 'object', emoji: '🎮', name: 'Gamepad', bg: '#ede9fe', tags: 'game gamepad গেমিং খেলা play কনসোল' },
  { cat: 'object', emoji: '⚽', name: 'Football', bg: '#f1f5f9', tags: 'football soccer বল ফুটবল খেলা sport' },
  { cat: 'object', emoji: '🎸', name: 'Guitar', bg: '#fed7aa', tags: 'guitar গিটার গান music সুর' },
  { cat: 'object', emoji: '🪐', name: 'Planet', bg: '#f3e8ff', tags: 'planet shoni শনি গ্রহ space মহাবিশ্ব' },
  { cat: 'object', emoji: '🏆', name: 'Trophy', bg: '#fef08a', tags: 'trophy ট্রফি পুরস্কার win জয়' },
  { cat: 'object', emoji: '🛡️', name: 'Shield', bg: '#e2e8f0', tags: 'shield dhal ঢাল armor সুরক্ষা' },
  { cat: 'object', emoji: '🔮', name: 'Crystal Ball', bg: '#fae8ff', tags: 'magic crystal ball জাদু ম্যাজিক' }
]

export default function ProfilePage({ session, lang, theme, targetUserId, PostCard, onViewProfile, onAvatarClick }) {
  const isDark = theme === 'dark'
  const colors = {
    cardBg: isDark ? '#191a1d' : '#ffffff',
    cardBorder: isDark ? '#2e3035' : '#e5e7eb',
    text: isDark ? '#f3f4f6' : '#111827',
    textMuted: isDark ? '#9ca3af' : '#6b7280',
    inputBg: isDark ? '#111215' : '#f3f4f6',
    inputBorder: isDark ? '#373a40' : '#d1d5db',
  }

  const currentUserId = session?.user?.id
  const profileId = targetUserId || currentUserId
  const isOwner = currentUserId === profileId

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userPosts, setUserPosts] = useState([])

  const [isEditing, setIsEditing] = useState(false)
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [saving, setSaving] = useState(false)

  const [showAvatarMenu, setShowAvatarMenu] = useState(false)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [avatarSearch, setAvatarSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [isFollowing, setIsFollowing] = useState(false)

  useEffect(() => {
    if (profileId) {
      loadProfile()
      loadUserPosts()
      loadFollowData()
    }
  }, [profileId, currentUserId])

  const loadProfile = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single()

    if (data) {
      setProfile(data)
      setFullName(data.full_name || data.name || '')
      setUsername(data.name || '')
      setBio(data.bio || '')
    }
    setLoading(false)
  }

  const loadUserPosts = async () => {
    const { data } = await supabase
      .from('posts')
      .select('*, profiles(name, full_name, avatar_url)')
      .eq('author_id', profileId)
      .order('created_at', { ascending: false })

    setUserPosts(data || [])
  }

  const loadFollowData = async () => {
    // ফলোয়ার্স কাউন্ট
    const { count: followers } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', profileId)

    // ফলোয়িং কাউন্ট
    const { count: following } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', profileId)

    setFollowersCount(followers || 0)
    setFollowingCount(following || 0)

    // চেক করা বর্তমান ইউজার এই প্রোফাইলকে ফলো করে কি না
    if (currentUserId && profileId && currentUserId !== profileId) {
      const { data } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', currentUserId)
        .eq('following_id', profileId)
        .maybeSingle()

      setIsFollowing(!!data)
    } else {
      setIsFollowing(false)
    }
  }

  const handleFollowToggle = async () => {
    if (!currentUserId || isOwner) return

    if (isFollowing) {
      // আনফলো লজিক
      setIsFollowing(false)
      setFollowersCount(c => Math.max(0, c - 1))

      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', currentUserId)
        .eq('following_id', profileId)
    } else {
      // ফলো লজিক
      setIsFollowing(true)
      setFollowersCount(c => c + 1)

      await supabase
        .from('follows')
        .insert({ follower_id: currentUserId, following_id: profileId })

      await supabase.from('notifications').insert({
        user_id: profileId,
        actor_id: currentUserId,
        type: 'follow'
      })
    }
    // সার্ভার থেকে সঠিক ডাটা রি-সিঙ্ক করার জন্য
    loadFollowData()
  }

  const handleUpdateAvatar = async (newUrl) => {
    setShowAvatarPicker(false)
    setShowAvatarMenu(false)

    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: newUrl })
      .eq('id', profileId)

    if (!error) {
      setProfile(prev => ({ ...prev, avatar_url: newUrl }))
    } else {
      alert('Error: ' + error.message)
    }
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        name: username,
        bio: bio
      })
      .eq('id', profileId)

    setSaving(false)

    if (error) {
      alert('Error: ' + error.message)
    } else {
      setProfile(prev => ({
        ...prev,
        full_name: fullName,
        name: username,
        bio: bio
      }))
      setIsEditing(false)
    }
  }

  const filteredAvatars = AVATAR_LIST.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.cat === selectedCategory
    if (!avatarSearch.trim()) return matchesCategory

    const query = avatarSearch.trim().toLowerCase()
    const matchesQuery = item.name.toLowerCase().includes(query) ||
                         item.tags.toLowerCase().includes(query) ||
                         item.emoji.includes(query)

    return matchesCategory && matchesQuery
  })

  if (loading) return <p style={{ textAlign: 'center', color: colors.textMuted, marginTop: '30px' }}>Loading profile...</p>
  if (!profile) return <p style={{ textAlign: 'center', color: colors.textMuted, marginTop: '30px' }}>Profile not found.</p>

  const joinedDate = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
      })
    : ''

  return (
    <div>
      {/* প্রোফাইল হেডার কার্ড */}
      <div style={{
        background: colors.cardBg,
        border: `1px solid ${colors.cardBorder}`,
        borderRadius: '12px',
        padding: '20px 16px',
        marginBottom: '16px',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          
          <div style={{ position: 'relative' }}>
            <div
              onClick={() => { if (isOwner) setShowAvatarMenu(!showAvatarMenu) }}
              style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                border: '3px solid #0066cc',
                overflow: 'hidden',
                cursor: isOwner ? 'pointer' : 'default',
                background: isDark ? '#2a2b30' : '#e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }}
              title={isOwner ? (lang === 'bn' ? 'অবতার পরিবর্তন বা ডিলিট করতে ক্লিক করুন' : 'Click to change or remove avatar') : ''}
            >
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#0066cc' }}>
                  {profile.name ? profile.name[0].toUpperCase() : '?'}
                </span>
              )}

              {isOwner && (
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: 'rgba(0,0,0,0.55)',
                  textAlign: 'center',
                  fontSize: '10px',
                  color: '#fff',
                  padding: '2px 0'
                }}>
                  {lang === 'bn' ? 'পরিবর্তন' : 'Edit'}
                </div>
              )}
            </div>

            {showAvatarMenu && isOwner && (
              <div style={{
                position: 'absolute',
                top: '84px',
                left: 0,
                background: colors.cardBg,
                border: `1px solid ${colors.cardBorder}`,
                borderRadius: '8px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                zIndex: 20,
                minWidth: '160px',
                padding: '5px 0'
              }}>
                <button
                  onClick={() => { setShowAvatarPicker(true); setShowAvatarMenu(false) }}
                  style={{ display: 'block', width: '100%', padding: '8px 12px', background: 'none', border: 'none', color: colors.text, textAlign: 'left', cursor: 'pointer', fontSize: '13px' }}
                >
                  🎨 {lang === 'bn' ? 'অবতার পরিবর্তন' : 'Change Avatar'}
                </button>

                {profile.avatar_url && (
                  <button
                    onClick={() => handleUpdateAvatar(null)}
                    style={{ display: 'block', width: '100%', padding: '8px 12px', background: 'none', border: 'none', color: '#ff4d4f', textAlign: 'left', cursor: 'pointer', fontSize: '13px', borderTop: `1px solid ${colors.cardBorder}` }}
                  >
                    🗑️ {lang === 'bn' ? 'অবতার রিমুভ' : 'Remove Avatar'}
                  </button>
                )}
              </div>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ margin: '0 0 3px', fontSize: '20px', fontWeight: 'bold', color: colors.text }}>
                  {profile.full_name || profile.name}
                </h2>
                <div style={{ fontSize: '14px', color: colors.textMuted, marginBottom: '6px' }}>
                  @{profile.name}
                </div>
              </div>

              {isOwner ? (
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  style={{
                    background: isEditing ? (isDark ? '#333' : '#e5e7eb') : '#0066cc',
                    color: isEditing ? colors.text : '#fff',
                    border: 'none',
                    borderRadius: '20px',
                    padding: '5px 14px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  {isEditing ? (lang === 'bn' ? 'বাতিল' : 'Cancel') : (lang === 'bn' ? '✏️ এডিট প্রোফাইল' : '✏️ Edit Profile')}
                </button>
              ) : (
                <button
                  onClick={handleFollowToggle}
                  style={{
                    background: isFollowing ? 'transparent' : '#0066cc',
                    color: isFollowing ? colors.text : '#fff',
                    border: isFollowing ? `1px solid ${colors.cardBorder}` : 'none',
                    borderRadius: '20px',
                    padding: '5px 16px',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  {isFollowing ? (lang === 'bn' ? 'ফলোয়িং ✓' : 'Following ✓') : (lang === 'bn' ? '+ ফলো করুন' : '+ Follow')}
                </button>
              )}
            </div>

            {profile.bio && (
              <p style={{ margin: '6px 0 8px', fontSize: '13px', color: colors.text, whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                {profile.bio}
              </p>
            )}

            <div style={{ fontSize: '12px', color: colors.textMuted, display: 'flex', gap: '15px', alignItems: 'center', marginTop: '6px' }}>
              <span>📅 Joined: {joinedDate}</span>
              <span><strong>{followersCount}</strong> Followers</span>
              <span><strong>{followingCount}</strong> Following</span>
            </div>
          </div>
        </div>

        {isEditing && (
          <form onSubmit={handleSaveProfile} style={{ marginTop: '16px', borderTop: `1px solid ${colors.cardBorder}`, paddingTop: '14px' }}>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: colors.textMuted, marginBottom: '4px' }}>
                {lang === 'bn' ? 'পুরো নাম (Full Name):' : 'Full Name:'}
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                style={{ width: '100%', padding: '8px', background: colors.inputBg, color: colors.text, border: `1px solid ${colors.inputBorder}`, borderRadius: '6px', boxSizing: 'border-box', fontSize: '13px' }}
              />
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: colors.textMuted, marginBottom: '4px' }}>
                {lang === 'bn' ? 'ইউজারনেম (Username / @name):' : 'Username (@name):'}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                required
                style={{ width: '100%', padding: '8px', background: colors.inputBg, color: colors.text, border: `1px solid ${colors.inputBorder}`, borderRadius: '6px', boxSizing: 'border-box', fontSize: '13px' }}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: colors.textMuted, marginBottom: '4px' }}>
                {lang === 'bn' ? 'বায়ো / নিজের সম্পর্কে (Bio):' : 'Bio (About you):'}
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder={lang === 'bn' ? 'মনের কথা, ভাবাদর্শ বা নিজের ছোট্ট পরিচয় লিখুন...' : 'Write something about yourself...'}
                rows={3}
                style={{ width: '100%', padding: '8px', background: colors.inputBg, color: colors.text, border: `1px solid ${colors.inputBorder}`, borderRadius: '6px', boxSizing: 'border-box', fontSize: '13px', fontFamily: 'inherit' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                style={{ padding: '6px 14px', background: 'none', border: `1px solid ${colors.cardBorder}`, color: colors.text, borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
              >
                {lang === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{ padding: '6px 18px', background: '#0066cc', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}
              >
                {saving ? '...' : (lang === 'bn' ? 'সেভ করুন' : 'Save Changes')}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* অবতার সিলেক্টর মোডাল */}
      {showAvatarPicker && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '15px'
        }}>
          <div style={{
            background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, borderRadius: '16px',
            maxWidth: '460px', width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column',
            boxShadow: '0 8px 30px rgba(0,0,0,0.4)', padding: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <strong style={{ color: colors.text, fontSize: '16px' }}>
                🦁 🚗 🍎 {lang === 'bn' ? 'অবতার নির্বাচন করুন' : 'Choose Your Avatar'}
              </strong>
              <button onClick={() => setShowAvatarPicker(false)} style={{ background: 'none', border: 'none', color: colors.textMuted, fontSize: '18px', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ position: 'relative', marginBottom: '10px' }}>
              <input
                type="text"
                value={avatarSearch}
                onChange={(e) => setAvatarSearch(e.target.value)}
                placeholder={lang === 'bn' ? '🔍 খুঁজুন (যেমন: বাঘ, গাড়ি, আম, সিংহ, ফুল)...' : '🔍 Search (e.g. lion, car, mango, rose)...'}
                style={{
                  width: '100%',
                  padding: '8px 34px 8px 12px',
                  borderRadius: '20px',
                  border: `1px solid ${colors.inputBorder}`,
                  background: colors.inputBg,
                  color: colors.text,
                  fontSize: '13px',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
              {avatarSearch && (
                <button
                  onClick={() => setAvatarSearch('')}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer' }}
                >
                  ✕
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '10px', scrollbarWidth: 'none' }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '16px',
                    border: selectedCategory === cat.id ? '1.5px solid #0066cc' : `1px solid ${colors.cardBorder}`,
                    background: selectedCategory === cat.id ? (isDark ? '#1e3a5f' : '#e0f2fe') : 'transparent',
                    color: selectedCategory === cat.id ? '#0066cc' : colors.textMuted,
                    fontSize: '11px',
                    fontWeight: selectedCategory === cat.id ? 'bold' : 'normal',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {lang === 'bn' ? cat.bn : cat.en}
                </button>
              ))}
            </div>

            <div style={{
              flex: 1,
              overflowY: 'auto',
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px',
              padding: '6px 2px 12px'
            }}>
              {filteredAvatars.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: colors.textMuted, padding: '30px 0', fontSize: '13px' }}>
                  {lang === 'bn' ? 'কোনো অবতার পাওয়া যায়নি।' : 'No avatar found.'}
                </div>
              ) : (
                filteredAvatars.map((item, idx) => {
                  const avatarUrl = makeEmojiAvatar(item.emoji, item.bg)
                  const isCurrent = profile.avatar_url === avatarUrl

                  return (
                    <div
                      key={idx}
                      onClick={() => handleUpdateAvatar(avatarUrl)}
                      style={{
                        width: '68px',
                        height: '68px',
                        borderRadius: '50%',
                        border: isCurrent ? '3px solid #0066cc' : `1.5px solid ${colors.cardBorder}`,
                        cursor: 'pointer',
                        overflow: 'hidden',
                        background: item.bg,
                        boxShadow: isCurrent ? '0 0 10px rgba(0,102,204,0.5)' : 'none',
                        transition: 'transform 0.15s ease',
                        margin: '0 auto',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      title={item.name}
                    >
                      <span style={{ fontSize: '36px', userSelect: 'none' }}>{item.emoji}</span>
                    </div>
                  )
                })
              )}
            </div>

            <div style={{ borderTop: `1px solid ${colors.cardBorder}`, paddingTop: '10px', textAlign: 'center' }}>
              <span style={{ fontSize: '11px', color: colors.textMuted }}>
                {lang === 'bn' ? 'যেকোনো অবতারে ক্লিক করলেই প্রোফাইলে সেভ হয়ে যাবে' : 'Click any avatar to apply to your profile'}
              </span>
            </div>

          </div>
        </div>
      )}

      {/* ইউজারের পূর্ণাঙ্গ পোস্ট লিস্ট (PostCard সহ) */}
      <div>
        <h3 style={{ margin: '14px 0 10px', fontSize: '16px', color: colors.text }}>
          📝 {lang === 'bn' ? 'পোস্টসমূহ' : 'Posts'} ({userPosts.length})
        </h3>

        {userPosts.length === 0 ? (
          <p style={{ color: colors.textMuted, fontSize: '13px' }}>
            {lang === 'bn' ? 'এখনো কোনো পোস্ট করা হয়নি।' : 'No posts yet.'}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {userPosts.map(p => {
              const fullPostData = {
                ...p,
                profiles: p.profiles || profile
              }

              return PostCard ? (
                <PostCard
                  key={p.id}
                  post={fullPostData}
                  session={session}
                  lang={lang}
                  colors={colors}
                  isDark={isDark}
                  onChanged={loadUserPosts}
                  onViewProfile={onViewProfile}
                  onAvatarClick={onAvatarClick}
                />
              ) : null
            })}
          </div>
        )}
      </div>
    </div>
  )
}