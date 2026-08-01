import UserTag from "/src/components/UserTag"
import VotingArrows from "/src/components/VotingArrows"

import {formatDateTime} from "/src/utils"
import { reactEvidence } from '/src/api/reactions.js'

import "./EvidenceCard.css"

function EvidenceCard({idx, data, isActivePhase, patchVoteCounts}){
    return (
        <div className="EvidenceCard">
            <div className="ev-number">#{data.evidence_num}</div>
            <UserTag 
                user_id={data.user_id} 
                username={data.username} 
                flair={data.flair_name} 
                image_url={data.user_image_url}/>

            <div className="content">{data.text}</div>
            {data.image_url && <img src={data.image_url}/>}
            <div className="footer">
                <VotingArrows
                    data={{
                        idx,
                        case_id: data.case_id,
                        id: data.evidence_id,
                        reaction: data.reaction,
                        up_votes: data.up_votes,
                        down_votes: data.down_votes}}
                    arrowVals={{
                        up_tooltip: 'credible',
                        down_tooltip: 'questionable'
                    }}
                    voteFn={reactEvidence}
                    patchVoteCounts={patchVoteCounts}
                    isActive={isActivePhase}
                />
                <div className="flex-grow"></div>
                <div className="date">{formatDateTime(new Date(data.created_at))}</div>
            </div>


        </div>
    )
}

export default EvidenceCard;
