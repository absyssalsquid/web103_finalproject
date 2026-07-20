import EvidenceCard from "../cards/EvidenceCard";

import "./CaseEvidence.css"


const CaseEvidence = ({phaseDelta, data}) => {
    if (phaseDelta > 0)
        return (
            <div className="sub-content">
                <div className='minimal'>Phase not started yet.</div>
            </div>
        )

    const isActivePhase = phaseDelta == 0;

    return (
        <div className="CaseEvidence sub-content">
            <div className="evidence-container">
                {data.length === 0 
                    ? <div className="minimal">No evidence submitted{isActivePhase && ' yet'}.</div> 
                    : data.map((item) => 
                        <EvidenceCard key={item.evidence_id} 
                            data={item} 
                            isActivePhase={isActivePhase}/>
                      )}
            </div>
        </div>
    )
}
export default CaseEvidence;