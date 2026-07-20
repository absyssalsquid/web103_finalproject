import "./CaseVerdict.css"

const VT_MAP = {
    'GUILTY': 'Guilty', 
    'NOT_GUILTY': 'Not Guilty',
    'INSUFFICIENT_EVIDENCE': 'To Be Pecked At Later...',
    'TB_PECKED_AT': 'To Be Pecked At Later...',
    null: '???'
}

const CaseVerdict = ({phaseDelta, caseData, data}) => {
    if (phaseDelta > 0)
        return (
            <div className="sub-content">
                <div className='minimal'>Phase not started yet.</div>
            </div>
        )

    const isActivePhase = phaseDelta == 0;
    
    // if case still in jury phase, show juror count and coundown. do NOT show breakdown
    if (isActivePhase) 
    return (
        <div className="sub-content">
            <div className="minimal">
                <div>Jury still in session</div>
                <div>{data.total} jurors have voted</div>
            </div>
        </div>
    )

    // show jury votes breakdown (not showing individual juror votes) and final verdict
    return(
        <div className="CaseVerdict sub-content">
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th className="text-left">Vote</th>
                            <th className="text-right">Count</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Guilty</td>
                            <td className="text-right">{data.breakdown['GUILTY']}</td>
                        </tr>
                        <tr>
                            <td>Not Guilty</td>
                            <td className="text-right">{data.breakdown['NOT_GUILTY']}</td>
                        </tr>
                        <tr>
                            <td>Insufficient Evidence</td>
                            <td className="text-right">{data.breakdown['INSUFFICIENT_EVIDENCE']}</td>
                        </tr>
                        <tr className='summary'>
                            <td>Total</td>
                            <td className="text-right">{data.total}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div className="conclusion">
                <div>Verdict</div>
                <div className="verdict">{VT_MAP[caseData.verdict]}</div>
            </div>
        </div>
    )

    
}
export default CaseVerdict;