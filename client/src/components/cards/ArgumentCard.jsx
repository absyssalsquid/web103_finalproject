import { useState } from 'react'
import { useNavigate } from "react-router-dom"

import UserTag from "/src/components/UserTag"
import VotingArrows from "/src/components/card_fragments/VotingArrows"
import ColorPillTag from "/src/components/card_fragments/ColorPillTag"
import DeleteButton from "/src/components/card_fragments/DeleteButton"
import EditButton from "/src/components/card_fragments/EditButton"
import ToastMessage from "/src/components/ToastMessage"

import {formatDateTime} from "/src/utils"
import { reactArgument } from '/src/api/reactions.js'
import { deleteArgument } from '/src/api/cases.js'

import "./ArgumentCard.css"

function ArgumentCard({idx, data, isActivePhase, patchVoteCounts, isOwned=false}){
    const navigate = useNavigate()
    const [submitting, setSubmitting] = useState(false)
    const [toastMsg, setToastMsg] = useState({message: '', type:''})

    async function handleDelete(){
        setSubmitting(true)
        const res = await deleteArgument(data.arg_id)
        if (res.ok){
            // if ok, returns 204, which has no body
            setToastMsg({message: "Argument sucessfully deleted", type: 'success', key: Date.now()})
            setTimeout(() => { navigate(0) }, 1700);
        }
        else{
            const res_data = await res.json()
            console.log(res_data)
            setToastMsg({message: res_data.error, type: 'error', key: Date.now()})
            setSubmitting(false)
        }
    }

    return (
        <div className={`ArgumentCard`}>
            <ToastMessage message={toastMsg.message} type={toastMsg.type} key={toastMsg.key}/>

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
                    isActive={isActivePhase}
                />
                <div className="flex-grow"></div>
                { isActivePhase && isOwned && (
                    <>
                        <DeleteButton 
                            handleDelete={handleDelete}
                            disabled={submitting}
                        />
                        <EditButton 
                            link={`/edit-argument/${data.arg_id}`}
                            disabled={submitting}
                        />
                    </>
                )}
                <div className="date">{formatDateTime(new Date(data.created_at))}</div>
            </div>
        </div>
    )
}

export default ArgumentCard;
