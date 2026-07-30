import { useEffect, useCallback } from 'react'
import ArgumentCard from "../cards/ArgumentCard";
import Pagination from '../Pagination';
import NewArgument from './NewArgument';
import { fetchCaseArguments } from "/src/api/cases"
import "./CaseArguments.css"

const CaseArguments = ({phaseDelta, caseId, history, setHistory}) => {
    const loadArguments = useCallback(async () => {
        const res = await fetchCaseArguments({page: history.page, limit: history.limit} )
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
    }, [history.page, history.limit, setHistory])

    useEffect(()=>{
        loadArguments()
    }, [loadArguments])

    if (phaseDelta > 0)
        return (
            <div className="sub-content">
                <div className='minimal'>Phase not started yet.</div>
            </div>
        )

    const isActivePhase = phaseDelta == 0;

    return (
        <div className="CaseArguments sub-content">
            {isActivePhase &&
                <NewArgument caseId={caseId} onSubmitted={loadArguments} />
            }
            <div className="arguments-container">
                {history.entries.length === 0
                    ? <div className="minimal">No arguments submitted{isActivePhase && ' yet'}.</div>
                    : history.entries.map((arg, index) => <ArgumentCard key={index} data={arg} />)}
            </div>
            <Pagination history={history} setHistory={setHistory}/>
        </div>
    )
}
export default CaseArguments;