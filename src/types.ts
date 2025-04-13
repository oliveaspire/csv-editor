export interface CSVData {
  rowId?: string; 
  [key: string]: string | undefined;
}

export interface TableColumn {
  id: string;
  header: string;
  accessorKey: string;
}
