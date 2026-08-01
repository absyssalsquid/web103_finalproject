import { useRoutes, useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

import Provisional from '../components/case/CaseProvisional'
import CaseEvidence from '../components/case/CaseEvidence'
import CaseArguments from '../components/case/CaseArguments'
import CaseVerdict from '../components/case/CaseVerdict'
import CaseRuling from '../components/case/CaseRuling'
import UserTag from '../components/UserTag'
import ColorPillTag from '../components/ColorPillTag'
import SubNav from '../components/SubNav'

import {fetchCase, fetchJurySummary} from "/src/api/cases"
import {phaseDelta, formatDateTime } from '/src/utils'
import {incrementCase} from "/src/api/cron"

import './Case.css'

const redirects = {
    'PROVISIONAL':       'provisional',
    'DISCOVERY':         'evidence',
    'ARGUMENT':          'arguments',
    'JURY_DELIBERATION': 'verdict',
    'RULING':            'ruling',
    'CLOSED':            'ruling',
}

const Case = () => {
    const { id } = useParams();
    const nav = useNavigate();
    const [loading, setLoading] = useState(true);

    const [caseData, setCaseData] = useState({}); 
    const [evidenceHistoryData, setEvidenceHistoryData] = useState({ hasFetched: false, page: 1, last_page: 1, limit: 20, entries: [], sortBy: 'best' })
    const [argumentHistoryData, setArgumentHistoryData] = useState({ hasFetched: false, page: 1, last_page: 1, limit: 20, entries: [], sortBy: 'best', filterBy: 'all'})
    const [jurySummary, setJurySummary] = useState({}); // contains count of current votes

    useEffect(() => {
        async function fetchData() {
            const responses = await Promise.all([
                fetchCase(id),
                fetchJurySummary(id)
            ])

            const data = await Promise.all(
                responses.map((item) => item.json()));
            
            // cron testing
            const newCaseData = (Object.keys(caseData).length === 0) 
                ? data[0] 
                : incrementCase(caseData, jurySummary);
            // console.log(newCaseData)
            
            console.log(data[1])
            
            setCaseData(newCaseData)
            setJurySummary(data[1]);
            setLoading(false);

            // immediately redirect to current active case phase (evidence, arguments, jury, verdict) based on case data
            nav(`/cases/${id}/${redirects[newCaseData.phase]}`) 
        }

        if (loading) fetchData(); 
    },[id, loading]);

    useEffect(() => {
        if (caseData.phase_end == null) return;
        const intervalId = setInterval(() => {
            if (Date.now() >= caseData.phase_end) {
                setLoading(true);
            }
        }, 1000); // Check every second

        // Cleanup interval on component unmount
        return () => clearInterval(intervalId);
    }, [caseData]);

    const child_element = useRoutes([
        { path: '/',            element: <></> },
        { path: 'provisional',  element: <Provisional   phaseDelta={phaseDelta(caseData.phase, 'PROVISIONAL')}          /> },
        { path: 'evidence',     element: <CaseEvidence  phaseDelta={phaseDelta(caseData.phase, 'DISCOVERY')}         history={evidenceHistoryData} setHistory={setEvidenceHistoryData} /> },
        { path: 'arguments',    element: <CaseArguments phaseDelta={phaseDelta(caseData.phase, 'ARGUMENT')}          history={argumentHistoryData} setHistory={setArgumentHistoryData} /> },
        { path: 'verdict',      element: <CaseVerdict   phaseDelta={phaseDelta(caseData.phase, 'JURY_DELIBERATION')} caseData={caseData} data={jurySummary} /> },
        { path: 'ruling',       element: <CaseRuling    phaseDelta={phaseDelta(caseData.phase, 'RULING')}            caseData={caseData} /> },
    ]);

    if (loading) {
        <div className="main-content">
            <div className='minimal'>
                <h1>Loading case...</h1>
            </div>
        </div>
    }
    else if (Object.keys(caseData).length === 0) {
        return (
            <div className="Case">
               <h1 className='minimal'>Case not found!</h1>
            </div>
        )
    }
    else {
        return (
            <div className="Case main-content">

                <div className='overview'>
                    <img className='case-img' src={caseData.image_url}/>
                    <div className='case-details'>
                        <UserTag 
                            user_id={caseData.user_id} 
                            username={caseData.username}
                            flair={caseData.flair_name} 
                            image_url={caseData.user_image_url}
                        />
                        <div>
                            <div className='case-num'>Case #{id}</div>
                            <div className='accused'>{caseData.object_name}</div>
                        </div>
                        <div className='accusation'>{caseData.accusation}</div>
                        <div className='date'>{formatDateTime(new Date(caseData.created_at))}</div>

                        <div>
                            <ColorPillTag phase={caseData.phase} phase_end={caseData.phase_end}/>
                        </div>
                    </div>
                </div>

                <SubNav 
                    items={[
                        {text: 'Provisional', href: `/cases/${id}/provisional` },
                        {text: 'Evidence'   , href: `/cases/${id}/evidence` },
                        {text: 'Arguments'  , href: `/cases/${id}/arguments` },
                        {text: 'Verdict'    , href: `/cases/${id}/verdict`},
                        {text: 'Ruling'     , href: `/cases/${id}/ruling`},
                    ]}
                />
                
                {child_element}
            </div>
        )
    }


}
export default Case;