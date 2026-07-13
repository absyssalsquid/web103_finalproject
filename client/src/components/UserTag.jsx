import './Usertag.css'

function UserTag({user_id, username}) {
    return (
        <a className="UserTag" href={`/user/${user_id}`}>
            {username}
        </a>
    )
}

export default UserTag;