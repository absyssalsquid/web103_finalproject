import { useRoutes, useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

import Provisional from '../components/case/CaseProvisional'
import CaseEvidence from '../components/case/CaseEvidence'
import CaseArguments from '../components/case/CaseArguments'
import CaseVerdict from '../components/case/CaseVerdict'
import CaseRuling from '../components/case/CaseRuling'
import UserTag from '../components/UserTag'
import ColorPillTag from '../components/ColorPillTag'

import {phaseDelta, nextPhase, formatDateTime } from '/src/utils'
import {dateWithDelta} from "/src/api/test_data"
import {fetchCaseData, fetchCaseArguments, fetchCaseEvidence, fetchJurySummary} from "/src/api/cases"

import './Case.css'
import SubNav from '../components/SubNav'

const redirects = {
    'PROVISIONAL':       'provisional',
    'DISCOVERY':         'evidence',          
    'ARGUMENT':          'arguments',         
    'JURY_DELIBERATION': 'verdict',                   
    'RULING':            'ruling',  
    'CLOSED':            'ruling',  
}

function incrementCase(caseData, jurySummary){
    // for the purposes of testing, calculated here
    // TODO: create api for this

    var newCaseData = {
        ...caseData,
        phase: nextPhase(caseData.phase),
        phase_start: caseData.phase_end,
        phase_end: dateWithDelta({seconds:2}, caseData.phase_end)
    }

    if (caseData.phase == 'JURY_DELIBERATION'){
        // tally votes
        let maxKey = null;
        let maxValue = 0;
        for (const [key, value] of Object.entries(jurySummary.breakdown)) {
            if (value > maxValue) {
                maxValue = value;
                maxKey = key;
            }
        }
        newCaseData.verdict = maxKey;
    }
    else if (caseData.phase == 'RULING'){
        caseData.ruling = 'New judge ruling!!!'
        newCaseData.phase_end = null;
    }
    return newCaseData;
}

const Case = () => {
    const { id } = useParams();
    const nav = useNavigate();
    const [loading, setLoading] = useState(true);

    const [caseData, setCaseData] = useState({}); 
    const [cArguments, setArguments] = useState([]);
    const [evidence, setEvidence] = useState([]);
    const [jurySummary, setJurySummary] = useState({}); // contains count of current votes

    useEffect(() => {
        async function fetchData() {
            console.log('fetching data')

            const completeCaseResponse = await Promise.all([
                fetchCaseData(id),
                fetchCaseEvidence(id),
                fetchCaseArguments(id),
                fetchJurySummary(id)
            ])

            const completeCaseData = completeCaseResponse;
            // const completeCaseData = await Promise.all(completeCaseResponse.map((item) => item.json()));
            
            const newCaseData = (Object.keys(caseData).length === 0) ? completeCaseData[0] : incrementCase(caseData, jurySummary);
            // console.log(newCaseData)
            
            setCaseData(newCaseData)
            setEvidence(completeCaseData[1]);
            setArguments(completeCaseData[2]);
            setJurySummary(completeCaseData[3]);

            setLoading(false);

            nav(`/cases/${id}/${redirects[newCaseData.phase]}`) // immediately redirect to current active case phase (evidence, arguments, jury, verdict) based on case data
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

    const element = useRoutes([
        { path: '/',            element: <></> },
        { path: 'provisional',  element: <Provisional   phaseDelta={phaseDelta(caseData.phase, 'PROVISIONAL')} /> },
        { path: 'evidence',     element: <CaseEvidence  phaseDelta={phaseDelta(caseData.phase, 'DISCOVERY')}           caseData={caseData} data={evidence} /> },
        { path: 'arguments',    element: <CaseArguments phaseDelta={phaseDelta(caseData.phase, 'ARGUMENT')}            caseData={caseData} data={cArguments} /> },
        { path: 'verdict',      element: <CaseVerdict   phaseDelta={phaseDelta(caseData.phase, 'JURY_DELIBERATION')}   caseData={caseData} data={jurySummary} /> },
        { path: 'ruling',       element: <CaseRuling    phaseDelta={phaseDelta(caseData.phase, 'RULING')}              caseData={caseData} /> },
    ]);

    if (loading) {
        return (
            <div className="Case">
               <div className='minimal'>Loading...</div>
            </div>
        )
    }
    else if (caseData == {}) {
        return (
            <div className="Case">
               <div className='minimal'>Case not found!</div>
            </div>
        )
    }
    else {
        return (
            <div className="Case main-content">

                <div className='overview'>
                    <img className='case-img' src={caseData.image_url}/>
                    <div className='text'>
                        <div className='file-info'>
                            <UserTag 
                                user_id={caseData.user_id} 
                                username={caseData.username}
                                image_url={caseData.user_image_url}
                                date={formatDateTime(caseData.created_at)}
                            />
                        </div>
                        <div className='case-num'>Case #{id}</div>
                        <div className='accused'>{caseData.object_name}</div>
                        <div className='accusation'>{caseData.accusation}</div>

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
                
                {element}
            </div>
        )
    }


}
export default Case;