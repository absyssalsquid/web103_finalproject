import EvidenceCard from "./cards/EvidenceCard";

const CaseEvidence = ({phaseDelta, data}) => {
    if (phaseDelta > 0)
        return (<div>Phase not started yet.</div>)

    const isActivePhase = phaseDelta == 0;

    return (
        <div>
            {data.length === 0 
                ? <p>No evidence submitted{isActivePhase && ' yet'}.</p> 
                : data.map((evidence, index) => <EvidenceCard key={index} data={evidence} />)}
        </div>
    )
}
export default CaseEvidence;