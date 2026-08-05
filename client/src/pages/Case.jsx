import { useRoutes, useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

import Provisional from '../components/case/CaseProvisional'
import CaseEvidence from '../components/case/CaseEvidence'
import CaseArguments from '../components/case/CaseArguments'
import CaseVerdict from '../components/case/CaseVerdict'
import CaseRuling from '../components/case/CaseRuling'
import UserTag from '../components/UserTag'
import ColorPillTag from '../components/card_fragments/ColorPillTag'
import SubNav from '../components/SubNav'

import {fetchCase} from "/src/api/cases"
import {phaseDelta, formatDateTime } from '/src/utils'

import './Case.css'
import '/src/components/Spinner.css'

const redirects = {
    'PROVISIONAL':       'provisional',
    'DISCOVERY':         'evidence',
    'ARGUMENT':          'arguments',
    'JURY_DELIBERATION': 'verdict',
    'RULING':            'ruling',
    'CLOSED':            'ruling',
}

const TABS = [
    {value: 'PROVISIONAL'       , tab_title: 'Interest'  , route: 'provisional' },
    {value: 'DISCOVERY'         , tab_title: 'Evidence'  , route: 'evidence'    },
    {value: 'ARGUMENT'          , tab_title: 'Arguments' , route: 'arguments'   },
    {value: 'JURY_DELIBERATION' , tab_title: 'Verdict'   , route: 'verdict'     },
    {value: 'RULING'            , tab_title: 'Ruling'    , route: 'ruling'      },
    {value: 'CLOSED'            , tab_title: null        , route: 'ruling'      },
]

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
            const res = await fetchCase(id)
            const data = await res.json()
            if (res.ok){
                setCaseData(data)
                // immediately redirect to current active case phase (evidence, arguments, jury, verdict) based on case data
                nav(`/cases/${id}/${redirects[data.phase]}`) 
            }
            setLoading(false)
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
        { path: 'provisional',  element: <Provisional   phaseDelta={phaseDelta(caseData.phase, 'PROVISIONAL')}       caseData={caseData} setCaseData={setCaseData}  /> },
        { path: 'evidence',     element: <CaseEvidence  phaseDelta={phaseDelta(caseData.phase, 'DISCOVERY')}         history={evidenceHistoryData} setHistory={setEvidenceHistoryData} /> },
        { path: 'arguments',    element: <CaseArguments phaseDelta={phaseDelta(caseData.phase, 'ARGUMENT')}          history={argumentHistoryData} setHistory={setArgumentHistoryData} /> },
        { path: 'verdict',      element: <CaseVerdict   phaseDelta={phaseDelta(caseData.phase, 'JURY_DELIBERATION')} caseData={caseData} data={jurySummary} setData={setJurySummary}/> },
        { path: 'ruling',       element: <CaseRuling    phaseDelta={phaseDelta(caseData.phase, 'RULING')}            caseData={caseData} data={jurySummary} /> },
    ]);

    const availableTabs = TABS.filter((t) => phaseDelta(caseData.phase, t.value) <= 0 && t.tab_title)
    const subnavItems = availableTabs.map((t) => (
        {text: t.tab_title, href: `/cases/${id}/${t.route}` }
    ))

    if (loading) return (
        <div className="main-content">
            <div className='minimal'>
                <h1>Loading case...</h1>
                <div className='loader'></div>
            </div>
        </div>
    )
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
                    {caseData.image_url && (<img className='case-img' src={caseData.image_url}/>)}
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
                    items={subnavItems}
                />
                
                {child_element}
            </div>
        )
    }


}
export default Case;