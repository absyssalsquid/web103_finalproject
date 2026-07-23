import './UserTag.css'

function UserTag({user_id, username, flair, image_url}) {
    return (
        <div className="UserTag">
            <img className='user-icon' src={image_url}/>
            <div className='text'>
                <a href={`/users/${user_id}`} className='name'>{username}</a>
                <div className='flair'>{flair}</div>
            </div>
        </div>
    )
}

export default UserTag;