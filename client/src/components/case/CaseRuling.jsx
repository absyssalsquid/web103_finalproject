const CaseRuling = ({phaseDelta, caseData}) => {
    let body;
    if (phaseDelta > 0) body = "Phase not started yet."
    else if (phaseDelta == 0 && !caseData.ruling) body = "Case under judge deliberation."
    else body = caseData.ruling

    return (
        <div className="sub-content">
            <div className="minimal">
                {body}
            </div>
        </div>
    )
}
export default CaseRuling;