export const bulletPt = (count, target=1) => (count === target) ? '  -' : '  X'

export function processResults(results, name, callback=null){
    let errors_output = 0
    results.forEach((result, i) => {
        if (result.status === 'fulfilled'){
            if (callback) callback(result, i)
        }
        else if (errors_output < 3) {
            console.error(`${bulletPt(0)} error seeding ${name}:`, result.reason)
            errors_output ++
        }
    })
}
