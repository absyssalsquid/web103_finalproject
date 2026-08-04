import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'

import ToastMessage from '../components/ToastMessage'
import CardHeader from '/src/components/card_fragments/CardHeader'
import { useAuthContext } from '/src/contexts/auth'

import { fetchUserData, fetchUserAchievements } from '/src/api/users'
import { getLengthLimits } from '/src/api/rules'
import { updateProfile } from '/src/api/me'

import './EditProfile.css'

const PENCIL_ICON = '/pencil-xxl.png'

function EditProfile(){
    const navigate = useNavigate();
    const { user, isAuthenticated, updateUser, isAuthLoading } = useAuthContext();
    const fileInputRef = useRef(null);

    const [lengthLimits, setLengthLimits] = useState({});
    const [earned, setEarned] = useState([]);        // earned achievements, flair options

    // the saved profile values — used to reset the form on cancel
    const [original, setOriginal] = useState({ image_url: null, bio: '', flair: null });
    const [edited, setEdited] = useState({ image_url: null, bio: '', flair: null });

    // editable form state
    const [imagePreview, setImagePreview] = useState('');
    const [selectedFlair, setSelectedFlair] = useState({}); // complete ach + u_ach data join

    const [toastMsg, setToastMsg] = useState({message: '', type:'', key: null});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        console.log("enter useEffect")

        async function fetchData(){
            if (user?.user_id) {
                const [profileRes, achRes, limitsRes] = await Promise.all([
                    fetchUserData(user.user_id),
                    fetchUserAchievements(user.user_id),
                    getLengthLimits(),
                ])
                const [profile, achievements, limits] = await Promise.all(
                    [profileRes, achRes, limitsRes].map((r) => r.json()))
    
                setLengthLimits(limits)
                const earnedAchievements = achievements.filter((a) => a.earned_at != null)
                setEarned(earnedAchievements)
                
                // console.log(earnedAchievements)
                // console.log("profile", profile)
                
                const currProfile = {
                    image_url: profile.image_url, 
                    bio: profile.bio || '',
                    flair: profile.flair ? Number(profile.flair) : null,
                }
                console.log(currProfile)
                setOriginal(currProfile)
                setEdited(currProfile)
                setImagePreview(currProfile.image_url || '')
            }

            setLoading(false)
        }
        fetchData();
    }, [user?.user_id]);

    useEffect(() => {
        const sFlair = edited.flair ? earned.find((a) => a.achievement_id === edited.flair) : {}; 
        // console.log("edited", edited)
        // console.log("selected flair", sFlair)
        setSelectedFlair(sFlair)
    }, [edited.flair, earned])

    
    // clicking the pencil opens the OS file dialog
    const pickImage = () => fileInputRef.current?.click();

    const imageHandler = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setEdited((prev)=>({...prev, image_url: file}))
        setImagePreview(URL.createObjectURL(file));
    }

    const flairHandler = (achievement_id) => {
        const id = Number(achievement_id)
        // clicking the currently selected flair clears it
        const old_flair = edited.flair
        setEdited((prev)=>({...prev, flair: (old_flair === id ? null : id)}))
    }

    const bioHandler = (e) => {
        setEdited((prev)=>({...prev, bio:e.target.value}))
    }

    const submitHandler = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        const res = await updateProfile({ bio: edited.bio, flair: edited.flair, image: edited.image_url })
        const data = await res.json()

        if (res.ok) {
            updateUser(data)
            setToastMsg({message: 'Profile updated.', type: 'success', key: Date.now()})
            setTimeout(() => navigate('/profile'), 800);
        } else {
            setToastMsg({message: data.error || 'Something went wrong.', type: 'error', key: Date.now()})
            setSubmitting(false);
        }
    }

    const cancelHandler = (e) => {
        e.preventDefault();
        // restore form to original values
        setEdited(original)
        setImagePreview(original.image_url || '')
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    if (loading || isAuthLoading) {
        return (
            <div className="main-content">
                <div className='minimal'>
                    <h1>Loading...</h1>
                    <div className='loader'></div>
                </div>
            </div>
        )
    }

    if (!isAuthenticated) {
        return (
            <div className="main-content ">
                <div className='minimal'>
                    <h1><Link to={'/sign-in'}>Sign in</Link> to edit your profile.</h1>
                </div>
            </div>
        )
    }

    return (
        <div className="EditProfile main-content">
            <ToastMessage message={toastMsg.message} type={toastMsg.type} key={toastMsg.key}/>

            <div className='card-container'>
                <CardHeader title="Edit profile" />

                <div className='card'>
                    <form onSubmit={submitHandler}>

                {/* profile image with pencil overlay */}
                <div className='avatar-field'>
                    <img className='user-icon' src={imagePreview} alt="Profile" />

                    <button
                        type="button"
                        className='avatar'
                        onClick={pickImage}
                        aria-label="Change profile picture"
                    >
                        <span className='pencil'>
                            <img src={PENCIL_ICON} alt="" />
                        </span>
                    </button>

                    <input
                        ref={fileInputRef}
                        name="image"
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={imageHandler}
                    />
                </div>

                {/* username, not editable */}
                <div className='username'>{user.username}</div>

                {/* currently selected flair */}
                {selectedFlair && (
                    <div className='current-flair'>{selectedFlair.name}</div>
                )}

                {/* flair picker */}
                <label className='field-label'>Flair</label>
                <div className='flair-picker'>
                    {earned.length === 0
                        ? <p className='empty'>Earn an achievement to flair it here.</p>
                        : earned.map((a) => (
                            <label
                                key={a.achievement_id}
                                className={'flair-option' + (edited.flair === a.achievement_id ? ' selected' : '')}
                            >
                                <input
                                    type="radio"
                                    name="flair"
                                    checked={edited.flair === a.achievement_id}
                                    onChange={() => flairHandler(a.achievement_id)}
                                    onClick={() => flairHandler(a.achievement_id)}
                                />
                                {a.name}
                            </label>
                        ))
                    }
                </div>

                {/* bio */}
                <label className='field-label' htmlFor="bio">Bio</label>
                <textarea
                    id="bio"
                    className='bio'
                    name="bio"
                    value={edited.bio}
                    maxLength={lengthLimits.bio_max}
                    onChange={bioHandler}
                    placeholder="tell the court about yourself..."
                    rows={5}
                />
                <small className="char-limit">{edited.bio.length}/{lengthLimits.bio_max}</small>

                        <div className="form-actions">
                            <button type="submit" disabled={submitting}>Save</button>
                            <button type="button" onClick={cancelHandler}>Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default EditProfile;
