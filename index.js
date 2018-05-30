import {
    getBranches,
    triggerPipeline
} from './bitbucket-api'

exports.handler = (event, context, callback) => {
    const data = JSON.parse(event.body)
    const repository = data.repository.full_name
    const targetBranch = data.pullrequest.destination.branch.name

    if (targetBranch !== 'develop') {
        callback(null, {
            statusCode: 200,
            body: 'PR did not target develop. Ignoring.'
        })
        return
    }

    getBranches(repository)
        .then(branches => Promise.all(
            branches
            .filter(name => name && !['develop', 'master', targetBranch].includes(name))
            .map(branch => triggerPipeline(repository, branch))
        ))
        .then(branches => {
            const message = `[${repository}] Triggered pipelines for ${branches.join(', ')}`
            callback(null, {
                statusCode: 200,
                body: message
            })
        })
        .catch((err, resp) => {
            callback(null, {
                statusCode: 500,
                body: `error: ${err}\ndata: ${resp}`
            })
        })
}