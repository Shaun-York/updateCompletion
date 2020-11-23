const {
    GQL_RETRYS
} = require('./config')
const {
    add_wocid_completion_w_id,
    delete_completed_task,
} = require('./gql.resolvers')

module.exports = async (record) => {
    const { id, workordercompletion_id, workorder_id, operation_sequence, last_completion } = record
    
    if (workordercompletion_id.length === 0) {
        console.info('missing workordercompletion_id')
        throw Error('missing workordercompletion_id')
    } else {
        const add_woc_id = await add_wocid_completion_w_id(id, workordercompletion_id, GQL_RETRYS)

        if (add_woc_id.failed) {
            console.info('Failed to update woc in db')
            throw Error('Failed to update woc in db')
        }

    if (last_completion) {
        const TASKS_TABLE_PK = `${workorder_id}${operation_sequence}`
        console.info(`woc: ${workordercompletion_id} completes workorder: ${workorder_id}`)
        const del_task = await delete_completed_task(TASKS_TABLE_PK, GQL_RETRYS)

        if (del_task.failed) {
            console.info('delete_completed_task failed to delete')
            throw Error('delete_completed_task failed to delete')
        }
    }
    return { completionindb: true, ...record }
    }
}
