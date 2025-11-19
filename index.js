// Export the node definitions
module.exports = {
  nodes: {
    "mysql": require("./nodes/mysql.node.js"),
  },
  credentials: {
    "mysqlDb": require("./credentials/mysqlDb.credentials.js"),
  },
};