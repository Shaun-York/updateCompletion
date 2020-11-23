const GQL = process.env.GQL_SERVER
const HEADERS = {
    'Content-Type': 'application/json',
}

const GQL_RETRYS = 4

module.exports = {
    HEADERS,
    GQL_RETRYS,
    GQL,
}
