import React, { useMemo, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { CSVData, TableColumn } from "../types";
import { Download, Trash2, Plus } from "lucide-react";
import Papa from "papaparse";
import axios from "axios";
import debounce from "lodash/debounce";
import { v4 as uuidv4 } from "uuid";

interface DataTableProps {
  data: CSVData[];
  columns: TableColumn[];
  onDataChange: (newData: CSVData[]) => void;
}

export function DataTable({ data, columns, onDataChange }: DataTableProps) {
  const columnHelper = createColumnHelper<CSVData>();

  const updateServerData = async (newData: CSVData[]) => {
    try {
      const response = await axios.post("http://localhost:5000/api/data", {
        data: newData,
      });
      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to update data");
      }
      console.log("Data updated successfully on server");
    } catch (error) {
      console.error("Error updating data:", error);

      throw error;
    }
  };

  const debouncedUpdateServer = useMemo(
    () => debounce(updateServerData, 500, { leading: false, trailing: true }),
    []
  );

  const tableColumns = useMemo(
    () =>
      columns
        .filter((col) => col.accessorKey !== "rowId") 
        .map((col) =>
          columnHelper.accessor(col.accessorKey, {
            header: col.header,
            cell: (info) => (
              <input
                type="text"
                value={(info.getValue() as string) || ""}
                onChange={async (e) => {
                  const newData = [...data];
                  newData[info.row.index][col.accessorKey] = e.target.value;
                  onDataChange(newData);
                  try {
                    await debouncedUpdateServer(newData);
                  } catch (error) {
                    console.error("Update failed, state reverted");
                   
                  }
                }}
                className="w-full p-2 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              />
            ),
          })
        ),
    [columns, data, onDataChange, debouncedUpdateServer]
  );

  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleExport = useCallback(() => {
    // Exclude rowId from exported CSV
    const exportData = data.map(({ rowId, ...rest }) => rest);
    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `exported_data_${new Date().toISOString()}.csv`;
    link.click();
  }, [data]);

  const handleAddRow = useCallback(async () => {
    const newRow = columns.reduce(
      (acc, col) => {
        if (col.accessorKey !== "rowId") {
          acc[col.accessorKey] = "";
        }
        return acc;
      },
      { rowId: uuidv4() } as CSVData
    );
    const newData = [...data, newRow];
    onDataChange(newData);
    try {
      await updateServerData(newData);
    } catch (error) {
      console.error("Failed to add row on server");
    }
  }, [columns, data, onDataChange]);

  const handleDeleteRow = useCallback(
    async (index: number) => {
      if (window.confirm("Are you sure you want to delete this row?")) {
        const newData = data.filter((_, i) => i !== index);
        onDataChange(newData);
        try {
          await updateServerData(newData);
        } catch (error) {
          console.error("Failed to delete row on server");
        }
      }
    },
    [data, onDataChange]
  );

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <div className="flex justify-end gap-2 p-4">
        <button
          onClick={handleAddRow}
          className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Row
        </button>
        <button
          onClick={handleExport}
          className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </button>
      </div>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </th>
              ))}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          ))}
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {table.getRowModel().rows.map((row, index) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
              <td className="px-6 py-4 whitespace-nowrap">
                <button
                  onClick={() => handleDeleteRow(index)}
                  className="text-red-600 hover:text-red-900"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
