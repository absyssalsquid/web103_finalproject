import UserTag from "/src/components/UserTag"
import VotingArrows from "/src/components/VotingArrows"

import {formatDateTime} from "/src/utils"
import {voteArgument} from "/src/api/cases"

import "./ArgumentCard.css"

function ArgumentCard({data, isActivePhase}){
    return (
        <div className="ArgumentCard">
            <img src={data.image_url}/>
            <div className="ev-number">#{data.evidence_num}</div>
            <UserTag user_id={data.user_id} username={data.username} image_url={data.user_image_url}/>
            <div className="header">
            </div>
            <div className="argument">{data.text}</div>
            <div className="citations">
                {data.evidence_citations.map((item)=>(
                    <div className="citation-card">
                        <div className="citation-id">Evidence #{item.evidence_num}</div>
                        <div>{item.text}</div>
                    </div>
                ))}
                {data.case_citations.map((item)=>(
                    <div className="citation-card">
                        <div className="citation-id">Case <a href={`/cases/${item.case_id}`}>#{item.case_id}</a></div>
                        <div>{item.ruling}</div>
                    </div>
                ))}
            </div>
            <div className="footer">
                <VotingArrows 
                    data={data}
                    arrowVals={{
                        up: '👍', 
                        up_tooltip: 'sound',
                        down: '👎',
                        down_tooltip: 'fallacious'
                    }}
                    voteFn={voteArgument}
                    isActive={isActivePhase}
                />
                <div className="flex-grow"></div>
                <div className="date">{formatDateTime(data.created_at)}</div>
            </div>
        </div>
    )
}

export default ArgumentCard;
