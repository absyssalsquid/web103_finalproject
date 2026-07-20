import { useParams, useNavigate } from "react-router-dom";
import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Countdown from 'react-countdown';

import {LIMITS} from "/src/api/limits"
import { getNextOccurrence } from "/src/utils"
import {getJuryCaseAssignment, getNewJuryAssignment, voteJury} from "/src/api/cases.js"

import "./JuryDuty.css"

const VOTE_OPTIONS = [
    { value: 'GUILTY',                className: 'guilty',     label: 'Guilty' },
    { value: 'NOT_GUILTY',            className: 'not-guilty', label: 'Not Guilty' },
    { value: 'INSUFFICIENT_EVIDENCE', className: 'insuff-ev',  label: <>Insufficient<br/>Evidence</> },
]

function JuryDuty(){
    const nav = useNavigate();
    const {id} = useParams();
    const [caseID, setCaseID] = useState(null)
    const [vote, setVote] = useState(null)
    // fetch info about jury assignment
    // ensure the user currently logged in matches the user assigned 

    useEffect(()=>{
        async function init(){
            if (id) {
                const res = await getJuryCaseAssignment(1, parseInt(id))
                setCaseID(res)
            }
        }
        init()
    },[id])

    async function handleNew(e) {
        e.preventDefault()
        const res = await getNewJuryAssignment();
        console.log (res)
        if (res) nav(`${res}`)
    }

    async function handleVoteChange(e) {
        const newVote = e.target.value
        setVote(newVote)
        // TODO: persist the vote to the backend for this jury assignment
        console.log('vote changed', newVote)
        voteJury(id, newVote)
        nav("/dashboard/jury-assignments")
    }

    let inner_content = null;
    if (!id) {
        inner_content = (
            <>
                <h2>Do you want to serve on a jury?</h2>
                <p>You have {3} jury summons remaining. Today's jury summons expire in <Countdown date={getNextOccurrence(LIMITS.REFRESH_TIME)}/></p>
                <button type="submit" onClick={handleNew} className="respond">Respond to jury summons</button>
            </>
        )   
        
    }
    else if (!caseID){
        inner_content = (
            <div>Nice try, but this is not your jury assignment</div>
        )
    }

    else {
        inner_content = (
            <>
                <p>You have been assigned to</p>
                <div className="case-num"><Link to={`/cases/${caseID}`}>Case #{caseID}</Link></div>
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
        </div>
    )
}

export default JuryDuty;