const mysql = require("mysql2/promise");

const MySQLNode = {
  identifier: "mysql",
  displayName: "MySQL",
  name: "mysql",
  group: ["database"],
  version: 1,
  description:
    "Execute MySQL queries - SELECT, INSERT, UPDATE, DELETE operations",
  icon: "file:icon.svg",
  color: "#00758F",
  defaults: {
    name: "MySQL",
  },
  inputs: ["main"],
  outputs: ["main"],
  credentials: [
    {
      name: "mysqlDb",
      required: true,
    },
  ],
  properties: [
    {
      displayName: "Authentication",
      name: "authentication",
      type: "credential",
      required: true,
      default: "",
      description: "Select MySQL credentials to connect to the database",
      placeholder: "Select credentials...",
      allowedTypes: ["mysqlDb"],
    },
    {
      displayName: "Operation",
      name: "operation",
      type: "options",
      default: "executeQuery",
      required: true,
      options: [
        {
          name: "Execute Query",
          value: "executeQuery",
          description: "Execute a custom SQL query",
        },
        {
          name: "Insert",
          value: "insert",
          description: "Insert rows into a table",
        },
        {
          name: "Update",
          value: "update",
          description: "Update rows in a table",
        },
        {
          name: "Delete",
          value: "delete",
          description: "Delete rows from a table",
        },
        {
          name: "Select",
          value: "select",
          description: "Select rows from a table",
        },
      ],
      description: "The operation to perform on the database",
    },
    // Execute Query fields
    {
      displayName: "Query",
      name: "query",
      type: "string",
      typeOptions: {
        rows: 5,
      },
      displayOptions: {
        show: {
          operation: ["executeQuery"],
        },
      },
      default: "",
      required: true,
      description: "SQL query to execute",
      placeholder: "SELECT * FROM users WHERE status = ?",
    },
    {
      displayName: "Query Parameters",
      name: "queryParams",
      type: "string",
      displayOptions: {
        show: {
          operation: ["executeQuery"],
        },
      },
      default: "",
      description:
        "Query parameters as comma-separated values (e.g., active,123,john)",
      placeholder: "param1,param2,param3",
    },
    // Select fields
    {
      displayName: "Table",
      name: "table",
      type: "autocomplete",
      typeOptions: {
        loadOptionsMethod: "getTables",
      },
      displayOptions: {
        show: {
          operation: ["select", "insert", "update", "delete"],
        },
      },
      default: "",
      required: true,
      description: "Select a table from the database",
      placeholder: "Search and select table...",
    },
    {
      displayName: "Return All",
      name: "returnAll",
      type: "boolean",
      displayOptions: {
        show: {
          operation: ["select"],
        },
      },
      default: true,
      description: "Return all results or limit the number of rows",
    },
    {
      displayName: "Limit",
      name: "limit",
      type: "number",
      displayOptions: {
        show: {
          operation: ["select"],
          returnAll: [false],
        },
      },
      default: 50,
      description: "Maximum number of rows to return",
    },
    {
      displayName: "Where Clause",
      name: "where",
      type: "string",
      displayOptions: {
        show: {
          operation: ["select", "update", "delete"],
        },
      },
      default: "",
      description:
        "WHERE clause without the WHERE keyword (e.g., id = ? AND status = ?)",
      placeholder: "id = ? AND status = ?",
    },
    {
      displayName: "Where Parameters",
      name: "whereParams",
      type: "string",
      displayOptions: {
        show: {
          operation: ["select", "update", "delete"],
        },
      },
      default: "",
      description: "Parameters for WHERE clause as comma-separated values",
      placeholder: "123,active",
    },
    {
      displayName: "Columns",
      name: "columns",
      type: "string",
      displayOptions: {
        show: {
          operation: ["select"],
        },
      },
      default: "*",
      description: "Columns to select (comma-separated or *)",
      placeholder: "id,name,email",
    },
    {
      displayName: "Order By",
      name: "orderBy",
      type: "string",
      displayOptions: {
        show: {
          operation: ["select"],
        },
      },
      default: "",
      description: "ORDER BY clause (e.g., created_at DESC, name ASC)",
      placeholder: "created_at DESC",
    },
    // Insert fields
    {
      displayName: "Data",
      name: "data",
      type: "json",
      displayOptions: {
        show: {
          operation: ["insert", "update"],
        },
      },
      default: "{}",
      required: true,
      description: "Data to insert/update as JSON object",
      placeholder: '{"name": "John", "email": "john@example.com"}',
    },
    {
      displayName: "Return Fields",
      name: "returnFields",
      type: "string",
      displayOptions: {
        show: {
          operation: ["insert", "update"],
        },
      },
      default: "*",
      description: "Fields to return after insert/update (e.g., id,name or *)",
      placeholder: "*",
    },
  ],

  // Custom settings specific to MySQL
  settings: {
    connectionTimeout: {
      displayName: "Connection Timeout (ms)",
      name: "connectionTimeout",
      type: "number",
      default: 10000,
      description: "Maximum time to wait for database connection",
    },
  },

  execute: async function (inputData) {
    const items = inputData.main?.[0] || [];
    const results = [];

    // If no input items, create a default item to ensure query executes at least once
    const itemsToProcess = items.length > 0 ? items : [{ json: {} }];

    // Get settings (from Settings tab)
    const continueOnFail = this.settings?.continueOnFail ?? false;

    this.logger.info(`[MySQL] continueOnFail setting: ${continueOnFail}`);
    this.logger.info(`[MySQL] Settings object:`, this.settings);

    // Get connection parameters from credentials
    let host, port, database, user, password, ssl, connectionTimeout;

    try {
      const credentials = await this.getCredentials("mysqlDb");

      if (!credentials || !credentials.host) {
        throw new Error(
          "MySQL credentials are required. Please select credentials in the Authentication field."
        );
      }

      host = credentials.host;
      port = credentials.port || 3306;
      database = credentials.database;
      user = credentials.user;
      password = credentials.password;
      ssl = credentials.ssl || false;

      // Get connectionTimeout from settings first, fallback to credentials, then default
      connectionTimeout =
        this.settings?.connectionTimeout ??
        credentials.connectionTimeout ??
        10000;

      this.logger.info("Using MySQL credentials from authentication", {
        connectionTimeout,
        fromSettings: !!this.settings?.connectionTimeout,
      });
    } catch (error) {
      // If credentials are not available, throw an error
      throw new Error(`Failed to get credentials: ${error.message}`);
    }

    const operation = await this.getNodeParameter("operation");

    // Create connection pool
    const pool = mysql.createPool({
      host,
      port,
      database,
      user,
      password,
      ssl: ssl ? { rejectUnauthorized: false } : false,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: connectionTimeout,
    });

    try {
      for (const item of itemsToProcess) {
        try {
          let queryText = "";
          let queryParams = [];
          let result;

          switch (operation) {
            case "executeQuery": {
              queryText = await this.getNodeParameter("query");
              const paramsStr = await this.getNodeParameter("queryParams");

              if (paramsStr) {
                queryParams = paramsStr.split(",").map((p) => p.trim());
              }

              const [rows, fields] = await pool.execute(queryText, queryParams);

              results.push({
                json: {
                  ...item.json,
                  rows: Array.isArray(rows) ? rows : [rows],
                  rowCount: Array.isArray(rows) ? rows.length : 1,
                  affectedRows: rows.affectedRows,
                  insertId: rows.insertId,
                  fields: fields?.map((f) => ({
                    name: f.name,
                    type: f.type,
                    table: f.table,
                  })),
                },
              });
              break;
            }

            case "select": {
              const table = await this.getNodeParameter("table");
              const columns = (await this.getNodeParameter("columns")) || "*";
              const where = await this.getNodeParameter("where");
              const whereParamsStr = await this.getNodeParameter("whereParams");
              const returnAll = await this.getNodeParameter("returnAll");
              const limit = returnAll
                ? null
                : await this.getNodeParameter("limit");
              const orderBy = await this.getNodeParameter("orderBy");

              queryText = `SELECT ${columns} FROM \`${table}\``;

              if (where) {
                queryText += ` WHERE ${where}`;
                if (whereParamsStr) {
                  queryParams = whereParamsStr.split(",").map((p) => p.trim());
                }
              }

              if (orderBy) {
                queryText += ` ORDER BY ${orderBy}`;
              }

              if (limit) {
                queryText += ` LIMIT ${limit}`;
              }

              const [rows] = await pool.execute(queryText, queryParams);

              results.push({
                json: {
                  ...item.json,
                  rows: rows,
                  rowCount: rows.length,
                },
              });
              break;
            }

            case "insert": {
              const table = await this.getNodeParameter("table");
              const dataStr = await this.getNodeParameter("data");
              const returnFields =
                (await this.getNodeParameter("returnFields")) || "*";

              let data;
              try {
                data =
                  typeof dataStr === "string" ? JSON.parse(dataStr) : dataStr;
              } catch (e) {
                throw new Error(`Invalid JSON data: ${e.message}`);
              }

              const columns = Object.keys(data);
              const values = Object.values(data);
              const placeholders = values.map(() => "?").join(", ");

              queryText = `INSERT INTO \`${table}\` (\`${columns.join(
                "`, `"
              )}\`) VALUES (${placeholders})`;
              queryParams = values;

              const [insertResult] = await pool.execute(queryText, queryParams);

              // Fetch the inserted row if returnFields is specified
              let insertedRow = {
                insertId: insertResult.insertId,
                affectedRows: insertResult.affectedRows,
              };

              if (returnFields !== "*" || insertResult.insertId) {
                try {
                  const [rows] = await pool.execute(
                    `SELECT ${returnFields} FROM \`${table}\` WHERE id = ?`,
                    [insertResult.insertId]
                  );
                  if (rows && rows.length > 0) {
                    insertedRow = { ...insertedRow, ...rows[0] };
                  }
                } catch (selectError) {
                  // If select fails, just return the insert result
                  this.logger.warn("Could not fetch inserted row", {
                    error: selectError,
                  });
                }
              }

              results.push({
                json: {
                  ...item.json,
                  inserted: insertedRow,
                  rowCount: insertResult.affectedRows,
                },
              });
              break;
            }

            case "update": {
              const table = await this.getNodeParameter("table");
              const dataStr = await this.getNodeParameter("data");
              const where = await this.getNodeParameter("where");
              const whereParamsStr = await this.getNodeParameter("whereParams");
              const returnFields =
                (await this.getNodeParameter("returnFields")) || "*";

              if (!where) {
                throw new Error(
                  "WHERE clause is required for UPDATE operation to prevent accidental updates"
                );
              }

              let data;
              try {
                data =
                  typeof dataStr === "string" ? JSON.parse(dataStr) : dataStr;
              } catch (e) {
                throw new Error(`Invalid JSON data: ${e.message}`);
              }

              const columns = Object.keys(data);
              const values = Object.values(data);
              const setClause = columns
                .map((col) => `\`${col}\` = ?`)
                .join(", ");

              queryParams = [...values];

              if (whereParamsStr) {
                const whereParams = whereParamsStr
                  .split(",")
                  .map((p) => p.trim());
                queryParams.push(...whereParams);
              }

              queryText = `UPDATE \`${table}\` SET ${setClause} WHERE ${where}`;

              const [updateResult] = await pool.execute(queryText, queryParams);

              // Fetch updated rows if WHERE clause is provided
              let updatedRows = [];
              if (where && updateResult.affectedRows > 0) {
                try {
                  const selectQuery = `SELECT ${returnFields} FROM \`${table}\` WHERE ${where}`;
                  const selectParams = whereParamsStr
                    ? whereParamsStr.split(",").map((p) => p.trim())
                    : [];
                  const [rows] = await pool.execute(selectQuery, selectParams);
                  updatedRows = rows;
                } catch (selectError) {
                  this.logger.warn("Could not fetch updated rows", {
                    error: selectError,
                  });
                }
              }

              results.push({
                json: {
                  ...item.json,
                  updated: updatedRows,
                  rowCount: updateResult.affectedRows,
                  changedRows: updateResult.changedRows,
                },
              });
              break;
            }

            case "delete": {
              const table = await this.getNodeParameter("table");
              const where = await this.getNodeParameter("where");
              const whereParamsStr = await this.getNodeParameter("whereParams");

              if (!where) {
                throw new Error(
                  "WHERE clause is required for DELETE operation to prevent accidental deletion"
                );
              }

              queryText = `DELETE FROM \`${table}\` WHERE ${where}`;

              if (whereParamsStr) {
                queryParams = whereParamsStr.split(",").map((p) => p.trim());
              }

              const [deleteResult] = await pool.execute(queryText, queryParams);

              results.push({
                json: {
                  ...item.json,
                  deleted: true,
                  rowCount: deleteResult.affectedRows,
                },
              });
              break;
            }

            default:
              throw new Error(`Unknown operation: ${operation}`);
          }
        } catch (error) {
          // Handle errors for individual items
          if (continueOnFail) {
            // If continueOnFail is enabled, return error as output data
            results.push({
              json: {
                ...item.json,
                error: true,
                errorMessage: error.message,
                errorCode: error.code,
                errorDetails: error.toString(),
              },
            });
          } else {
            // If continueOnFail is disabled, throw the error to stop workflow
            throw error;
          }
        }
      }
    } finally {
      // Always close the pool
      await pool.end();
    }

    return [{ main: results }];
  },

  /**
   * Load options methods - dynamically load dropdown options
   */
  loadOptions: {
    /**
     * Get list of tables from the database
     */
    async getTables() {
      // Get connection parameters from credentials
      let host, port, database, user, password, ssl, connectionTimeout;

      try {
        const credentials = await this.getCredentials("mysqlDb");

        if (!credentials || !credentials.host) {
          return [
            {
              name: "No credentials selected",
              value: "",
              description: "Please select MySQL credentials first",
            },
          ];
        }

        host = credentials.host;
        port = credentials.port || 3306;
        database = credentials.database;
        user = credentials.user;
        password = credentials.password;
        ssl = credentials.ssl || false;
        // Use settings first, then fall back to credentials
        connectionTimeout =
          this.settings?.connectionTimeout ??
          credentials.connectionTimeout ??
          10000;
      } catch (error) {
        return [
          {
            name: "Error: Credentials required",
            value: "",
            description: error.message,
          },
        ];
      }

      // Create connection
      let connection;
      try {
        connection = await mysql.createConnection({
          host,
          port,
          database,
          user,
          password,
          ssl: ssl ? { rejectUnauthorized: false } : false,
          connectTimeout: connectionTimeout,
        });

        // Query to get all tables from the database
        const [rows] = await connection.execute(
          `
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = ? 
          AND table_type = 'BASE TABLE'
          ORDER BY table_name
        `,
          [database]
        );

        await connection.end();

        // Format results for dropdown
        return rows.map((row) => ({
          name: row.table_name || row.TABLE_NAME,
          value: row.table_name || row.TABLE_NAME,
          description: `Table: ${row.table_name || row.TABLE_NAME}`,
        }));
      } catch (error) {
        if (connection) {
          await connection.end();
        }
        this.logger.error("Failed to load tables", { error });

        // Return error message as option
        return [
          {
            name: "Error loading tables - check credentials",
            value: "",
            description: error.message,
          },
        ];
      }
    },
  },
};

module.exports = MySQLNode;
