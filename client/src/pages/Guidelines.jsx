import {LIMITS} from "/src/api/limits"
import {getTimeString} from "/src/utils"

function Guidelines(){
    return (
        <div className="Guidelines main-content">

            <h2>Case Phases</h2>
            Cases pass through several phases. Each phase (except for closed) lasts 24 hours.
            <ol>
                <li>Provisional</li>
                <li>Discovery</li>
                <li>Argument</li>
                <li>Jury Deliberation</li>
                <li>Ruling</li>
                <li>Closed</li>
            </ol>

            <h3>Submitting a case</h3>
            <p>Have you been aggrieved by an object? File a case! </p>

            <h3>Provisional</h3>
            <p>After submitting an object, it enters the provisional phase, where it is probed for community interest. Is this accusation worthy of the court's time? Vote on whether the accusation raises an interesting legal question, not whether you believe the object is guilty or not. If the case meets the interest threshold within 24 hours, it proceeds to trial. Otherwise, it will be dismissed. </p>

            <h3>Discovery</h3>
            <p>Submit evidence for or against the accused object. You can optionally submit an image. Evidence can be for the defense, the prosecution, or neither.</p>

            <h3>Argument</h3>
            <p>Make an argument based on the evidence or previous rulings. You can cite up to 5 total pieces of evidence or previous cases</p>

            <h3>Jury Deliberation</h3>
            <p>You can't choose to serve on a specific jury. Every day you are issued 3 summons. After responding to a summons, you will assigned to a random case. Summons expire at the end of the day.</p>
            <p>Once assigned to a case, you can vote Guilty, Not Guilty, or Insufficient Evidence. Vote based only on evidence and arguments presented within the case. You can choose up to three arguments that you find the most persuasive.</p>

            <h3>Ruling</h3>
            <p>Based on the verdict, the assigned judge designates the very</p>

            <h3>Closed</h3>
            <p></p>
            
            <h2>Daily limits</h2>
            <p>Limits reset at {getTimeString(LIMITS.REFRESH_TIME)}.</p>
            <table>
                <thead>
                    <tr>
                        <th>Action</th>
                        <th>Limit</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Submit case</td>
                        <td className="text-right">{LIMITS.CASE_SUBMISSIONS}</td>
                    </tr>
                    <tr>
                        <td>Submit evidence</td>
                        <td className="text-right">{LIMITS.EVIDENCE_SUBMISSIONS}</td>
                    </tr>
                    <tr>
                        <td>Submit argument</td>
                        <td className="text-right">{LIMITS.ARGUMENT_SUBMISSIONS}</td>
                    </tr>
                    <tr>
                        <td>Serve jury duty</td>
                        <td className="text-right">{LIMITS.JURY_SUMMONS}</td>
                    </tr>
                    <tr>
                        <td></td>
                        <td></td>
                    </tr>
                </tbody>
            </table>
            
        </div>
    )
}

export default Guidelines;



