import users from './users.js'
import { getRandomInt } from '../utils/time.js'
import { LENGTH_LIMITS } from '../config/userRules.js';

const LOREM_IPSUM = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc aliquet tellus ipsum, at euismod risus blandit sed. Nunc congue, mi eget iaculis tempus, justo libero condimentum massa, sed convallis sapien erat sit amet risus. Nunc vel nisl nec mi accumsan ullamcorper. Cras ut lectus purus. Quisque eu urna nec neque aliquam lacinia quis at turpis. Praesent ullamcorper eros at enim eleifend, et scelerisque velit euismod. Nam suscipit euismod urna eleifend cursus. Aliquam imperdiet, diam a suscipit congue, ante est bibendum ante, nec congue lorem risus sed diam. Nullam enim tortor, blandit vel egestas ac, ultricies in augue. Mauris at tortor nec eros ornare ultrices. Donec at lectus ac velit pretium aliquet ac eu urna. Fusce molestie auctor enim, id tincidunt nulla lobortis consequat. In hac habitasse platea dictumst. Mauris pellentesque pretium tortor id tincidunt. Morbi sem ipsum, ullamcorper sed sapien et, auctor lobortis ante. Donec vitae ante id lorem pretium tincidunt. Nunc dapibus pulvinar lobortis. Sed vel massa sit amet metus feugiat lobortis. Vestibulum interdum iaculis sem id blandit. Sed eleifend risus eget nisl pharetra, non commodo mi condimentum. Cras eget nisi nisi. Ut dapibus sapien quis ipsum egestas malesuada. Nunc placerat condimentum metus. Sed augue arcu, ornare nec rhoncus eu, rhoncus quis ante. Sed egestas eleifend accumsan. Aliquam molestie pretium ligula sit amet rutrum. Sed sed dignissim quam. Cras at lacus ultricies, commodo urna gravida, fringilla est. Quisque eu tellus sit amet mi finibus fermentum. Aenean volutpat ipsum sem. Praesent facilisis, dui pellentesque posuere maximus, diam mauris pretium purus, id convallis lacus arcu id tortor. Nam non dui eu magna porta consectetur. Nullam eget accumsan risus, ac suscipit eros. Praesent volutpat dignissim ante, nec convallis leo mattis at. Vivamus aliquet sit amet nunc vel efficitur. Curabitur at metus eget elit ornare dapibus in semper lectus. Duis ornare lacus et leo porttitor, congue tempor nibh bibendum. In aliquam turpis arcu, sed varius urna ullamcorper ut. Morbi dapibus tortor justo, eget maximus mi interdum in. Aenean congue odio mi, eu posuere nulla suscipit vitae. Cras eget lorem faucibus, maximus ex a, vulputate massa. Nulla nulla nisl, bibendum a ipsum eget, scelerisque placerat erat. "

export function generateLoremIpsum(min, max){ // char count between
    const len = getRandomInt(min, max);
    let start = getRandomInt(0, LOREM_IPSUM.length - len)
    while (start>0 && !/^[A-Z]*$/.test(LOREM_IPSUM[start])) start--
    let end = start + len
    while (end != LOREM_IPSUM.length && end>start && LOREM_IPSUM[end+1] != ' ') end--
    return LOREM_IPSUM.substring(start, end+1)
}

export function generateEvidence(count){
    return [...Array(count).keys()].map((i) => {
        return {
            user_id: getRandomInt(1, users.length),
            evidence_num: i+1,
            text: generateLoremIpsum(
                LENGTH_LIMITS.evidence_min + 5, // acount for end backtracking
                LENGTH_LIMITS.evidence_max), 
            up_votes: getRandomInt(1, 100),
            down_votes: getRandomInt(1, 100),
        }
    })
}

export function generateArguments(count){
    return [...Array(count).keys()].map((i) => {
        return {
            user_id: getRandomInt(1, users.length),
            arg_num: i+1,
            argument_tag: getRandomInt(0, 1) == 0 ? 'PROSECUTION' : 'DEFENSE', 
            text: generateLoremIpsum(
                LENGTH_LIMITS.argument_min + 5, // acount for end backtracking
                LENGTH_LIMITS.argument_max), 
            up_votes: getRandomInt(1, 100),
            down_votes: getRandomInt(1, 100),
        }
    })
}

// console.log(generateArguments(5)) // this produces correct arg_num