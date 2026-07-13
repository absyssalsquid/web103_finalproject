import { NavLink, useRoutes, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Countdown from 'react-countdown';

import CaseEvidence from '../components/CaseEvidence'
import CaseArguments from '../components/CaseArguments'
import CaseVerdict from '../components/CaseVerdict'
import CaseRuling from '../components/CaseRuling'
import UserTag from '../components/UserTag'

import {toTitleCase, phaseDelta} from '../utils'

import './Case.css'

const Case = () => {
    const { id } = useParams();
    const [loading, setLoading] = useState(true);

    const [caseData, setCaseData] = useState({}); 
    const [cArguments, setArguments] = useState([]);
    const [evidence, setEvidence] = useState([]);
    const [juryVotes, setJuryVotes] = useState({}); // contains count of current votes

    useEffect(() => {
        console.log('case id', id);
        
        async function fetchData() {
            console.log('fetching data', Date.now().toString())

            const today = Date.now();

            const cData = {
                case_id: 0, 
                user_id: 0,
                username: 'GuiltyGoose',
                created_at: new Date(2026, 7, 8, 10, 33, 21).getTime(),
                defendant: 'the wind',
                accusation: 'Wind favors the west side of the valley',
                phase: 'JURY_DELIBERATION', 
                phase_start:  today, 
                phase_end:    today + 10000, // 10s timer for testing
                verdict: 'GUILTY' // null
            }
            console.log(cData.created_at, new Date(cData.created_at))

            setCaseData(cData);

            setArguments([]);
            setEvidence([]);
            setJuryVotes({
                'GUILTY': 58, 
                'NOT_GUILTY': 23,
                'INSUFFICIENT_EVIDENCE': 3
            });
            setLoading(false);
        }

        if (loading) fetchData();
        // immediately redirect to current active case phase (evidence, arguments, jury, verdict) based on case data
    },[id, loading]);

    useEffect(() => {
        const intervalId = setInterval(() => {
            const now = new Date();
            if (now >= caseData.end) {
                setLoading(true);
            }
        }, 1000); // Check every second

        // Cleanup interval on component unmount
        return () => clearInterval(intervalId);
    }, [caseData]);

    const element = useRoutes([
        { path: '/',         element: <></> },
        { path: 'evidence',  element: <CaseEvidence  phaseDelta={phaseDelta(caseData.phase, 'DISCOVERY')}           caseData={caseData} data={evidence} /> },
        { path: 'arguments', element: <CaseArguments phaseDelta={phaseDelta(caseData.phase, 'ARGUMENT')}            caseData={caseData} data={cArguments} /> },
        { path: 'verdict',   element: <CaseVerdict   phaseDelta={phaseDelta(caseData.phase, 'JURY_DELIBERATION')}   caseData={caseData} data={juryVotes} /> },
        { path: 'ruling',    element: <CaseRuling    phaseDelta={phaseDelta(caseData.phase, 'RULING')}              caseData={caseData} /> },
    ]);

    if (loading) {
        return (
            <div className="case">
               Loading...
            </div>
        )
    }
    else if (caseData == {}) {
        return (
            <div className="case">
                Case not found!
            </div>
        )
    }
    else {
        return (
            <div className="case">
                <h2>Case #{id}</h2>

                <div>Defendant: {caseData.defendant}</div>
                <div>Accusation: {caseData.accusation}</div>

                <div>Filed by <UserTag user_id={caseData.user_id} username={caseData.username} /></div>
                <div>Date filed: {new Date(caseData.created_at).toLocaleString()}</div>
                <div>Phase: {toTitleCase(caseData.phase)} <Countdown className='countdown' date={caseData.end} /></div>
    
                <nav>
                    <NavLink className="nav-link" to={`/cases/${id}/evidence`}> Evidence    </NavLink>
                    <NavLink className="nav-link" to={`/cases/${id}/arguments`}>Arguments   </NavLink>
                    <NavLink className="nav-link" to={`/cases/${id}/verdict`}>  Verdict     </NavLink>
                    <NavLink className="nav-link" to={`/cases/${id}/ruling`}>   Ruling      </NavLink>
                </nav>
                {element}
            </div>
        )
    }


}
export default Case;