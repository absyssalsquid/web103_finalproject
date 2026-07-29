import { useState, useEffect } from 'react'
import { Link, useRoutes } from 'react-router-dom'

import SubNav from '../components/SubNav'
import JuryAssignments from '../components/user/JuryAssignments'

import { useTheme } from '/src/contexts/theme'
import { useAuthContext } from '/src/contexts/auth'

import { getUsage } from '/src/api/me'

import {LIMITS} from "/src/api/limits"

import "./Dashboard.css"

const CARD_TITLES = {
    jury_assignments: 'juries served',
    cases: 'cases filed',
    evidence: 'evidence submitted',
    arguments: 'arguments made'
}

const SUBMISSION_LIMITS = {
    jury_assignments: LIMITS.JURY_ASSIGNMENTS,
    cases: LIMITS.CASE_SUBMISSIONS,
    evidence: LIMITS.EVIDENCE_SUBMISSIONS,
    arguments: LIMITS.ARGUMENT_SUBMISSIONS,
}

const LINKS = {
    jury_assignments: (<Link to='/new-case'> start a case </Link>),
    cases: (<Link to='/jury-duty'> serve on a jury </Link>),
}

const Dashboard = () => {
    const { theme, setTheme, themes } = useTheme()
    const { isAuthenticated } = useAuthContext()

    const [usage, setUsage] = useState({ jury_assignments: null, cases: null, evidence: null, arguments: null })

    const [caseHistoryData    , setCaseHistoryData    ] = useState({ page: 1, last_page: 1, limit: 20, entries: [] })
    const [evidenceHistoryData, setEvidenceHistoryData] = useState({ page: 1, last_page: 1, limit: 20, entries: [] })
    const [argumentHistoryData, setArgumentHistoryData] = useState({ page: 1, last_page: 1, limit: 20, entries: [] })
    const [juryHistoryData    , setJuryHistoryData    ] = useState({ page: 1, last_page: 1, limit: 20, entries: [] })

    useEffect(() => {
        async function fetchData(){
            const res = await getUsage();
            if (res.ok) {
                const data = await res.json()
                setUsage(data)
            }
        }
        fetchData();
    }, []);

    const element = useRoutes([
        {'path': '/cases'            , 'element': <h2>cases</h2>},
        {'path': '/evidence'         , 'element': <h2>evidence</h2>},
        {'path': '/arguments'        , 'element': <h2>arguments</h2>},
        {'path': '/jury-assignments' , 'element': <JuryAssignments history={juryHistoryData} setHistory={setJuryHistoryData}/>},
    ]);

    if (!isAuthenticated){
        return (
            <div className='main-content minimal'>
                <h2><Link to="/sign-in">Sign in</Link> to view your dashboard</h2>
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
                        <div className='count'>{usage[key]}/{SUBMISSION_LIMITS[key]}</div>
                        {(key in LINKS) && LINKS[key]}
                    </div>
                ))}
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