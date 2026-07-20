import './CaseProvisional.css'
import { useState } from 'react'
import { voteProvisional } from '/src/api/cases'

function Provisional({data, phaseDelta}){
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
        console.log(new_voteState)

        // PUT the new value; a fully-cleared state means the vote was withdrawn
        const nullify = Object.values(new_voteState).every(x => x === false)
        const res = await voteProvisional({
            post_id: data.post_id,
            vote: nullify ? null : val,
        })

        if (res.ok) {
            setVoteState(new_voteState)
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
            <div className="option prosecute" value='' onClick={(e)=>handleClick(e.target.value)}>
                🔪 Prosecute
            </div>
            <div className="option defend" value='' onClick={(e)=>handleClick(e.target.value)}>
                🛡️ Defend 
            </div>
        </div>
    )
}

export default Provisional;