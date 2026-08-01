import { useState, useEffect } from 'react'
import { Link, useRoutes } from 'react-router-dom'

import SubNav from '../components/SubNav'
import JuryAssignments from '../components/user/JuryAssignments'

import { useTheme } from '/src/contexts/theme'
import { useAuthContext } from '/src/contexts/auth'

import { getUserLimits, getRefreshTime } from '/src/api/rules'
import { getUsage } from '/src/api/me'
import {getTimeString} from "/src/utils"

import "./Dashboard.css"

const CARD_TITLES = {
    jury_assignments: 'juries served',
    cases: 'cases filed',
    evidence: 'evidence submitted',
    arguments: 'arguments made'
}

const LINKS = {
    cases: (<Link to='/new-case'> start a case </Link>),
    jury_assignments: (<Link to='/jury/serve'> serve on a jury </Link>),
}

const Dashboard = () => {
    const { theme, setTheme, themes } = useTheme()
    const { isAuthenticated } = useAuthContext()
    
    const [loading, setLoading] = useState(true)

    const [userLimits, setUserLimits] = useState({})
    const [refreshTime, setRefreshTime] = useState(null)
    const [usage, setUsage] = useState({ jury_assignments: null, cases: null, evidence: null, arguments: null })

    const [caseHistoryData    , setCaseHistoryData    ] = useState({ page: 1, last_page: 1, limit: 20, entries: [] })
    const [evidenceHistoryData, setEvidenceHistoryData] = useState({ page: 1, last_page: 1, limit: 20, entries: [] })
    const [argumentHistoryData, setArgumentHistoryData] = useState({ page: 1, last_page: 1, limit: 20, entries: [] })
    const [juryHistoryData    , setJuryHistoryData    ] = useState({ page: 1, last_page: 1, limit: 20, entries: [] })


    useEffect(() => {
        async function fetchData(){
            if (isAuthenticated){
                const res = await Promise.all([
                    getRefreshTime(),
                    getUserLimits(),
                    getUsage()
                ])

                const data = await Promise.all(
                    res.map((item) => item.json()))

                setRefreshTime(new Date(data[0]))
                setUserLimits(data[1])
                setUsage(data[2])
            }
            setLoading(false)
        }
        fetchData();
    }, []);

    const element = useRoutes([
        {'path': '/cases'            , 'element': <h2>cases</h2>},
        {'path': '/evidence'         , 'element': <h2>evidence</h2>},
        {'path': '/arguments'        , 'element': <h2>arguments</h2>},
        {'path': '/jury-assignments' , 'element': <JuryAssignments history={juryHistoryData} setHistory={setJuryHistoryData}/>},
    ]);

    if (loading){
        return (
            <div className='main-content minimal'>
                <h1>Loading dashboard...</h1>
            </div>
        )
    }

    if (!isAuthenticated){
        return (
            <div className='main-content minimal'>
                <h1><Link to="/sign-in">Sign in</Link> to view your dashboard</h1>
            </div>
        )
    }
    
    return (
        <div className='Dashboard main-content'>

            {/* ---------------------- daily activity ---------------------- */}
            <h2>Today</h2>
            <div className='summary-stat-container'>
                {Object.entries(CARD_TITLES).map(([key, val])=>(
                    <div className='stat-card'>
                        <div className='desc'>{val}</div>
                        <div className='count'>{usage[key]}/{userLimits[key]}</div>
                        {(key in LINKS) && LINKS[key]}
                    </div>
                ))}
            </div>

            <div>New day starts at {refreshTime && getTimeString(refreshTime)}</div>

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