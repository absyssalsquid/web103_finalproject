import "./UserCard.css"

function UserCard({profileData, isPublic}){
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
                    <div className='flair'>{profileData.flair_name}</div>
                </div>
                <div className='bio'>{profileData.bio}</div>
                { isPublic
                    ? <div className='joined'>Member since {profileData.created_at.toLocaleDateString()}</div>
                    : <button className='edit-profile'>edit</button>
                }
            </div>
        </div>
    )
}

export default UserCard;