import {dateWithDelta} from "/src/api/test_data"
import { nextPhase } from '/src/utils'

export function incrementCase(caseData, jurySummary){
    // for the purposes of testing, calculated here
    // should all be done backend

    var newCaseData = {
        ...caseData,
        phase: nextPhase(caseData.phase),
        phase_start: caseData.phase_end,
        phase_end: dateWithDelta({seconds:5}, caseData.phase_end)
    }

    if (caseData.phase == 'JURY_DELIBERATION'){
        // tally votes
        let maxKey = null;
        let maxValue = 0;
        for (const [key, value] of Object.entries(jurySummary.breakdown)) {
            if (value > maxValue) {
                maxValue = value;
                maxKey = key;
            }
        }
        newCaseData.verdict = maxKey;
    }
    else if (caseData.phase == 'RULING'){
        caseData.ruling = 'New judge ruling!!!'
        newCaseData.phase_end = null;
    }
    return newCaseData;
}
