import { Navigate, useParams, useRoutes } from 'react-router-dom'
import { useEffect, useState } from 'react'

import './UserProfile.css'
import SubNav from '../components/SubNav'
import Achievements from '../components/user/Achievements'
import UserCard from '../components/user/UserCard'
import UserContributions from '../components/Contributions'

import { fetchUserData, fetchUserStats, fetchUserAchievements } from "/src/api/users.js"

import { toTitleCase } from "/src/utils.js"

const STAT_NAMES = {
    total_xp: 'total xp',
    cases_contributed: 'cases contributed',
    cases: 'cases filed',
    jury_assignments: 'juries served',
    evidence: 'evidence submitted',
    arguments: 'arguments made',
}

const UserProfile = () => {
    var { id } = useParams();

    // works for both /users/:id/* and /profile/* mounts
    const base = id ? `/users/${id}` : '/profile';

    const [loading, setLoading] = useState(true);
    const [profileData, setProfileData] = useState({});
    const [userStats, setUserStats] = useState({});
    const [achievements, setAchievements] = useState([]);
    // const [juryHistory, setJuryHistory] = useState([]);
    // const [evidenceHistory, setEvidenceHistory] = useState([]);
    // const [argumentHistory, setArgumentHistory] = useState([]);

    useEffect(() => {
        console.log('user id', id);
        async function fetchData(){

            const results = await Promise.all([
                fetchUserData(id),
                fetchUserStats(id),
                fetchUserAchievements(id)
            ])
            const data = await Promise.all(
                results.map((item) => item.json()));

            setProfileData(data[0])
            setUserStats(data[1])
            setAchievements(data[2])

            setLoading(false)
        }
        fetchData();
    }, []);

    const element = useRoutes([
        { path: '/',             element: <Navigate to="achievements" replace /> },
        { path: 'achievements',  element: <Achievements  items={achievements} /> },
        { path: 'contributions', element: <UserContributions data={[]} /> },
    ]);

    if (loading){
        return (
            <div className="main-content">
                <div className='minimal'>
                    <h1>Loading...</h1>
                </div>
            </div>
        )
    }
    
    return (
        <div className="UserProfile main-content">

            <UserCard profileData={profileData}/>

            <div className='summary-stat-container'>
                {Object.entries(STAT_NAMES).map(([key, value]) => {
                    return(
                        <div className='stat-card'>
                            <div className='desc'>{toTitleCase(value).toLowerCase()}</div>
                            <div className='count'>{userStats[key]}</div>
                        </div>
                    )
                })}
            </div>

            <SubNav 
                items={[
                    {text: 'Achievements'    , href: `${base}/achievements` },
                    // {text: 'Contributions'   , href: `${base}/contributions` },
                ]}
            />

            {element}

        </div>
    )
}
export default UserProfile;