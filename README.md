# MySQL Node

A comprehensive MySQL database node for workflow automation. Execute SQL queries, perform CRUD operations, and manage your MySQL database seamlessly.

## Features

- **Multiple Operations**: Execute custom queries, SELECT, INSERT, UPDATE, DELETE
- **Parameterized Queries**: Prevent SQL injection with safe parameterized queries
- **Table Auto-complete**: Dynamic table loading from your database
- **Flexible Querying**: Support for WHERE clauses, ORDER BY, LIMIT, and more
- **Batch Operations**: Process multiple items in a single workflow execution
- **Error Handling**: Continue workflow execution on errors with detailed error information
- **Connection Testing**: Test credentials before saving
- **SSL Support**: Secure connections to MySQL servers

## Installation

```bash
# Navigate to the MySQL node directory
cd backend/custom-nodes/MySQL

# Install dependencies
npm install

# Register the node (from backend directory)
cd ../..
node src/cli/node-cli.js register ./custom-nodes/MySQL
node src/cli/node-cli.js activate mysql
```

## Configuration

### Credentials

Set up MySQL database credentials:

- **Host**: MySQL server hostname or IP address
- **Port**: MySQL server port (default: 3306)
- **Database**: Database name to connect to
- **User**: Database username
- **Password**: Database password
- **SSL**: Enable SSL connection (optional)

### Operations

#### 1. Execute Query

Execute custom SQL queries with parameterized inputs.

**Fields:**

- **Query**: SQL query with placeholders (?, ?, etc.)
- **Query Parameters**: Comma-separated values for placeholders

**Example:**

```sql
Query: SELECT * FROM users WHERE status = ? AND age > ?
Query Parameters: active,18
```

#### 2. Select

Retrieve data from a table with various filters.

**Fields:**

- **Table**: Select table from dropdown
- **Columns**: Columns to select (default: \*)
- **Return All**: Return all rows or limit results
- **Limit**: Maximum rows to return (when Return All is false)
- **Where Clause**: Filter conditions (e.g., id = ? AND status = ?)
- **Where Parameters**: Values for WHERE placeholders
- **Order By**: Sort results (e.g., created_at DESC)

#### 3. Insert

Insert new rows into a table.

**Fields:**

- **Table**: Target table
- **Data**: JSON object with column-value pairs
- **Return Fields**: Fields to return after insert (default: \*)

**Example:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "age": 30
}
```

#### 4. Update

Update existing rows in a table.

**Fields:**

- **Table**: Target table
- **Data**: JSON object with updated values
- **Where Clause**: Required filter to identify rows
- **Where Parameters**: Values for WHERE placeholders
- **Return Fields**: Fields to return after update

#### 5. Delete

Delete rows from a table.

**Fields:**

- **Table**: Target table
- **Where Clause**: Required filter (safety measure)
- **Where Parameters**: Values for WHERE placeholders

## Examples

### Example 1: Get Active Users

```
Operation: Select
Table: users
Columns: id,name,email
Where Clause: status = ? AND created_at > ?
Where Parameters: active,2024-01-01
Order By: name ASC
Limit: 100
```

### Example 2: Insert User

```
Operation: Insert
Table: users
Data: {"name": "Jane Smith", "email": "jane@example.com", "status": "active"}
Return Fields: id,name,created_at
```

### Example 3: Update User Status

```
Operation: Update
Table: users
Data: {"status": "inactive", "updated_at": "2024-10-17"}
Where Clause: id = ?
Where Parameters: 123
```

### Example 4: Custom Query with Aggregation

```
Operation: Execute Query
Query: SELECT status, COUNT(*) as count FROM users WHERE created_at > ? GROUP BY status
Query Parameters: 2024-01-01
```

## Security

- Uses prepared statements to prevent SQL injection
- Supports SSL/TLS connections
- Password fields are encrypted
- Connection pooling for efficient resource usage
- WHERE clauses required for UPDATE and DELETE operations

## Error Handling

Enable "Continue On Fail" to:

- Continue workflow execution even if database operations fail
- Receive error information as output data
- Handle errors gracefully in your workflow

## Tips

1. **Use Parameterized Queries**: Always use placeholders (?) instead of string concatenation
2. **Test Connections**: Use the credential test feature before running workflows
3. **Limit Results**: Use LIMIT for large datasets to prevent memory issues
4. **Index Your Tables**: Ensure proper indexing for better query performance
5. **Connection Pooling**: The node automatically manages connection pools

## Dependencies

- `mysql2`: Modern MySQL client with Promise support

## License

MIT
