export const downloadCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
        console.warn('No data to export');
        return;
    }

    // Extract headers from the first object
    const headers = Object.keys(data[0]);

    // Convert data to CSV string
    const csvRows = [];
    
    // Add header row
    csvRows.push(headers.map(header => `"${String(header).replace(/"/g, '""')}"`).join(','));

    for (const row of data) {
        const values = headers.map(header => {
            const val = row[header];
            let valStr = val === null || val === undefined ? '' : String(val);
            
            // Force Excel to treat phone numbers as raw text to prevent removing leading zeros or scientific notation
            if (String(header).toLowerCase().includes('phone') && valStr !== '') {
                return `="${valStr.replace(/"/g, '""')}"`;
            }

            // Escape quotes by doubling them
            return `"${valStr.replace(/"/g, '""')}"`;
        });
        csvRows.push(values.join(','));
    }

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    
    // Create a temporary link to trigger the download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}.csv`);
    
    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
};
