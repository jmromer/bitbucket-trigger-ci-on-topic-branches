import http from 'https'

const USERNAME = process.env.BITBUCKET_USER
const PASSWORD = process.env.BITBUCKET_TOKEN
const AUTH_STRING = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64')

export const getBranches = repository => {
    const options = {
        method: 'GET',
        hostname: 'api.bitbucket.org',
        path: `/2.0/repositories/${repository}/refs/branches/`,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${AUTH_STRING}`
        }
    }

    const promise = new Promise((resolve, reject) => {
        const req = http.get(options, res => {
            let body = []
            res.setEncoding('utf8')
            res.on('error', err => reject(err))
            res.on('data', data => {
                body.push(data)
            })
            res.on('end', () => {
                try {
                    const data = JSON.parse(body.join(''))
                    const branches = data.values.map(e => e.name)
                    resolve(branches)
                } catch (err) {
                    reject(err, body)
                }
            })
        })

        req.end()
    })

    return promise
}

export const triggerBranches = (repository, branch) => {
    const postData = {
        'target': {
            'ref_type': 'branch',
            'type': 'pipeline_ref_target',
            'ref_name': branch
        }
    }

    const options = {
        method: 'POST',
        hostname: 'api.bitbucket.org',
        path: `/2.0/repositories/${repository}/pipelines/`,
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(JSON.stringify(postData)),
            'Authorization': `Basic ${AUTH_STRING}`
        }
    }

    return new Promise((resolve, reject) => {
        const req = http.request(options, res => {
            res.setEncoding('utf8')
            res.on('data', resp => {
                console.log(`Triggering pipeline for branch: ${branch}`)
                resolve(branch)
            })
            res.on('error', err => {
                console.log(
                    `Pipeline trigger failed for branch: ${branch}. Error: ${err}`
                )
                reject(err)
            })
        })

        req.write(JSON.stringify(postData))
        req.end()
    })
}