const MySQLDbCredentials = {
  name: "mysqlDb",
  displayName: "MySQL Database",
  documentationUrl: "https://dev.mysql.com/doc/",
  icon: "🐬",
  color: "#00758F",
  testable: true,
  properties: [
    {
      displayName: "Host",
      name: "host",
      type: "text",
      required: true,
      default: "localhost",
      description: "MySQL server host",
      placeholder: "localhost or IP address",
    },
    {
      displayName: "Port",
      name: "port",
      type: "number",
      required: true,
      default: 3306,
      description: "MySQL server port",
    },
    {
      displayName: "Database",
      name: "database",
      type: "text",
      required: true,
      default: "",
      description: "Database name",
      placeholder: "my_database",
    },
    {
      displayName: "User",
      name: "user",
      type: "text",
      required: true,
      default: "",
      description: "Database user",
      placeholder: "root",
    },
    {
      displayName: "Password",
      name: "password",
      type: "password",
      typeOptions: {
        password: true,
      },
      required: true,
      default: "",
      description: "Database password",
    },
    {
      displayName: "SSL",
      name: "ssl",
      type: "boolean",
      default: false,
      description: "Use SSL connection",
    },
    {
      displayName: "Connection Timeout",
      name: "connectionTimeout",
      type: "number",
      default: 10000,
      description: "Connection timeout in milliseconds",
      placeholder: "10000",
    },
  ],

  /**
   * Test the MySQL connection
   */
  async test(data) {
    // Validate required fields
    if (!data.host || !data.database || !data.user || !data.password) {
      return {
        success: false,
        message: "Host, database, user, and password are required",
      };
    }

    // Try to connect to MySQL
    try {
      const mysql = require("mysql2/promise");

      const connection = await mysql.createConnection({
        host: data.host,
        port: data.port || 3306,
        database: data.database,
        user: data.user,
        password: data.password,
        ssl: data.ssl ? { rejectUnauthorized: false } : false,
        connectTimeout: data.connectionTimeout || 10000,
      });

      try {
        // Test the connection with a simple query
        const [rows] = await connection.execute(
          "SELECT NOW() as current_time, VERSION() as version"
        );

        await connection.end();

        if (rows && rows.length > 0) {
          const version = rows[0].version;

          return {
            success: true,
            message: `Connected successfully to MySQL ${version} at ${
              data.host
            }:${data.port || 3306}/${data.database}`,
          };
        }

        await connection.end();
        return {
          success: true,
          message: "Connection successful",
        };
      } catch (queryError) {
        await connection.end();
        throw queryError;
      }
    } catch (error) {
      // Handle specific MySQL error codes
      if (error.code === "ECONNREFUSED") {
        return {
          success: false,
          message: `Cannot connect to database server at ${data.host}:${
            data.port || 3306
          }. Connection refused.`,
        };
      } else if (error.code === "ENOTFOUND") {
        return {
          success: false,
          message: `Cannot resolve host: ${data.host}. Please check the hostname.`,
        };
      } else if (error.code === "ETIMEDOUT") {
        return {
          success: false,
          message: `Connection timeout to ${data.host}:${
            data.port || 3306
          }. Please check firewall and network settings.`,
        };
      } else if (error.code === "ER_ACCESS_DENIED_ERROR") {
        return {
          success: false,
          message: "Authentication failed. Invalid username or password.",
        };
      } else if (error.code === "ER_BAD_DB_ERROR") {
        return {
          success: false,
          message: `Database "${data.database}" does not exist.`,
        };
      } else if (error.code === "ER_DBACCESS_DENIED_ERROR") {
        return {
          success: false,
          message:
            "Authorization failed. User does not have access to this database.",
        };
      } else if (error.code === "PROTOCOL_CONNECTION_LOST") {
        return {
          success: false,
          message:
            "Connection lost to MySQL server. Please check server status.",
        };
      } else if (error.code === "ER_CON_COUNT_ERROR") {
        return {
          success: false,
          message: "Too many connections to MySQL server. Try again later.",
        };
      } else if (error.code === "ER_HOST_IS_BLOCKED") {
        return {
          success: false,
          message:
            "Host is blocked due to many connection errors. Contact your database administrator.",
        };
      } else {
        return {
          success: false,
          message: `Connection failed: ${error.message || "Unknown error"}`,
        };
      }
    }
  },
};

module.exports = MySQLDbCredentials;
