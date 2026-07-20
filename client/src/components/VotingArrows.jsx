import { useState } from 'react'
import "./VotingArrows.css"
import "/src/styles/Tooltip.css"
function VotingArrows({data, arrowVals, voteFn, currPhase}){

    const [voteState, setVoteState] = useState({
        UP: false,
        DOWN: false,
    })
    const votingActive = data.phase === currPhase

    async function handleClick(val) {
        if (!votingActive) return;
        // toggle the clicked direction, clearing the other
        const new_voteState = {}
        for (const [k, v] of Object.entries(voteState)) {
            new_voteState[k] = (k === val) ? !v : false
        }

        // PUT the new value; a fully-cleared state means the vote was withdrawn
        const nullify = Object.values(new_voteState).every(x => x === false)
        const res = await voteFn(
            data.id, 
            nullify ? null : val)

        if (res.ok) {
            setVoteState(new_voteState)
        }
    }

    // 🡅🡇
    return (
        <div className={"VotingArrows" + (votingActive ? ' active' : '')}>
            <div className='pair'>
                <div className={'tooltip arrow up' + (voteState.UP ? ' selected' : '')} onClick={() => handleClick('UP')}>
                    {arrowVals.up}
                    <span className='tooltiptext'>{arrowVals.up_tooltip}</span>
                </div>
                <div className="count">{data.up_count}</div>
            </div>
            <div className='pair'>
                <div className={'tooltip arrow down' + (voteState.DOWN ? ' selected' : '')} onClick={() => handleClick('DOWN')}>
                    {arrowVals.down}
                    <span className='tooltiptext'>{arrowVals.down_tooltip}</span>
                    
                </div>
                <div className="count">{data.down_count}</div>
            </div>
        </div>
    )
}

export default VotingArrows;