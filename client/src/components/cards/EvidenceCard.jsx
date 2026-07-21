import UserTag from "/src/components/UserTag"
import VotingArrows from "/src/components/VotingArrows"

import {formatDateTime} from "/src/utils"
import {voteEvidence} from "/src/api/cases"

import "./EvidenceCard.css"

function EvidenceCard({data, isActivePhase}){
    return (
        <div className="EvidenceCard">
            <img src={data.image_url}/>
            <div className="ev-number">#{data.evidence_num}</div>
            <UserTag user_id={data.user_id} username={data.username} image_url={data.user_image_url}/>
            <div className="header">
            </div>
            <div>{data.text}</div>
            <div className="footer">
                <VotingArrows 
                    data={data}
                    arrowVals={{
                        up: '👍', 
                        up_tooltip: 'credible',
                        down: '👎',
                        down_tooltip: 'questionable'
                    }}
                    voteFn={voteEvidence}
                    isActive={isActivePhase}
                />
                <div className="flex-grow"></div>
                <div className="date">{formatDateTime(data.created_at)}</div>
            </div>


        </div>
    )
}

export default EvidenceCard;
