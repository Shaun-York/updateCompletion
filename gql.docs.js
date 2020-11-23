const ADD_WOC_ID = `
        mutation woc_id($id: Int!, $workordercompletion_id: String!) {
            update_Completions_by_pk(pk_columns: { id: $id },
                _set: { workordercompletion_id: $workordercompletion_id }
            ) {
                workordercompletion_id
                operation_sequence
                mfgoptask_id
                workorder_id
                completedQty
                location_id
                operator_id
                worktime_id
                machine_id
                workcenter
                item_id
                action
                id
            }
        }
    `;
const DELETE_COMPLETION = `mutation remove($id: Int!){delete_Completions_by_pk(id: $id) {
                    workordercompletion_id
                    operation_sequence
                    mfgoptask_id
                    workorder_id
                    completedQty
                    location_id
                    operator_id
                    worktime_id
                    machine_id
                    workcenter
                    item_id
                    action
                    id
                    }
                }
            `;
const LAST_COMPLETION = `
        query lastCompletion($workorder_id: String!, $operation_sequence: String!, $operator_id: String!, $action: String!) {
            Completions(limit: 1 order_by: { id: desc_nulls_first },
            where: {
                    workordercompletion_id: { _neq: "" },
                    operation_sequence: { _eq: $operation_sequence },
    	            workorder_id: { _eq: $workorder_id },
                    operator_id: { _eq: $operator_id },
                    action: { _eq: $action }
  	            }){
                      workordercompletion_id
                      completedQty
                      id
                  }
                }
    `;
const GET_COMPLETED_QTY = `
        query completedQty($internalid: String!) {
            Tasks_by_pk(internalid: $internalid) {
                completedQty
                inputQty
            }
        }
    `;
const UPDATE_OPERATION_COMPLETED_QTY = `
        mutation newCompetedQty($internalid: String!, $completedQty: String!){ 
            update_Tasks_by_pk(
                pk_columns: {internalid: $internalid}, 
                _set: {completedQty: $completedQty}){
                    internalid
                    completedQty
                }
        }`
const DELETE_COMPLETED_TASK = `
        mutation delTask($internalid: String!){ 
            delete_Tasks_by_pk(internalid: $internalid) {
                internalid
                workorder
                workcenter
                location
            }
        }`
module.exports = {
    UPDATE_OPERATION_COMPLETED_QTY,
    DELETE_COMPLETED_TASK,
    DELETE_COMPLETION,
    GET_COMPLETED_QTY,
    LAST_COMPLETION,
    ADD_WOC_ID,
}