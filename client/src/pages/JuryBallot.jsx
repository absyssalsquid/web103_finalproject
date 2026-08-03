import { useParams, useNavigate } from "react-router-dom";
import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'

import Pagination from '../components/Pagination'
import ToastMessage from "../components/ToastMessage"
import { useAuthContext } from '/src/contexts/auth'

import { getJuryAssignmentDetails, voteJury } from "/src/api/jury.js"
import { fetchCaseArguments } from "/src/api/cases.js"

import "./JuryDuty.css"

const VOTE_OPTIONS = [
    { value: 'GUILTY',      className: 'guilty',     label: 'Guilty' },
    { value: 'NOT_GUILTY',  className: 'not-guilty', label: 'Not Guilty' },
]

function JuryDuty(){
    const {id} = useParams();
    const nav = useNavigate();
    const { isAuthenticated, isAuthLoading } = useAuthContext();

    const [loading, setLoading] = useState(true);
    const [loadingData, setLoadingData] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [isExpired, setExpired] = useState(true)

    const [toastMsg, setToastMsg] = useState({message: '', type:'', key: null})

    const [assignmentDetails, setAssignmentDetails] = useState({ case_id: null, expires_at: null, vote: null, fav_args: [] })

    const [argumentHistory, setArgumentHistory] = useState({limit: 10, page: 1, last_page: 1, filterBy: 'all', sortBy:'best', entries: []})
    const [citedArgumentData, setCitedArgumentData] = useState({})

    const [paneOpen, setPaneOpen] = useState(false)

    useEffect(()=>{
        async function init(){
            if (id && isAuthenticated) {
                const res = await getJuryAssignmentDetails(Number(id))
                const data = await res.json()
                if (res.ok){
                    setAssignmentDetails(data)
                    setExpired(Date.now() > new Date(data.expires_at))
                    console.log(data)
                    const queryParams = {
                        limit: argumentHistory.limit,
                        page: argumentHistory.page,
                        filterBy: argumentHistory.filterBy,
                        sortBy: argumentHistory.sortBy,
                    }

                    if (data.case_id) {
                        const argsRes = await fetchCaseArguments(data.case_id, queryParams)
                        if (argsRes.ok) {
                            const data2 = await argsRes.json()
                            setArgumentHistory(prev => ({
                                ...prev,
                                ...data2
                            }))
                        }
                    }
                }
                else{
                    setToastMsg({message: data.error, type: 'error', key: Date.now()});
                }
            }
            setLoading(false)
        }
        init()
    },[])

    useEffect(() => {
        (async () => {
            if (loading) return
            setLoadingData(true);
            const queryParams = {
                limit: argumentHistory.limit,
                page: argumentHistory.page,
                filterBy: argumentHistory.filterBy,
                sortBy: argumentHistory.sortBy,
            }

            setArgumentHistory((prev)=>({ // hide pagination
                ...prev,
                last_page: 1,
            }))
            
            console.log(assignmentDetails.case_id, queryParams)
            const res = await fetchCaseArguments(assignmentDetails.case_id, queryParams)
            const data = await res.json()
            if (res.ok){
                setArgumentHistory((prev)=>({
                    ...prev,
                    last_page: data.last_page,
                    entries: data.entries
                }))
            }
            else{
                console.log(data.error)
            }
            setLoadingData(false);
        })();
    }, [loading, assignmentDetails.case_id, argumentHistory.filterBy, argumentHistory.sortBy, argumentHistory.limit, argumentHistory.page, setArgumentHistory]);

    function toggleArg(argId) {
        setAssignmentDetails((prev) => ({
            ...prev,
            fav_args: prev.fav_args.includes(argId)
                ? prev.fav_args.filter((a) => a !== argId)
                : [...prev.fav_args, argId]
        }))

        const cache = {...citedArgumentData}
        if (argId in citedArgumentData){
            delete cache[argId]
        } else{
            const entry = argumentHistory.entries.filter((a)=> a.arg_id == argId)
            cache[argId] = entry[0]
        }
        setCitedArgumentData(cache)
    }

    function removeArg(argId) {
        setAssignmentDetails((prev) => ({
            ...prev,
            fav_args: prev.fav_args.filter((a) => a !== argId)
        }))
        const cache = {...citedArgumentData}
        delete cache[argId]
        setCitedArgumentData(cache)
    }

    async function handleSubmit (e) {
        e.preventDefault();
        setSubmitting(true)

        const req_body = {...assignmentDetails}
        delete req_body.case_id

        const res = await voteJury(id, req_body)
        const data = await res.json()
        if (res.ok){
            setToastMsg({message: 'Ballot received successfully.', type: 'success', key: Date.now()})
            setTimeout(() => nav("/dashboard/jury-assignments"), 1500)
        }
        else{
            setToastMsg({message: data.error, type: 'error', key: Date.now()})
        }
        setSubmitting(false)
    }

    function handleChange(e){
        const currVote = e.target.value
        setAssignmentDetails((prev)=>({
            ...prev,
            vote: currVote === prev.vote ? null : currVote
        }))
    }

    const handleCancel = (e) => {
        e.preventDefault();
        nav("/dashboard/jury-assignments")
    }

    if (loading || isAuthLoading){
        return (
            <div className="main-content">
                <div className='minimal'>
                    <h1>Loading ballot...</h1>
                </div>
            </div>
        )
    }

    if (!isAuthenticated){
        return (
            <div className="main-content">
                <div className='minimal'>
                    <h1><Link to="/sign-in">Sign in</Link> to participate in a jury.</h1>
                </div>
            </div>
        )
    }

    if (!assignmentDetails.case_id){
        return (
            <div className="main-content">
                <div className='minimal'>
                    <h1>You are not part of this jury pool.</h1>
                </div>
            </div>
        )
    }

    return (
        <div className="JuryDuty main-content">
            <ToastMessage message={toastMsg.message} type={toastMsg.type} key={toastMsg.key}/>

            <div className="card">
                <p>You have been assigned to</p>
                <div className="case-num"><Link to={`/cases/${assignmentDetails.case_id}`}>Case #{assignmentDetails.case_id}</Link></div>
                <p>Please review the case before making your decision.</p>

                <form onSubmit={handleSubmit}>
                    <div className="options-container">
                        {VOTE_OPTIONS.map((opt) => (
                            <label key={opt.value} className={`option ${opt.className}`}>
                                <input
                                    type="radio"
                                    name="vote"
                                    value={opt.value}
                                    checked={assignmentDetails.vote === opt.value}
                                    onClick={handleChange}
                                    onChange={(e)=>(e)}
                                />
                                <span className="option-text">{opt.label}</span>
                            </label>
                        ))}
                    </div>

                    <button type="button" className="cite-toggle" onClick={() => setPaneOpen(true)}>
                        + cite convincing arguments
                    </button>

                    {assignmentDetails.fav_args.length > 0 && (
                        <div className="cited-args">
                            {Object.entries(citedArgumentData).map(([arg_id, arg])=>(
                                <div className="citation-row" key={`arg-${arg_id}`}>
                                    <div>
                                        <div>"{arg.text}"</div>
                                        <div className="citation-sub">
                                            {arg.argument_tag?.toLowerCase()} — by {arg.username}
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => removeArg(arg_id)} className="remove-citation">✖</button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="form-actions">
                        <button type="submit" disabled={isExpired || submitting}>
                            {submitting ? "Submitting..." : "Save"}
                        </button>
                        <button type="button" onClick={handleCancel}>
                            Cancel
                        </button>
                    </div>
                </form>

                <p className="dim">You do not have to complete your ballot at this time. You can return to this page at any time to cast or change your vote, as long as the jury is still in session.</p>
            </div>

            <div className={`pullout-overlay ${paneOpen ? 'open':''}`} onClick={() => setPaneOpen(false)} >
            </div>

            <aside className={`pullout-pane ${paneOpen ? 'open':''}`} onClick={(e) => e.stopPropagation()} >
                <button type="button" onClick={() => setPaneOpen(false)} aria-label="close pane" className="close-pane">✖</button>
                <div className="pullout-header">
                    <div>
                        <h2>arguments</h2>
                        <small className="char-limit">select to cite</small>
                    </div>
                </div>
                <div className="pullout-list">
                    {loadingData ? (<div className="minimal"><div>Loading arguments...</div></div>) :
                    
                    
                    
                    argumentHistory.entries.map((arg) => (
                        <label className="pullout-item" key={arg.arg_id}>
                            <input
                                type="checkbox"
                                checked={assignmentDetails.fav_args.includes(arg.arg_id)}
                                onChange={() => toggleArg(arg.arg_id)}
                            />
                            <div>
                                <div>"{arg.text}"</div>
                                <div className="citation-sub">
                                    <div>{arg.argument_tag?.toLowerCase()}</div> — 
                                    <div>by {arg.username}</div> — 
                                    <div>+{arg.up_votes} / -{arg.down_votes}</div>
                                </div>
                            </div>
                        </label>
                    ))}
                </div>

                <Pagination history={argumentHistory} setHistory={setArgumentHistory} />

                <button type="button" onClick={() => setPaneOpen(false)}>
                    close pane
                </button>
            </aside>
        </div>
    )
}

export default JuryDuty;