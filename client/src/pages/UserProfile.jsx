import { Navigate, useParams, useRoutes } from 'react-router-dom'
import { useEffect, useState } from 'react'

import './UserProfile.css'
import SubNav from '../components/SubNav'
import Achievements from '../components/user/Achievements'
import UserCard from '../components/user/UserCard'
import UserContributions from '../components/Contributions'
import { getCurrentUserID } from "/src/api/auth.js"
import { SAMPLE_USER, SAMPLE_ACHIEVEMENTS } from "/src/api/test_data.js"
import { toTitleCase } from "/src/utils.js"

const SAMPLE_STATS = {
    cases_contributed: 95,
    cases_filed: 8,
    evidence_submitted: 55,
    arguments_made: 34,
    jury_duty_served: 13
}

const UserProfile = () => {
    var { id } = useParams();

    // works for both /users/:id/* and /profile/* mounts
    const base = id ? `/users/${id}` : '/profile';

    const [userID, setUserID] = useState({user_id: id})
    const [profileData, setProfileData] = useState({});
    const [userStats, setUserStats] = useState({});
    const [achievements, setAchievements] = useState([]);
    // const [juryHistory, setJuryHistory] = useState([]);
    // const [evidenceHistory, setEvidenceHistory] = useState([]);
    // const [argumentHistory, setArgumentHistory] = useState([]);

    useEffect(() => {
        console.log('user id', id);
        async function fetchData(){
            const res = await getCurrentUserID();
            if (res) setUserID(res);
            
            setProfileData(SAMPLE_USER)
            setUserStats(SAMPLE_STATS)
            setAchievements(SAMPLE_ACHIEVEMENTS)
        }
        fetchData();
    }, []);

    const element = useRoutes([
        { path: '/',             element: <Navigate to="achievements" replace /> },
        { path: 'achievements',  element: <Achievements  items={achievements} /> },
        { path: 'contributions', element: <UserContributions data={[]} /> },
    ]);

    // if (loading){
    //     return (
    //         <div className="main-content">
    //             <h1>Loading...</h1>
    //         </div>
    //     )
    // }
    
    return (
        <div className="UserProfile main-content">

            <UserCard profileData={profileData} isPublic={true} />

            <div className='summary-stat-container'>
                <div className='stat-card'>
                    <div className='desc'>total xp</div>
                    <div className='count'>{profileData.total_xp}</div>
                </div>
                {Object.entries(userStats).map(([key, value]) => {
                    return(
                        <div className='stat-card'>
                            <div className='desc'>{toTitleCase(key).toLowerCase()}</div>
                            <div className='count'>{value}</div>
                        </div>
                    )
                })}
            </div>

            <SubNav 
                items={[
                    {text: 'Achievements'    , href: `${base}/achievements` },
                    {text: 'Contributions'   , href: `${base}/contributions` },
                ]}
            />

            {element}

        </div>
    )
}
export default UserProfile;