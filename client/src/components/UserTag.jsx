import './UserTag.css'

function UserTag({user_id, username, image_url, date}) {
    return (
        <div className="UserTag">
            <img className='user-icon' src={image_url}/>
            <div className='text'>
                <a href={`/users/${user_id}`} className='name'>{username}</a>
                {date && <div className='date'>{date}</div>}
            </div>
        </div>
    )
}

export default UserTag;