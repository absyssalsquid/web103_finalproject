import './CaseProvisional.css'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { reactProvisional } from '/src/api/reactions.js'

function Provisional({phaseDelta}){
    const {id} = useParams()

    const [voteState, setVoteState] = useState({
        UP: false,
        DOWN: false,
    })

    const isActivePhase = phaseDelta == 0;

    async function handleClick(val) {
        if (!isActivePhase) return;

        // toggle the clicked direction, clearing the other
        const new_voteState = {}
        for (const [k, v] of Object.entries(voteState)) {
            new_voteState[k] = (k === val) ? !v : false
        }
        setVoteState(new_voteState) // optimistic set

        // PUT the new value; a fully-cleared state means the vote was withdrawn
        const nullify = Object.values(new_voteState).every(x => x === false)
        const res = await reactProvisional(id, id, nullify ? null : val)
        const data = await res.json()
            console.log(data)

        if (res.ok) {
            // set to actual values confirmed by db
            setVoteState(new_voteState)
        }
        else{
            // reset vote
        }
    }

    if (phaseDelta < 0)
        return (
            <div className="sub-content">
                <div className='minimal'>Phase complete.</div>
            </div>
        )

    return (
        <div className="Provisional sub-content">
            <button className="option prosecute" value='UP' onClick={(e)=>handleClick(e.target.value)}>
                🔪 Prosecute
            </button>
            <button className="option defend" value='DOWN' onClick={(e)=>handleClick(e.target.value)}>
                🛡️ Defend 
            </button>
        </div>
    )
}

export default Provisional;