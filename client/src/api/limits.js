// Centralized domain limits shared across the client UI.
//
// NOTE: these are convenience copies for UX only (maxLength, counters,
// disabling buttons). The backend MUST validate independently — a client
// can bypass any of these. Values that back a DB column are annotated so
// the schema and the UI don't drift.

export const LIMITS = {
    OBJECT_NAME_MAX_LEN: 60,            // cases.object_name  VARCHAR(60)
    ACCUSATION_MAX_LEN: 250,     // cases.accusation   VARCHAR(250)
    EVIDENCE_MAX_LEN: 200, 
    ARGUMENT_MAX_LEN: 600, 
    
    // business rules — the real count comes from the API
    JURY_ASSIGNMENTS: 5,
    CASE_SUBMISSIONS: 3,
    ARGUMENT_SUBMISSIONS: 5,
    EVIDENCE_SUBMISSIONS: 8,

    REFRESH_TIME: new Date(0,0,0,8,0,0),
};