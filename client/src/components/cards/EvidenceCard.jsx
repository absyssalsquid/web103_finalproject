import { useState } from "react"
import { useNavigate } from "react-router-dom"

import UserTag from "/src/components/UserTag"
import VotingArrows from "/src/components/card_fragments/VotingArrows"
import DeleteButton from "/src/components/card_fragments/DeleteButton"
import EditButton from "/src/components/card_fragments/EditButton"
import ToastMessage from "/src/components/ToastMessage"

import {formatDateTime} from "/src/utils"
import { reactEvidence } from '/src/api/reactions.js'
import { deleteEvidence, editEvidence } from '/src/api/cases.js'

import "./EvidenceCard.css"

function EvidenceCard({idx, data, isActivePhase, patchVoteCounts, isOwned=false, lengthLimits}){
    const navigate = useNavigate()
    const [submitting, setSubmitting] = useState(false)
    const [toastMsg, setToastMsg] = useState({message: '', type:''})
    const [isEditing, setEditing] = useState(false);
    const [newText, setNewText] = useState(data.text)

    async function handleDelete(){
        setSubmitting(true)
        const res = await deleteEvidence(data.evidence_id)
        if (res.ok){
            // if ok, returns 204, which is no json body
            setToastMsg({message: "Evidence sucessfully deleted", type: 'success', key: Date.now()})
            setTimeout(() => { navigate(0) }, 1700);
        }
        else{
            const res_data = await res.json()
            console.log(res_data)
            setToastMsg({message: res_data.error, type: 'error', key: Date.now()})
            setSubmitting(false)
        }
    }

    async function handleEditSubmit(){
        setSubmitting(true)
        const body = {
            case_id: data.case_id,
            evidence_id: data.evidence_id,
            text: newText
        }
        console.log(body)
        const res = await editEvidence(body)
        if (res.ok){
            // if ok, returns 204, which is no json body
            setToastMsg({message: "Evidence sucessfully edited", type: 'success', key: Date.now()})
            setTimeout(() => navigate(0), 1700);
        }
        else{
            const res_data = await res.json()
            console.log(res_data)
            setToastMsg({message: res_data.error, type: 'error', key: Date.now()})
            setSubmitting(false)
        }
    }

    function handleCancel(){
        setNewText(data.text)
        setEditing(false)
    }

    return (
        <div className="EvidenceCard">
            <ToastMessage message={toastMsg.message} type={toastMsg.type} key={toastMsg.key}/>

            <div className="ev-number">#{data.evidence_num}</div>
            <UserTag 
                user_id={data.user_id} 
                username={data.username} 
                flair={data.flair_name} 
                image_url={data.user_image_url}/>

            {!isEditing
                ? (<div className="content">{data.text}</div>)
                : (<div className="edit-area">
                        <textarea
                            className='evidence'
                            name="evidence"
                            type="text"
                            value={newText}
                            minLength={lengthLimits.min}
                            maxLength={lengthLimits.max}
                            onChange={(e)=>setNewText(e.target.value)}
                            placeholder="what did you see..."
                            rows={4}
                            required
                        />
                        <small className="char-limit">{newText.length}/{lengthLimits.max}</small>
                    </div>
            )
            }
            
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
                { isActivePhase && isOwned && !isEditing && (
                    <>
                        <DeleteButton 
                            handleDelete={handleDelete}
                            disabled={submitting}
                        />
                        <EditButton 
                            handleEdit={()=>setEditing(true)}
                            disabled={submitting}
                        />
                    </>
                )}
                {isEditing &&(
                    <div className="edit-actions">
                        <button type="submit" onClick={handleEditSubmit}>save</button>
                        <button className="cancel" onClick={handleCancel}>cancel</button>
                    </div>
                )}
                <div className="date">{formatDateTime(new Date(data.created_at))}</div>
            </div>


        </div>
    )
}

export default EvidenceCard;
