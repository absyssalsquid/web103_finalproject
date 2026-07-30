import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react'

import CaseCard from '../components/cards/CaseCard'
import Pagination from '../components/Pagination'
import SearchBar from '../components/SearchBar'
import { fetchCases } from "/src/api/cases"

import './Docket.css'

const PHASE_OPTIONS = [
    { value: 'ALL', label: 'All phases' },
    { value: 'ACTIVE', label: 'In progress' },
    { value: 'PROVISIONAL', label: '- Provisional' },
    { value: 'DISCOVERY', label: '- Discovery' },
    { value: 'ARGUMENT', label: '- Argument' },
    { value: 'JURY_DELIBERATION', label: '- Jury Deliberation' },
    { value: 'RULING', label: '- Ruling' },
    { value: 'ENDED', label: 'Ended' },
    { value: 'CLOSED', label: '- Closed' },
    { value: 'DISMISSED', label: '- Dismissed' },
]

const SORT_OPTIONS = [
    { value: 'newest', label: 'Newest' },
    { value: 'oldest', label: 'Oldest' },
    { value: 'popular', label: 'Popular' },
    { value: 'prosecute', label: 'Prosecute' },
    { value: 'defend', label: 'Defend' },
    { value: 'countdown', label: 'Countdown' },
    // { value: 'controversial', label: 'Controversial' },
]

const Docket = () => {
    const [loading, setLoading] = useState(true);
    
    const [caseHistory, setCaseHistory] = useState({
        search: '',
        filterBy: 'ALL',
        sortBy: 'newest',
        limit: 10,
        page: 1,
        last_page: 1,
        entries: []
    });

    useEffect(() => {
        (async () => {
            const queryParams = {
                filterBy: caseHistory.filterBy,
                sortBy: caseHistory.sortBy,
                limit: caseHistory.limit,
                page: caseHistory.page
            }
            const res = await fetchCases(queryParams)
            const data = await res.json()
            if (res.ok){
                setCaseHistory((prev)=>({
                    ...prev,
                    last_page: data.last_page,
                    entries: data.entries
                }))
            }
            else{
                console.log(data.error)
            }
            setLoading(false);
        })();
    }, [caseHistory.filterBy, caseHistory.sortBy, caseHistory.limit, caseHistory.page, setCaseHistory]);

    if (loading) {
        return (
            <div className="main-content">
                <div className='minimal'>
                    <h1>Loading docket...</h1>
                </div>
            </div>
        )
    }

    return (
        <div className="Docket main-content">
            <SearchBar
                state={caseHistory}
                setState={setCaseHistory}
                searchPlaceholder="Search cases..."
                filterOptions={PHASE_OPTIONS}
                sortOptions={SORT_OPTIONS}
            />

            <div className='case-container'>
                {caseHistory.entries.length === 0
                    ? (<div className='minimal'><h2>No cases match your search.</h2></div>)
                    : (caseHistory.entries.map((el) => (
                        <CaseCard key={el.case_id} data={el} />
                       )))
                }
            </div>

            <Pagination history={caseHistory} setHistory={setCaseHistory} />

            <Link to='/new-case' className='submit-case'>
                + submit case
            </Link>
        </div>
    )
}

export default Docket;