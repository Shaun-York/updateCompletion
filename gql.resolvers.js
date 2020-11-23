const {
    UPDATE_OPERATION_COMPLETED_QTY,
    DELETE_COMPLETED_TASK,
    DELETE_COMPLETION,
    GET_COMPLETED_QTY,
    LAST_COMPLETION,
    ADD_WOC_ID,
} = require('./gql.docs')
const {
    HEADERS,
    GQL,
    ACTIONS
} = require('./config')
const fetch = require('node-fetch');

const get_current_operation_qty = async (pk, n) => {
    try {
        const get_qty_mk = await fetch(GQL, {
            method: 'POST',
            body: JSON.stringify({
                query: GET_COMPLETED_QTY,
                variables: {
                    internalid: pk
                }
            }),
            headers: HEADERS,
        })
        const {
            data
        } = await get_qty_mk.json()
        const current_qty = parseInt(data.Tasks_by_pk.completedQty)
        const current_input_qty = parseInt(data.Tasks_by_pk.inputQty)
        console.info(`get_current_operation_qty\ndata.Tasks_by_pk\n\n current_qty:${current_qty} current_input_qty:${current_input_qty}`)
        return {
            failed: false,
            qty: current_qty,
            input_qty: current_input_qty,
            data
        }

    } catch (error) {
        if (n > 0) {
            await get_current_operation_qty(pk, n - 1)
        }
        return {
            failed: true,
            qty: 0,
            pk,
            try: n,
            error: error.message,
            message: 'get_current_operation_qty'
        }
    }
}

const set_current_operation_qty = async (pk, qty, n) => {
    try {
        if (isNaN(qty)) {
            throw new Error('Not a Number')
        }
        const updated_qty = await fetch(GQL, {
            method: 'POST',
            body: JSON.stringify({
                query: UPDATE_OPERATION_COMPLETED_QTY,
                variables: {
                    internalid: pk,
                    completedQty: qty.toString()
                }
            }),
            headers: HEADERS
        })
        const update = await updated_qty.json()
        return {
            failed: false,
            data: update
        }
    } catch (error) {
        if (n > 0) {
            await set_current_operation_qty(pk, qty, n - 1)
        } else {
            return {
                failed: true,
                data: error,
                message: 'set_current_operation_qty'
            }
        }
    }
}

const lookup_mk_completion_to_remove = async (rec, n) => {
    try {
        const last = await fetch(GQL, {
            method: 'POST',
            body: JSON.stringify({
                query: LAST_COMPLETION,
                variables: {
                    operation_sequence: rec.operation_sequence,
                    workorder_id: rec.workorder_id,
                    operator_id: rec.operator_id,
                    action: 'mk'
                }
            }),
            headers: HEADERS,
        })
        const last_ = await last.json()
        last_.data.Completions.forEach((completion_to_remove) =>
            Object.assign(rec, {
                workordercompletion_id: completion_to_remove.workordercompletion_id
            }, {
                completedQty: completion_to_remove.completedQty
            }, {
                rm_id: completion_to_remove.id
            }))
        return {
            failed: false,
            data: rec
        }
    } catch (error) {
        if (n > 0) {
            await lookup_mk_completion_to_remove(rec, n - 1)
        } else {
            return {
                failed: true,
                data: error,
                message: 'lookup_mk_completion_to_remove'
            }
        }
    }
}
const lookup_last_completion_qty = async (rec, n) => {
    try {
        const last = await fetch(GQL, {
            method: 'POST',
            body: JSON.stringify({
                query: LAST_COMPLETION,
                variables: {
                    operation_sequence: rec.operation_sequence,
                    workorder_id: rec.workorder_id,
                    operator_id: rec.operator_id,
                    action: 'mk'
                }
            }),
            headers: HEADERS,
        })
        const last_ = await last.json()
        last_.data.Completions.forEach((completion_to_remove) =>
            Object.assign(rec, {
                workordercompletion_id: completion_to_remove.workordercompletion_id
            }, {
                completedQty: completion_to_remove.completedQty
            }, {
                rm_id: completion_to_remove.id
            }))
        return {
            failed: false,
            qty: parseInt(rec.completedQty)
        }
    } catch (error) {
        if (n > 0) {
            await lookup_mk_completion_to_remove(rec, n - 1)
        } else {
            return {
                failed: true,
                data: error,
                message: 'lookup_mk_completion_to_remove'
            }
        }
    }
}

