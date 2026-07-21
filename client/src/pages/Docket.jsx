import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react'
import CaseCard from '../components/cards/CaseCard'
import {SAMPLE_CASE} from "/src/api/test_data"

import './Docket.css'

const PHASE_OPTIONS = [
    { value: 'ACTIVE', label: 'In progress' },
    { value: 'PROVISIONAL', label: '- Provisional' },
    { value: 'DISCOVERY', label: '- Discovery' },
    { value: 'ARGUMENT', label: '- Argument' },
    { value: 'JURY_DELIBERATION', label: '- Jury Deliberation' },
    { value: 'RULING', label: '- Ruling' },
    { value: 'CLOSED', label: 'Closed' },
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

const SAMPLE_CASES = [
    {...SAMPLE_CASE, case_id: 1, phase: 'PROVISIONAL',       },
    {...SAMPLE_CASE, case_id: 2, phase: 'ARGUMENT',          },
    {...SAMPLE_CASE, case_id: 3, phase: 'JURY_DELIBERATION', },
    {...SAMPLE_CASE, case_id: 4, phase: 'CLOSED',            },
    {...SAMPLE_CASE, case_id: 5, phase: 'DISCOVERY',         },
    {...SAMPLE_CASE, case_id: 6, phase: 'RULING',            },
]

const net = (c) => (c.up_count ?? 0) - (c.down_count ?? 0)
const total = (c) => (c.up_count ?? 0) + (c.down_count ?? 0)

const SORTERS = {
    newest: (a, b) => b.case_id - a.case_id,
    oldest: (a, b) => a.case_id - b.case_id,
    prosecute: (a, b) => net(b) - net(a),
    defend: (a, b) => net(a) - net(b),
    popular: (a, b) => total(b) - total(a),
    countdown: (a, b) => a.phase_end - b.phase_end, // soonest phase deadline first
    controversial: (a, b) => // closest up/down split (relative to volume) first
        Math.abs(net(a)) / (total(a) || 1) - Math.abs(net(b)) / (total(b) || 1),
}

const Docket = () => {
    const [loading, setLoading] = useState(true);
    const [cases, setCases] = useState([]);

    const [query, setQuery] = useState('');
    const [phaseFilter, setPhaseFilter] = useState('');
    const [sortBy, setSortBy] = useState('newest');

    useEffect(() => {
        async function fetchData() {
            setCases(SAMPLE_CASES);
            setLoading(false);
        }

        fetchData();
    },[loading]);

    const visibleCases = useMemo(() => {
        const q = query.trim().toLowerCase();
        return cases
            .filter((c) => {
                if (!phaseFilter) return true;
                // "Active" = any case still in progress (not yet closed)
                if (phaseFilter === 'ACTIVE') return c.phase !== 'CLOSED';
                return c.phase === phaseFilter;
            })
            .filter((c) => {
                if (!q) return true;
                return (
                    c.object_name?.toLowerCase().includes(q) ||
                    c.accusation?.toLowerCase().includes(q)
                );
            })
            .sort(SORTERS[sortBy] ?? SORTERS.newest);

        // this will eventually be replaced with an api call to only return cases that match params
    }, [cases, query, phaseFilter, sortBy]);

    if (loading) {
        return (
            <div className="docket main-content">
                Loading docket...
            </div>
        )
    }

    return (
        <div className="docket main-content">
            <div className='search-bar'>
                <input
                    type='search'
                    className='search-input'
                    placeholder='Search cases...'
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />

                <label className='control'>
                    {/* <span>Phase</span> */}
                    <select value={phaseFilter} onChange={(e) => setPhaseFilter(e.target.value)}>
                        <option value=''>All phases</option>
                        {PHASE_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                </label>

                <label className='control'>
                    {/* <span>Sort</span> */}
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                        {SORT_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                </label>

                
            </div>

            <div className='case-container'>
                {visibleCases.length === 0 ? (
                    <p className='empty'>No cases match your search.</p>
                ) : (
                    visibleCases.map((el) => (
                        <CaseCard key={el.case_id} data={el} />
                    ))
                )}
            </div>

            <Link to='/new-case' className='submit-case'>
                + submit case
            </Link>
        </div>
    )
}

export default Docket;