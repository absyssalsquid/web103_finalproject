import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams } from 'react-router-dom';

import ArgumentCard from "../cards/ArgumentCard";
import Pagination from '../Pagination';
import SearchBar from '../SearchBar';

import { fetchCaseArguments } from "/src/api/cases"

import "./CaseArguments.css"

const EV_ARG_SORT_MODES = [ 
    { value: 'newest', label: 'newest' }, 
    { value: 'oldest', label: 'oldest' }, 
    { value: 'best', label: 'best' }, 
    { value: 'worst', label: 'worst' }, 
]

const ARGUMENT_FILTER_MODES = [
    { value: 'all',         label: 'all'},
    { value: 'prosecution', label: 'prosecution'},
    { value: 'defense',     label: 'defense'},
]

const CaseArguments = ({phaseDelta, history, setHistory}) => {
    const {id: case_id} = useParams()

    const [loading, setLoading] = useState(true);
    const [isFirstRender, setFirstRender] = useState(true);
    
    const queryDB = useCallback(async (case_id, qParams) => {
        setLoading(true)
        const res = await fetchCaseArguments(case_id, qParams )
        const data = await res.json()
        if (res.ok){
            setHistory((prev)=>({
                ...prev,
                last_page: data.last_page,
                entries: data.entries,
                hasFetched: true
            }))
        }
        else {
            console.log(data.error)
        }
        setLoading(false)
        
    }, [setHistory]);

    useEffect(()=>{
         (() => {
            if (history.hasFetched && isFirstRender){
                setFirstRender(false)
                setLoading(false)
                return
            }
            queryDB(case_id, {
                page: history.page,
                limit: history.limit,
                sortBy: history.sortBy,
                filterBy: history.filterBy
            })
        })()
    }, [history.page, history.limit, history.sortBy, history.filterBy, history.hasFetched, queryDB])


    if (loading)
        return (
            <div className="sub-content">
                <div className='minimal'>Loading arguments...</div>
            </div>
        )

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
                <SearchBar
                    state={history}
                    setState={setHistory}
                    searchPlaceholder="Search evidence..."
                    filterOptions={ARGUMENT_FILTER_MODES}
                    sortOptions={EV_ARG_SORT_MODES}
                />
                {history.entries.length === 0
                    ? <div className="minimal">No arguments submitted{isActivePhase && ' yet'}.</div>
                    : history.entries.map((arg, index) => <ArgumentCard key={index} data={arg} />)}
            </div>
            <Pagination history={history} setHistory={setHistory}/>
        </div>
    )
}
export default CaseArguments;