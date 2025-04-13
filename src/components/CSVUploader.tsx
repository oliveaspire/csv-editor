import React, { useCallback } from "react";
import { Upload } from "lucide-react";
import Papa from "papaparse";
import axios from "axios";
import { CSVData } from "../types";
import { v4 as uuidv4 } from "uuid"; // Add uuid for generating rowId

interface CSVUploaderProps {
  onDataLoaded: (data: CSVData[], headers: string[]) => void;
}

export function CSVUploader({ onDataLoaded }: CSVUploaderProps) {
  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.name.endsWith(".csv")) {
        alert("Please upload a valid CSV file.");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert("File size exceeds 5MB limit.");
        return;
      }

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          if (results.errors.length > 0) {
            console.error("CSV parsing errors:", results.errors);
            alert("Error parsing CSV file. Please check the file format.");
            return;
          }

          const data = (results.data as CSVData[]).map((row) => ({
            ...row,
            rowId: row.rowId || uuidv4(), 
          }));

          if (data.length === 0) {
            alert("The CSV file is empty.");
            return;
          }

          const headers = Object.keys(data[0]).filter(
            (key) => key !== "rowId"
          );
          try {
            const response = await axios.post("http://localhost:5000/api/data", {
              data,
            });

            if (response.data.success) {
              onDataLoaded(data, headers);
            } else {
              console.error("Failed to save data:", response.data.message);
              alert("Failed to save data to the server.");
            }
          } catch (error) {
            console.error("Error saving data:", error);
            alert("Error saving data to the server.");
          }
        },
        error: (error) => {
          console.error("Error parsing CSV:", error);
          alert("Error parsing CSV file.");
        },
      });
    },
    [onDataLoaded]
  );

  return (
    <div className="flex items-center justify-center w-full mb-8">
      <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <Upload className="w-10 h-10 mb-3 text-gray-400" />
          <p className="mb-2 text-sm text-gray-500">
            <span className="font-semibold">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-500">CSV files only (max 5MB)</p>
        </div>
        <input
          type="file"
          className="hidden"
          accept=".csv"
          onChange={handleFileUpload}
        />
      </label>
    </div>
  );
}
