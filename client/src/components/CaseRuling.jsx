const CaseRuling = ({phaseDelta, caseData}) => {
    if (phaseDelta > 0)
        return (<div>Phase not started yet.</div>)

    const isActivePhase = phaseDelta == 0;

    if (isActivePhase && !caseData.ruling) {
        return (
            <div>Case under judge deliberation. </div>
        )
    }

    return (
        <div>
            {caseData.ruling}
        </div>
    )
}
export default CaseRuling;