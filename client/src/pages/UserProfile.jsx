import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'

const UserProfile = () => {
    const { id } = useParams();
    const [userProfile, setUserProfile] = useState(null);

    useEffect(() => {
        console.log('user id', id);
    });
    
    return (
        <div className="user-profile">
            User #{id}
        </div>
    )
}
export default UserProfile;