import UserTag from "/src/components/UserTag"
import VotingArrows from "/src/components/VotingArrows"
import ColorPillTag from "/src/components/ColorPillTag"

import {formatDateTime} from "/src/utils"
import { reactArgument } from '/src/api/reactions.js'

import "./ArgumentCard.css"

function ArgumentCard({idx, data, isActive, patchVoteCounts}){
    return (
        <div className={`ArgumentCard`}>
            <div className="header">
                <ColorPillTag phase={data.argument_tag}/>
                <div className="ev-number">#{data.arg_num}</div>
            </div>
            <UserTag 
                user_id={data.user_id} 
                username={data.username} 
                flair={data.flair_name} 
                image_url={data.user_image_url}/>
            <div className="content">{data.text}</div>
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
                    data={{
                        idx,
                        case_id: data.case_id,
                        id: data.arg_id,
                        reaction: data.reaction,
                        up_votes: data.up_votes,
                        down_votes: data.down_votes}}
                    arrowVals={{
                        up_tooltip: 'sound',
                        down_tooltip: 'fallacious'
                    }}
                    voteFn={reactArgument}
                    patchVoteCounts={patchVoteCounts}
                    isActive={isActive}
                />
                <div className="flex-grow"></div>
                <div className="date">{formatDateTime(new Date(data.created_at))}</div>
            </div>
        </div>
    )
}

export default ArgumentCard;