const add_wocid_completion_w_id = async (id, workordercompletion_id, n) => {
    try {
        await fetch(GQL, {
            method: 'POST',
            body: JSON.stringify({
                query: ADD_WOC_ID,
                variables: {
                    id,
                    workordercompletion_id
                }
            }),
            headers: HEADERS,
        })
        return {
            failed: false
        }
    } catch (error) {
        if (n > 0) {
            await add_wocid_completion_w_id(id, workordercompletion_id, n - 1)
        } else {
            return {
                failed: true,
                data: error,
                message: 'add_wocid_completion_w_id'
            }
        }
    }
}

const del_completion_w_pk = async (id, n) => {
    try {
        await fetch(GQL, {
            method: 'POST',
            body: JSON.stringify({
                query: DELETE_COMPLETION,
                variables: {
                    id: id
                }
            }),
            headers: HEADERS,
        })
        return {
            failed: false,
            data: null
        }
    } catch (error) {
        if (n > 0) {
            await del_completion_w_pk(id, n - 1)
        } else {
            return {
                failed: true,
                data: error,
                message: 'del_completion_w_pk'
            }
        }
    }
}

const undo = async (rec, n) => {
    const TASKS_TABLE_PK = `${rec.workorder_id}${rec.operation_sequence}`
    switch (rec.action) {
        case ACTIONS.MK: {
            const get_current_mk = await get_current_operation_qty(TASKS_TABLE_PK, n)
            if (get_current_mk.failed) {
                return {
                    failed: true,
                    data: get_current_mk,
                    message: 'undo'
                }
            } else {
                const undo_mk_qty = get_current_mk.qty - parseFloat(rec.completedQty)
                const set_mk = await set_current_operation_qty(TASKS_TABLE_PK, undo_mk_qty, n)
                if (set_mk.failed) {
                    return {
                        failed: true,
                        data: get_current_mk,
                        message: 'undo'
                    }
                } else {
                    return {
                        failed: false,
                        data: rec,
                        message: 'undo'
                    }
                }
            }
        }
        case ACTIONS.RM: {
            const get_current_rm = await get_current_operation_qty(TASKS_TABLE_PK, n)
            if (get_current_rm.failed) {
                return {
                    failed: true,
                    data: get_current_rm,
                    message: 'undo'
                }
            } else {
                const undo_rm_qty = get_current_rm.qty + parseFloat(rec.completedQty)
                const set_rm = await set_current_operation_qty(TASKS_TABLE_PK, undo_rm_qty, n)
                if (set_rm.failed) {
                    return {
                        failed: true,
                        data: get_current_rm,
                        message: 'undo'
                    }
                } else {
                    return {
                        failed: false,
                        data: rec,
                        message: 'undo'
                    }
                }
            }
        }
        default:
            return {
                failed: true, data: rec
            }
    }
}

const delete_completed_task = async (pk, n) => {
    try {
        await fetch(GQL, {
            method: 'POST',
            body: JSON.stringify({
                query: DELETE_COMPLETED_TASK,
                variables: {
                    internalid: pk
                }
            }),
            headers: HEADERS,
        })
        return {
            failed: false,
            data: null
        }
    } catch (error) {
        if (n > 0) {
            await delete_completed_task(pk, n - 1)
        } else {
            return {
                failed: true,
                data: error,
                message: 'delete'
            }
        }
    }

}

module.exports = {
    get_current_operation_qty,
    set_current_operation_qty,
    lookup_mk_completion_to_remove,
    delete_completed_task,
    lookup_last_completion_qty,
    add_wocid_completion_w_id,
    del_completion_w_pk,
    undo
}