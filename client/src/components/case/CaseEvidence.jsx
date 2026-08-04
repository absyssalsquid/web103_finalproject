import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom';

import EvidenceCard from "../cards/EvidenceCard";
import Pagination from '../Pagination';
import ProgressBar from '/src/components/ProgressBar'
import UserTag from '../UserTag';
import SearchBar from '../SearchBar';
import ToastMessage from "/src/components/ToastMessage"

import { getUsage } from '/src/api/me'
import { getUserLimits, getLengthLimits } from '/src/api/rules'
import { fetchCaseEvidence, submitEvidence } from "/src/api/cases"

import { useAuthContext } from '/src/contexts/auth'

import "./CaseEvidence.css"

const EV_ARG_SORT_MODES = [ 
    { value: 'newest', label: 'newest' }, 
    { value: 'oldest', label: 'oldest' }, 
    { value: 'best', label: 'best' }, 
    { value: 'worst', label: 'worst' }, 
]

const CaseEvidence = ({phaseDelta, history, setHistory}) => {
    const {id: case_id} = useParams()
    const { user, isAuthenticated, isAuthLoading} = useAuthContext()
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [loadingEvidence, setLoadingEvidence] = useState(true);
    const [isFirstRender, setFirstRender] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [formActive, setFormActive] = useState(false)
    const [evidenceSubmission, setEvidenceSubmission] = useState({case_id: case_id, text: ''})
    const [toastMsg, setToastMsg] = useState({message: '', type:''})

    const [userLimits, setUserLimits] = useState({})
    const [lengthLimits, setLengthLimits] = useState({})
    const [usage, setUsage] = useState({ jury_assignments: null, cases: null, evidence: null, arguments: null })

    const limitReached = usage.evidence >= userLimits.evidence
    const isActivePhase = phaseDelta == 0;

    useEffect(() => {
        async function fetchData(){
            const res = await Promise.all([
                getUserLimits(),
                getLengthLimits(),
            ])

            const data = await Promise.all(
                res.map((item) => item.json()))

            setUserLimits(data[0])
            setLengthLimits(data[1])
            setLoading(false)
        }
        fetchData();
    }, []);

    useEffect(() => {
        if (!isAuthenticated) return
        async function fetchData(){
            const res = await getUsage()
            if (res.ok){
                const data = await res.json()
                setUsage(data)
            }
        }
        fetchData();
    }, [isAuthenticated]);

    const queryDB = useCallback(async (case_id, qParams) => {
        if (phaseDelta > 0){
            setLoadingEvidence(false)
            return
        } 
        console.log("querying db")
        setLoadingEvidence(true)
        const res = await fetchCaseEvidence(case_id, qParams )
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
        setLoadingEvidence(false)
        
    }, [setHistory]);

    useEffect(()=>{
        (() => {
            if (history.hasFetched && isFirstRender){
                setFirstRender(false)
                setLoadingEvidence(false)
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

    function patchVoteCounts(idx, newVoteCounts){
        setHistory((prev) => {
            const newEntry = {
                ...prev.entries[idx],
                ...newVoteCounts
            }
            const newEntries = prev.entries.with(idx, newEntry)

            return{
                ...prev,
                entries: newEntries
            }
        });
    }

    function handleChange(e){
        setEvidenceSubmission((prev) => ({...prev, text: e.target.value}))
    }

    async function handleSubmit(e){
        e.preventDefault()
        setSubmitting(true)
        const res = await submitEvidence(evidenceSubmission)
        const data = await res.json()
        if (res.ok){
            setToastMsg({message: "Evidence sucessfully submitted.", type: 'success', key: Date.now()})
            setTimeout(() => navigate(0), 1700);
        }
        else {
            setToastMsg({message: data.error, type: 'error', key: Date.now()})
            setSubmitting(false)
        }
    }

    async function handleCancel(e){
        e.preventDefault()
        setFormActive(false)
    }

    
    if (loading || isAuthLoading || loadingEvidence)
        return (
            <div className="sub-content">
                <div className='minimal'>
                    <div>Loading evidence...</div>
                    <div className='loader'></div>
                </div>
            </div>
        )

    if (phaseDelta > 0)
        return (
            <div className="sub-content">
                <div className='minimal'>Phase not started yet.</div>
            </div>
        )

    return (
        <div className="CaseEvidence sub-content">
            <ToastMessage message={toastMsg.message} type={toastMsg.type} key={toastMsg.key}/>

            <div className="evidence-container">
            <SearchBar
                state={history}
                setState={setHistory}
                searchPlaceholder="Search evidence..."
                filterOptions={null}
                sortOptions={EV_ARG_SORT_MODES}
            />

            {history.entries.length === 0 
                ? <div className="minimal">No evidence submitted{isActivePhase && ' yet'}.</div> 
                : history.entries.map((item, index) =>
                    <EvidenceCard key={item.evidence_id}
                        idx={index}
                        data={item}
                        isActivePhase={isActivePhase}
                        patchVoteCounts={patchVoteCounts}
                        isOwned={isAuthenticated && item.user_id === user.user_id}
                        lengthLimits={{min: lengthLimits.evidence_min, max: lengthLimits.evidence_max}}
                        />
                    )}
            </div>
            <Pagination history={history} setHistory={setHistory}/>

            <button 
              className={`action ${(formActive || phaseDelta!=0)?'hidden':''}`} 
              disabled={phaseDelta!=0}
              onClick={()=>{setFormActive(true)}}>
                + submit evidence
            </button>
            

            {/* ------------------------- submission form  ------------------------- */}

            <form onSubmit={handleSubmit} className={`pullup-panel ${(!formActive || phaseDelta!=0) ?'hidden':''}`}>
                <button className='close' onClick={handleCancel}>✖</button>

                <div className='title'>Submit evidence</div>
                    
                <div className='head-row'>
                    {isAuthenticated && (<UserTag 
                        username={user.username} 
                        flair={user.flair_name} 
                        image_url={user.image_url}
                        linkDisabled={true}/>)}
                    <div className='flex-grow'></div>
                    <button type='submit' disabled={submitting || !isAuthenticated || phaseDelta!=0 || limitReached}>
                            {submitting ? "submitting..." : "submit"}
                    </button>
                </div>

                <textarea
                    className='evidence'
                    name="evidence"
                    type="text"
                    value={evidenceSubmission.text}
                    minLength={lengthLimits.evidence_min}
                    maxLength={lengthLimits.evidence_max}
                    onChange={handleChange}
                    placeholder="what did you see..."
                    rows={4}
                    required
                />
                <small className="char-limit">{evidenceSubmission.text.length}/{lengthLimits.evidence_max}</small>

                <ProgressBar
                    label="Daily evidence submissions"
                    value={usage.evidence !== null ? usage.evidence : '???'}
                    limit={userLimits.evidence}
                    limit_message={"You've reached your daily evidence submission limit."}
                />
            </form>
        </div>
    )
}
export default CaseEvidence;