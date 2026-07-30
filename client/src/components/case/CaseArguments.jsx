import { useEffect } from 'react'
import ArgumentCard from "../cards/ArgumentCard";
import Pagination from '../Pagination';
import { fetchCaseArguments } from "/src/api/cases"
import "./CaseArguments.css"

const CaseArguments = ({phaseDelta,   history, setHistory}) => {
    useEffect(()=>{
        (async ()=>{
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
        <div className="CaseArguments sub-content">
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