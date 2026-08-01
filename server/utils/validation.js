export const isDict = (val) => val !== null && typeof val === 'object' && !Array.isArray(val);
export const compressWhitespace = (str, retainSpaces=false) => str.replace(retainSpaces ? /[\r\n]+/g : /\s+/g, ' ').trim()
export function isNonemptyString(obj){
    if (typeof obj !== 'string') return false
    obj = compressWhitespace(obj)
    if (obj.length === 0) return false
    return true
}

export function toIntArray(arr){
    if (!Array.isArray(arr)) return false

    for (let i = 0; i < arr.length; i++) {
        const num = Number(arr[i])
        if (!Number.isSafeInteger(num) || num < 1)
            return false
        arr[i] = num
    }
    return true
}