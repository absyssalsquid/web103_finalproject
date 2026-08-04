import { useEffect, useState } from "react"
import {fetchJurySummary} from "/src/api/cases"

import "./CaseVerdict.css"

const VT_MAP = {
    'GUILTY': 'Guilty', 
    'NOT_GUILTY': 'Not Guilty',
    'TB_PECKED_AT': 'To Be Pecked At Later...',
    null: '???'
}

const CaseVerdict = ({phaseDelta, caseData, data, setData}) => {
    const [loading, setLoading] = useState(true);
    const isActivePhase = phaseDelta == 0;

    useEffect(()=>{
        async function loadJurySummary(){
            if (!caseData?.case_id) return // wait until get data
        
            if (Object.keys(data).length !== 0) { // already loaded
                setLoading(false)
                return
            } 
            const res = await fetchJurySummary(caseData.case_id)
            const dat = await res.json()
            console.log(dat)
            setData(dat)
            setLoading(false)
        }
            
        loadJurySummary()
    },[caseData, setData, data, setLoading])

    if (phaseDelta > 0)
    return (
        <div className="sub-content">
            <div className='minimal'>Phase not started yet.</div>
        </div>
    )

    else if (loading) return (
        <div className="sub-content">
            <div className='minimal'>
                <div>Loading jury data...</div>
                <div className='loader'></div>
            </div>
        </div>
    )

    
    // if case still in jury phase, show juror count and coundown. do NOT show breakdown
    if (isActivePhase) 
    return (
        <div className="sub-content">
            <div className="minimal">
                <h2>Jury still in session</h2>
                {data.total === 1
                    ? (<div>{data.total} juror has voted</div>)
                    : (<div>{data.total} jurors have voted</div>)
                }
            </div>
        </div>
    )

    // show jury votes breakdown (not showing individual juror votes) and final verdict
    return(
        <div className="CaseVerdict sub-content">

            {(data.total === 0) && (<div className="header">No jurors showed up for this case...</div>)}
            
            <div className="card">
                <table>
                    <thead>
                        <tr>
                            <th className="text-left">Vote</th>
                            <th className="text-right">Count</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Guilty</td>
                            <td className="text-right">{data.breakdown.GUILTY}</td>
                        </tr>
                        <tr>
                            <td>Not Guilty</td>
                            <td className="text-right">{data.breakdown.NOT_GUILTY}</td>
                        </tr>
                        <tr className='summary'>
                            <td>Total</td>
                            <td className="text-right">{data.total}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="conclusion">
                <div>Verdict</div>
                <div className="verdict">{VT_MAP[caseData.verdict]}</div>
            </div>
        </div>
    )

    
}
export default CaseVerdict;