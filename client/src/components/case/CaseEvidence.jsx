import { useEffect } from 'react'
import EvidenceCard from "../cards/EvidenceCard";
import Pagination from '../Pagination';
import { fetchCaseEvidence } from "/src/api/cases"

import "./CaseEvidence.css"


const CaseEvidence = ({phaseDelta, history, setHistory}) => {

    useEffect(()=>{
        (async ()=>{
            const res = await fetchCaseEvidence({page: history.page, limit: history.limit} )
            const data = await res.json()
            if (res.ok){
                setHistory((prev)=>({
                    ...prev,
                    last_page: data.last_page,
                    entries: data.entries
                }))
            }
            else {
                console.log(data.error)
            }
        })()
    }, [history.page, history.limit, setHistory])

    if (phaseDelta > 0)
        return (
            <div className="sub-content">
                <div className='minimal'>Phase not started yet.</div>
            </div>
        )

    const isActivePhase = phaseDelta == 0;

    return (
        <div className="CaseEvidence sub-content">
            <div className="evidence-container">
                {history.entries.length === 0 
                    ? <div className="minimal">No evidence submitted{isActivePhase && ' yet'}.</div> 
                    : history.entries.map((item) => 
                        <EvidenceCard key={item.evidence_id} 
                            data={item} 
                            isActivePhase={isActivePhase}/>
                      )}
            </div>
            <Pagination history={history} setHistory={setHistory}/>
        </div>
    )
}
export default CaseEvidence;