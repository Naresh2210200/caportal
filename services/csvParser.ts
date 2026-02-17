/**
 * CSV Parser Service
 * Handles CSV parsing with proper quote handling and field trimming
 */

export function parseCSV(text: string): any[] {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length <= 1) return [];

    function parseLine(line: string): string[] {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        return result;
    }

    const headers = parseLine(lines[0]);
    const data: any[] = [];

    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        const values = parseLine(lines[i]);
        const row: any = {};

        headers.forEach((header, index) => {
            row[header] = values[index] || '';
        });

        data.push(row);
    }

    return data;
}

export function trimAllFields(obj: any): any {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
        cleaned[key] = typeof value === 'string' ? value.trim() : value;
    }
    return cleaned;
}

export function readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsText(file);
    });
}
