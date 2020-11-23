const AWS = require('aws-sdk');
AWS.config.update({
    region: process.env.AWS_REGION
});
const sqs = new AWS.SQS({
    apiVersion: '2012-11-05'
});
const update_completions = require('./update_completion')

function deleteFromSQS(receiptHandle) {
    return new Promise((resolve, reject) => {
                const delmessage = {
                    QueueUrl: process.env.INPUT_QUEUE,
                    ReceiptHandle: receiptHandle
                }
                sqs.deleteMessage(delmessage, function (error, data) {
                    if (error) {
                        console.log(error, error.stack)
                        reject('Failed to delete message')
                    } else {
                        console.log('SQS message deleted', data); // successful response
                    }
                })
                resolve(data)
            })
}

exports.handler = async (event) => {
    for (const { messageId, body, receiptHandle } of event.Records) {
        try {

            const payload = JSON.parse(body)

            const response = await update_completions(payload)
            if (response.completionindb) {
                console.info('Deleting ', messageId)
                await deleteFromSQS(receiptHandle)
            } else {
                throw new Error('Could not update completiion...')
            }

        } catch (error) {
            console.info(error.message)
            throw new Error(error.message)
        }
    }
    return `Successfully processed ${event.Records.length} messages.`;
};
