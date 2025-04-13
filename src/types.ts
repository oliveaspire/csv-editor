export interface CSVData {
  rowId?: string; // Optional, added for tracking
  [key: string]: string | undefined;
}

export interface TableColumn {
  id: string;
  header: string;
  accessorKey: string;
}
