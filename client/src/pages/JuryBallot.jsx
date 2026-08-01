import { useParams, useNavigate } from "react-router-dom";
import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'

import { getJuryAssignmentDetails, voteJury } from "/src/api/jury.js"
import { fetchCaseArguments } from "/src/api/cases.js"

import "./JuryDuty.css"

const VOTE_OPTIONS = [
    { value: 'GUILTY',      className: 'guilty',     label: 'Guilty' },
    { value: 'NOT_GUILTY',  className: 'not-guilty', label: 'Not Guilty' },
]

function JuryDuty(){
    const nav = useNavigate();
    const {id} = useParams();

    const [loading, setLoading] = useState(true);
    const [alertMsg, setAlertMsg] = useState('')

    const [assignmentDetails, setAssignmentDetails] = useState({ case_id: null, vote: null, fav_args: [] })
    const [argumentsList, setArgumentsList] = useState([])
    const [paneOpen, setPaneOpen] = useState(false)

    useEffect(()=>{
        async function init(){
            if (id) {
                const res = await getJuryAssignmentDetails(Number(id))
                const data = await res.json()
                if (res.ok){
                    setAssignmentDetails(data)

                    if (data.case_id) {
                        const argsRes = await fetchCaseArguments({})
                        if (argsRes.ok) setArgumentsList((await argsRes.json()).entries)
                    }
                }
                else{
                    setAlertMsg(data.error);
                }
            }
            setLoading(false)
        }
        init()
    },[id])

    function toggleArg(argId) {
        setAssignmentDetails((prev) => ({
            ...prev,
            fav_args: prev.fav_args.includes(argId)
                ? prev.fav_args.filter((a) => a !== argId)
                : [...prev.fav_args, argId]
        }))
    }

    function removeArg(argId) {
        setAssignmentDetails((prev) => ({
            ...prev,
            fav_args: prev.fav_args.filter((a) => a !== argId)
        }))
    }

    async function handleSubmit (e) {
        e.preventDefault();
        const req_body = {...assignmentDetails}
        delete req_body.case_id

        const res = await voteJury(id, req_body)
        const data = await res.json()
        if (res.ok){
            setAlertMsg('Ballot received successfully.')
            setTimeout(() => nav("/dashboard/jury-assignments"), 1000)
        }
        else{
            setAlertMsg(data.error)
        }
    }

    function handleChange(e){
        if (alertMsg) setAlertMsg('')
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

    if (loading){
        return (
            <div className="main-content">
                <div className='minimal'>
                    <h1>Loading ballot...</h1>
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
                            {assignmentDetails.fav_args.map((argId) => {
                                const arg = argumentsList.find((a) => a.arg_id === argId)
                                if (!arg) return null
                                return (
                                    <div className="citation-row" key={argId}>
                                        <div>
                                            <div>"{arg.text}"</div>
                                            <div className="citation-sub">
                                                {arg.argument_tag?.toLowerCase()} — by {arg.username}
                                            </div>
                                        </div>
                                        <button type="button" onClick={() => removeArg(argId)}>remove ×</button>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    <div className="form-actions">
                        <button type="submit" >
                            Save
                        </button>
                        <button type="button" onClick={handleCancel}>
                            Cancel
                        </button>
                    </div>
                </form>

                <p className="dim">You do not have to complete your ballot at this time. You can return to this page at any time to cast or change your vote, as long as the jury is still in session.</p>
            </div>
            {alertMsg && <div className='error-msg'>{alertMsg}</div>}

            {paneOpen && (
                <div className="pullout-overlay" onClick={() => setPaneOpen(false)}>
                    <aside className="pullout-pane" onClick={(e) => e.stopPropagation()}>
                        <div className="pullout-header">
                            <div>
                                <h3>arguments</h3>
                                <small className="char-limit">select to cite, then close pane</small>
                            </div>
                            <button type="button" onClick={() => setPaneOpen(false)} aria-label="close pane">×</button>
                        </div>
                        <div className="pullout-list">
                            {argumentsList.map((arg) => (
                                <label className="pullout-item" key={arg.arg_id}>
                                    <input
                                        type="checkbox"
                                        checked={assignmentDetails.fav_args.includes(arg.arg_id)}
                                        onChange={() => toggleArg(arg.arg_id)}
                                    />
                                    <div>
                                        <div>"{arg.text}"</div>
                                        <div className="citation-sub">
                                            {arg.argument_tag?.toLowerCase()} — by {arg.username} — up {arg.up_votes}
                                        </div>
                                    </div>
                                </label>
                            ))}
                        </div>
                        <button type="button" onClick={() => setPaneOpen(false)}>
                            close pane
                        </button>
                    </aside>
                </div>
            )}
        </div>
    )
}

export default JuryDuty;