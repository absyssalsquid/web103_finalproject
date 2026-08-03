import "./VotingArrows.css"
import "/src/styles/Tooltip.css"

function VotingArrows({data, arrowVals, voteFn, isActive, patchVoteCounts}){
    const voteState = {
        UP: data.reaction==='UP',
        DOWN: data.reaction==='DOWN',
    }

    async function handleClick(val) {
        if (!isActive) return;
        // toggle the clicked direction, clearing the other

        const newVoteState = {}
        for (const [k, v] of Object.entries(voteState))
            newVoteState[k] = (k === val) ? !v : false
        const nullify = Object.values(newVoteState).every(x => x === false)
        const newReaction = nullify ? null : val

        // optimistic set
        const upDelta   = (newVoteState.UP  ) - (voteState.UP  );
        const downDelta = (newVoteState.DOWN) - (voteState.DOWN);

        patchVoteCounts(data.idx, {
            reaction:   newReaction, 
            up_votes:   data.up_votes + upDelta,
            down_votes: data.down_votes + downDelta
        })

        // PUT the new value; a fully-cleared state means the vote was withdrawn
        const res = await voteFn(data.case_id, data.id, newReaction)
        const dat = await res.json()

        if (res.ok) {
            // set to actual values returned from db
            patchVoteCounts(data.idx, {
                reaction:   dat.reaction, 
                up_votes:   dat.up_votes,
                down_votes: dat.down_votes
            })
        }
        else{
            patchVoteCounts(data.idx, {
                reaction:   data.reaction, 
                up_votes:   data.up_votes,
                down_votes: data.down_votes
            })
        }
    }

    // 🡅🡇▲▼
    return (
        <div className={"VotingArrows" + (isActive ? ' active' : '')}>
            <div className='pair' >
                <div className={'tooltip'} >
                    <button 
                        className={'arrow up' + (voteState.UP ? ' selected' : '') } 
                        onMouseDown={() => handleClick('UP')}>
                        🡅
                    </button>
                    <span className='tooltiptext'>{arrowVals.up_tooltip}</span>
                </div>
                <div className="count">{data.up_votes}</div>
            </div>
            <div className='pair'>
                <div className={'tooltip'} >
                    <button 
                        className={'arrow down' + (voteState.DOWN ? ' selected' : '')} 
                        onMouseDown={() => handleClick('DOWN')}>
                        🡇
                    </button>
                    <span className='tooltiptext'>{arrowVals.down_tooltip}</span>
                </div>
                <div className="count">{data.down_votes}</div>
            </div>
        </div>
    )
}

export default VotingArrows;