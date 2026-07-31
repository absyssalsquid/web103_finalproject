import { useParams, useNavigate } from "react-router-dom";
import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'

import { voteJury} from "/src/api/cases.js"
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
    const [vote, setVote] = useState({vote: null, args: []})
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
                }
                else{
                    setAlertMsg(data.error);
                }
            }
        }
        init()
    },[id])

    async function handleVoteChange(e) {
        const newVote = e.target.value
        setVote(newVote)
        // TODO: persist the vote to the backend for this jury assignment
        console.log('vote changed', newVote)
        voteJury(id, newVote)
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
        </div>
    )
}

export default JuryDuty;