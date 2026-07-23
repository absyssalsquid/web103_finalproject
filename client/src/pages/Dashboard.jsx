import { useState, useEffect } from 'react'
import { Link, useRoutes } from 'react-router-dom'

import SubNav from '../components/SubNav'
import JuryAssignments from '../components/user/JuryAssignments'
import UserCard from '../components/user/UserCard'

import {useTheme} from '/src/contexts/theme'

import { SAMPLE_USER, generateJuryAssignments} from "/src/api/test_data.js"
import {LIMITS} from "/src/api/limits"
import { getCurrentUserID} from "/src/api/auth"

import "./Dashboard.css"


const SAMPLE_SUBMISSIONS_USED = {
    case: 1,
    jury: 2,
    evidence: 3,
    argument: 4
}

const SAMPLE_JURY_ASSIGNMENTS = generateJuryAssignments(8,2)

const Dashboard = () => {
    const { theme, setTheme, themes } = useTheme()
    const [userID, setUserID] = useState(1)
    const [profileData, setProfileData] = useState({});

    const [submissionsUsed, setSubmissionsUsed] = useState({})

    // const [caseHPageNum, setCaseHPageNum] = useState(1)
    // const [caseHTotalPages, setCaseHTotalPages] = useState(null)
    // const [caseH, setCaseH] = useState([])

    // const [evidenceHPageNum, setEvidenceHPageNum] = useState(1)
    // const [evidenceHTotalPages, setEvidenceHTotalPages] = useState(null)
    // const [evidenceH, setEvidenceH] = useState([])

    // const [argumentHPageNum, setArgumentHPageNum] = useState(1)
    // const [argumentHTotalPages, setArgumentHTotalPages] = useState(null)
    // const [argumentsH, setArgumentsH] = useState([])

    const [juryPageInfo, setJuryPageInfo] = useState({curr: 1, last: 12})
    const [juryAssignments, setJuryAssignments] = useState([])

    useEffect(() => {
        async function fetchData(){
            const res = await getCurrentUserID();
            if (res) setUserID(res);
            setProfileData(SAMPLE_USER)
            setSubmissionsUsed(SAMPLE_SUBMISSIONS_USED)
            setJuryAssignments(SAMPLE_JURY_ASSIGNMENTS)
        }
        fetchData();
    }, []);

    const element = useRoutes([
        {'path': '/cases'            , 'element': <h2>cases</h2>},
        {'path': '/evidence'         , 'element': <h2>evidence</h2>},
        {'path': '/arguments'        , 'element': <h2>arguments</h2>},
        {'path': '/jury-assignments' , 'element': <JuryAssignments pageInfo={juryPageInfo} setPageInfo={setJuryPageInfo} juryAssignments={juryAssignments}/>},
    ]);

    if (!userID){
        return (
            <div className='main-content'>
                <h2><Link to="/sign-in">Sign in</Link> to view your dashboard</h2>
            </div>
        )
    }
    
    return (
        <div className='Dashboard main-content'>
            <UserCard profileData={profileData} isPublic={false} />
            <Link to={`/users/${profileData.user_id}`}>Public profile</Link>

            {/* ---------------------- daily activity ---------------------- */}
            <h2>Today</h2>
            <div className='summary-stat-container'>
                <div className='stat-card'>
                    <div className='desc'>jury summons</div>
                    <div className='count'>{submissionsUsed.jury}/{LIMITS.JURY_SUMMONS}</div>
                    <Link to='/jury-duty' role='button' className=''>
                        serve on a jury
                    </Link>
                </div>
                <div className='stat-card'>
                    <div className='desc'>case submissions</div>
                    <div className='count'>{submissionsUsed.case}/{LIMITS.CASE_SUBMISSIONS}</div>
                    <Link to='/new-case' role='button' className=''>
                        start a case
                    </Link>
                </div>
                <div className='stat-card'>
                    <div className='desc'>evidence submissions</div>
                    <div className='count'>{submissionsUsed.evidence}/{LIMITS.EVIDENCE_SUBMISSIONS}</div>
                </div>
                <div className='stat-card'>
                    <div className='desc'>argument submissions</div>
                    <div className='count'>{submissionsUsed.argument}/{LIMITS.ARGUMENT_SUBMISSIONS}</div>
                </div>
            </div>

            <div>New day starts at {LIMITS.REFRESH_TIME.toLocaleTimeString(undefined, {
                hour: 'numeric',
                minute: '2-digit'
            })}</div>

            {/* ---------------------- all history ---------------------- */}
            <h2>Activity</h2>
            <SubNav 
                items={[
                    {text: 'Cases'     , href: `/dashboard/cases`},
                    {text: 'Evidence'   , href: `/dashboard/evidence` },
                    {text: 'Arguments'  , href: `/dashboard/arguments` },
                    {text: 'Jury\xa0Assignments'    , href: `/dashboard/jury-assignments`},
                    // {text: 'Likes/dislikes'     , href: `/dashboard/reactions`},
                ]}
            />
            <div className='sub-content'>
                {element}

            </div>

            {/* ---------------------- settings ---------------------- */}
            <h2>Preferences and Settings</h2>
            <div className='settings'>
                <label>Theme</label>
                <select value={theme} onChange={(e) => setTheme(e.target.value)}>
                    {themes.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                </select>
            </div>

        </div>
    )
}
export default Dashboard;