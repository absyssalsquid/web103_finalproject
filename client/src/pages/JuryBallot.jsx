import { useParams, useNavigate } from "react-router-dom";
import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'

import { voteJury, fetchCaseArguments } from "/src/api/cases.js"
import { getJuryAssignmentDetails } from "/src/api/jury.js"

import "./JuryDuty.css"

const VOTE_OPTIONS = [
    { value: 'GUILTY',                className: 'guilty',     label: 'Guilty' },
    { value: 'NOT_GUILTY',            className: 'not-guilty', label: 'Not Guilty' },
    { value: 'INSUFFICIENT_EVIDENCE', className: 'insuff-ev',  label: <>Insufficient<br/>Evidence</> },
]

function JuryDuty(){
    const nav = useNavigate();
    const {id} = useParams();
    const [assignmentDetails, setAssignmentDetails] = useState({
        case_id: null,
        vote: null,
        persuasive_args: []
    })
    const [vote, setVote] = useState(null)
    const [argumentsList, setArgumentsList] = useState([])
    const [citedArgIds, setCitedArgIds] = useState([])
    const [paneOpen, setPaneOpen] = useState(false)
    const [alertMsg, setAlertMsg] = useState('')
    // fetch info about jury assignment
    // ensure the user currently logged in matches the user assigned 

    useEffect(()=>{
        async function init(){
            if (id) {
                const res = await getJuryAssignmentDetails(Number(id))
                const data = await res.json()
                if (res.ok){
                    setAssignmentDetails(data)
                    if (data.vote) setVote(data.vote)
                    if (data.persuasive_args) setCitedArgIds(data.persuasive_args)

                    if (data.case_id) {
                        const argsRes = await fetchCaseArguments({})
                        if (argsRes.ok) setArgumentsList((await argsRes.json()).entries)
                    }
                }
                else{
                    setAlertMsg(data.error);
                }
            }
        }
        init()
    },[id])

    function toggleArg(argId) {
        setCitedArgIds((prev) =>
            prev.includes(argId) ? prev.filter((a) => a !== argId) : [...prev, argId]
        )
    }

    function removeArg(argId) {
        setCitedArgIds((prev) => prev.filter((a) => a !== argId))
    }

    async function handleVoteChange(e) {
        const newVote = e.target.value
        setVote(newVote)
        // TODO: confirm voteJury accepts a third arg for cited arguments —
        // if not yet supported server-side, this can be split into a
        // separate PATCH once #149's backend lands.
        await voteJury(id, newVote, citedArgIds)
        nav("/dashboard/jury-assignments")
    }

    let inner_content = null;

    if (!assignmentDetails.case_id){
        inner_content = (
            <div>Nice try, but this is not your jury assignment</div>
        )
    }

    else {
        inner_content = (
            <>
                <p>You have been assigned to</p>
                <div className="case-num"><Link to={`/cases/${assignmentDetails.case_id}`}>Case #{assignmentDetails.case_id}</Link></div>
                <p>Please review the case before making your decision.</p>

                <div className="options">
                    {VOTE_OPTIONS.map((opt) => (
                        <label key={opt.value} className={`option ${opt.className}`}>
                            <input
                                type="radio"
                                name="vote"
                                value={opt.value}
                                checked={vote === opt.value}
                                onChange={handleVoteChange}
                            />
                            <span className="option-text">{opt.label}</span>
                        </label>
                    ))}
                </div>

                <button type="button" className="cite-toggle" onClick={() => setPaneOpen(true)}>
                    + cite convincing arguments
                </button>

                {citedArgIds.length > 0 && (
                    <div className="cited-args">
                        {citedArgIds.map((argId) => {
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

                <p className="dim">You do not have to complete this form at this time. You can return to this page at any time to cast or change your vote, as long as the jury is still in session.</p>
            </>
        )
    }

    return (
        <div className="JuryDuty main-content">
            <form>
                {inner_content}
            </form>
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
                                        checked={citedArgIds.includes(arg.arg_id)}
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