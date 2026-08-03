export const LENGTH_LIMITS = {
    object_name_max: 60,
    object_name_min: 3,

    accusation_max: 250,
    accusation_min: 10,

    evidence_max: 200,
    evidence_min: 10,

    argument_max: 600,
    argument_min: 20,

    bio_max: 250,

    username_max: 40,
    username_min: 3,

    password_min: 8,

    bio_max: 500,

    juror_cite_max: 3,
    arg_cite_max: 5
}

export const USAGE_LIMITS = {
    jury_assignments: 5,
    cases: 3,
    arguments: 5,
    evidence: 8,
};

export const REFRESH_TIME = {
    hour: 7,
    time_zone: "America/Los_Angeles"
}

export const DILATION_FACTOR = 1; // multiply the days to extend each phase window
export const EDIT_LIMIT_MINUTES = 10; // minutes after which you cant edit submissions