import { dateWithDelta } from '../utils/time.js'
const now = new Date();

const cases = [
    {   user_id: 1,
        created_at: new Date(2025, 2, 7, 15), 
        object_name: 'sample object 1', 
        accusation: 'sample accusation and the harm or offense it has caused to birds.', 
        image_url: null, 
        phase: 'CLOSED',
        phase_start: new Date(2025, 2, 12, 15),
        phase_end: null},

    {   user_id: 2,
        created_at: new Date(2025, 12, 2, 11), 
        object_name: 'sample object 2', 
        accusation: 'sample accusation and the harm or offense it has caused to birds.', 
        image_url: null, 
        phase: 'WITHDRAWN',
        phase_start: new Date(2025, 12, 2, 20),
        phase_end: null},

    {   user_id: 3,
        created_at: null, 
        object_name: 'sample object 3', 
        accusation: 'sample accusation and the harm or offense it has caused to birds.', 
        image_url: null, 
        phase: 'RULING',
        phase_start: null,
        phase_end: dateWithDelta({hours:14}, now)},

    {   user_id: 4,
        created_at: null, 
        object_name: 'sample object 4', 
        accusation: 'sample accusation and the harm or offense it has caused to birds.', 
        image_url: null, 
        phase: 'JURY_DELIBERATION',
        phase_start: null,
        phase_end: dateWithDelta({hours:8}, now)},

    {   user_id: 3,
        created_at: null, 
        object_name: 'sample object 5', 
        accusation: 'sample accusation and the harm or offense it has caused to birds.', 
        image_url: null, 
        phase: 'ARGUMENT',
        phase_start: null,
        phase_end: dateWithDelta({hours:21}, now)},

    {   user_id: 2,
        created_at: null, 
        object_name: 'sample object 6', 
        accusation: 'sample accusation and the harm or offense it has caused to birds.', 
        image_url: null, 
        phase: 'DISCOVERY',
        phase_start: null,
        phase_end: dateWithDelta({hours:3}, now)},
        
    {   user_id: 5,
        created_at: dateWithDelta({hours:-23}, now), 
        object_name: 'sample object 7', 
        accusation: 'sample accusation and the harm or offense it has caused to birds.', 
        image_url: null, 
        phase: 'DISMISSED',
        phase_start: dateWithDelta({hours:-23}, now),
        phase_end: null},

    {   user_id: 2,
        created_at: null, 
        object_name: 'sample object 9', 
        accusation: 'sample accusation and the harm or offense it has caused to birds.', 
        image_url: null, 
        phase: 'JURY_DELIBERATION',
        phase_start: null,
        phase_end: dateWithDelta({minutes:10}, now)},

    {   user_id: 2,
        created_at: null, 
        object_name: 'sample object 10', 
        accusation: 'sample accusation and the harm or offense it has caused to birds.', 
        image_url: null, 
        phase: 'JURY_DELIBERATION',
        phase_start: null,
        phase_end: dateWithDelta({hours:2}, now)},
    
    {   user_id: 1,
        created_at: null, 
        object_name: 'sample object 11', 
        accusation: 'sample accusation and the harm or offense it has caused to birds.', 
        image_url: null, 
        phase: 'PROVISIONAL',
        phase_start: null,
        phase_end: dateWithDelta({hours:2}, now)},
            
    {   user_id: 2,
        created_at: null, 
        object_name: 'sample object 12', 
        accusation: 'sample accusation and the harm or offense it has caused to birds.', 
        image_url: null, 
        phase: 'JURY_DELIBERATION',
        phase_start: null,
        phase_end: dateWithDelta({hours:4}, now)},

]

export default cases




