import './CaseProvisional.css'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { reactProvisional } from '/src/api/reactions.js'

const VOTE_OPTIONS = [
    {   value: 'UP', 
        tag: 'prosecute', 
        label: 'Prosecute', 
        emoji: '🔪', 
        flavor: 'Hold it accountable'},

    {   value: 'DOWN', 
        tag: 'defend', 
        label: 'Defend', 
        emoji: '🛡️',
        flavor: 'Hold it accountable'},
]

function Provisional({phaseDelta, caseData, setCaseData}){
    const {id} = useParams()
    const isActivePhase = phaseDelta == 0;

    const [voteState, setVoteState] = useState(caseData.reaction)
    const [animatingVote, setAnimatingVote] = useState(null)

    const totalVotes = (caseData.up_votes || 0) + (caseData.down_votes || 0)
    const countsVisible = !isActivePhase || voteState!==null
    const prosecutePercent = totalVotes > 0 ? Math.round((caseData.up_votes / totalVotes) * 100) : 50
    const defendPercent = totalVotes > 0 ? Math.round((caseData.down_votes / totalVotes) * 100) : 50
    const phasePassedText = caseData.phase ==='DISMISSED'
        ? "The flock has deemed this case uninteresting. Case dismissed."
        : "The flock has determined this case warrants trial."

    async function handleClick(val) {
        if (!isActivePhase) return;
        if (val === voteState) return

        setAnimatingVote(val)
        const upDelta   = (val === 'UP' ) - (voteState  === 'UP'  );
        const downDelta = (val === 'DOWN') - (voteState === 'DOWN');

        // optimistic set
        setVoteState(val)
        setCaseData((prev) => ({    
            ...prev,
            reaction: val,
            up_votes: caseData.up_votes + upDelta,
            down_votes: caseData.down_votes + downDelta,
        }))
        
        setTimeout(() => setAnimatingVote(null), 500)

        const res = await reactProvisional(id, id, val)
        const data = await res.json()

        if (res.ok) {
            // set canonical
            setVoteState(data.reaction)
            setCaseData((prev) => ({
                ...prev,
                reaction: data.reaction,
                up_votes: data.up_votes,
                down_votes: data.down_votes,
            }))
        }
        else{
            // revert
            setVoteState(caseData.reaction)
            setCaseData(caseData)
        }
    }

    return (
        <div className="Provisional sub-content">
            <div className='heading-block subheading'>Public Interest Assessment</div>
            <div className={`vote-stats`}>
                <div className='gauge-bar'>
                        <div className='gauge-prosecute' style={{width: `${countsVisible ? prosecutePercent : 0}%`}}></div>
                        <div className='gauge-defend' style={{width: `${countsVisible ? defendPercent: 0}%`}}></div>
                </div>
                <div className='gauge-labels'>
                    <div className='gauge-label prosecute'>{countsVisible && `${prosecutePercent}%`}</div>
                    <div className='total-votes'>{totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}</div>
                    <div className='gauge-label defend'>{countsVisible && `${defendPercent}%`}</div>
                </div>
            </div>

            {!isActivePhase && (<div>{phasePassedText}</div>)}

            {isActivePhase && (
                <>
                    <div className='heading-block'>
                        <div className='subheading'>Pick a side.</div>
                        <div>Your vote matters. Only cases with sufficient interest proceed to trial.</div>
                    </div>
                    <div className='option-container'>
                        {VOTE_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                className={`option ${opt.tag} ${voteState === opt.value ? 'selected' : ''} ${animatingVote === opt.value ? 'animating' : ''}`}
                                value={opt.value}
                                onClick={(e)=>handleClick(e.currentTarget.value)}
                                disabled={!isActivePhase}
                            >
                                <span className='option-emoji'>{opt.emoji}</span>
                                <span className='option-text'>{opt.label}</span>
                                <span className='vote-count'>{opt.value === 'UP' ? caseData.up_votes || 0 : caseData.down_votes || 0}</span>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}

export default Provisional;