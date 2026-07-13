const CaseVerdict = ({phaseDelta, caseData, data}) => {
    console.log('verdict loaded')
    
    if (phaseDelta > 0)
        return (<div>Phase not started yet.</div>)

    const isActivePhase = phaseDelta == 0;

    const count = Object.values(data).reduce((acc, x) => acc + x, 0);
    const vt_map = {
        'GUILTY': 'Guilty', 
        'NOT_GUILTY': 'Not Guilty',
        'TB_PECKED_AT': 'To Be Pecked At Later',
        null: 'UNKNOWN'
    }
    
    // if case still in jury phase, show juror count and coundown. do NOT show breakdown
    if (isActivePhase) 
    return (
        <>
            <div>Jury still in deliberation</div>
            <div> {count} jurors have voted</div>
        </>
    )

    // show jury votes breakdown (not showing individual juror votes) and final verdict
    return(
        <>
            <table>
                <thead>
                    <tr>
                        <th className="text-left">Vote</th>
                        <th>Count</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Guilty</td>
                        <td className="text-right">{data['GUILTY']}</td>
                    </tr>
                    <tr>
                        <td>Not Guilty</td>
                        <td className="text-right">{data['NOT_GUILTY']}</td>
                    </tr>
                    <tr>
                        <td>Insufficient Evidence</td>
                        <td className="text-right">{data['INSUFFICIENT_EVIDENCE']}</td>
                    </tr>
                    <tr className='summary'>
                        <td>Total</td>
                        <td className="text-right">{count}</td>
                    </tr>
                </tbody>
            </table>
            <div>Verdict: {vt_map[caseData.verdict]}</div>
        </>
    )

    
}
export default CaseVerdict;