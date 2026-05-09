function Table({ className = '', columns, data, emptyMessage = 'Belum ada data', getRowKey }) {
  return (
    <div className={`ui-table-wrap ${className}`.trim()}>
      {data.length === 0 ? (
        <div className="ui-table-empty-card">
          {emptyMessage}
        </div>
      ) : (
        <table className="ui-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key}>{column.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={getRowKey ? getRowKey(row) : rowIndex}>
                {columns.map((column) => (
                  <td data-label={column.header} key={column.key}>
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default Table
