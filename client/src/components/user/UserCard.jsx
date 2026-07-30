import { Link } from 'react-router-dom'

import { useAuthContext } from '/src/contexts/auth'

import "./UserCard.css"

function UserCard({profileData}){
    const { user, isAuthenticated} = useAuthContext()

    if (!profileData || Object.keys(profileData).length === 0) {
        return (
            <></>
        )
    }

    return (
        <div className='UserCard'>
            <img className='user-icon' src={profileData.image_url}/>
            <div className='text'>
                <div className='main'>
                    <div className='username'>{profileData.username}</div>
                    { (profileData.flair_name != null) && (<div className='flair'>{profileData.flair_name}</div>)}
                </div>
                <div className='bio'>{profileData.bio}</div>
                <div className='joined'>Member since {(new Date(profileData.created_at)).toLocaleDateString()}</div>

                { isAuthenticated && user.user_id === profileData.user_id && (<Link to={'/me/edit'} className='edit-profile'>edit</Link>)}
            </div>
        </div>
    )
}

export default UserCard;