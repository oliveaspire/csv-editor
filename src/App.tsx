import React, { useState, useCallback, useEffect } from "react";
import { CSVUploader } from "./components/CSVUploader";
import { DataTable } from "./components/DataTable";
import { CSVData, TableColumn } from "./types";
import { FileSpreadsheet } from "lucide-react";
import axios from "axios";

function App() {
  const [data, setData] = useState<CSVData[]>([]);
  const [columns, setColumns] = useState<TableColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/data`);
        if (response.data.success && response.data.data.length > 0) {
          const fetchedData = response.data.data;
          setData(fetchedData);
          setColumns(
            Object.keys(fetchedData[0]).map((header) => ({
              id: header,
              header,
              accessorKey: header,
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load data from server.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDataLoaded = useCallback((csvData: CSVData[], headers: string[]) => {
    setData(csvData);
    setColumns(
      headers.map((header) => ({
        id: header,
        header,
        accessorKey: header,
      }))
    );
    setError(null);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex items-center justify-center mb-8">
            <FileSpreadsheet className="w-8 h-8 text-blue-600 mr-2" />
            <h1 className="text-3xl font-bold text-gray-900">CSV Editor & Data Manager App</h1>
          </div>

          <CSVUploader onDataLoaded={handleDataLoaded} />

          {loading && <p className="text-center text-gray-500">Loading...</p>}
          {error && <p className="text-center text-red-500">{error}</p>}
          {data.length > 0 && !loading && (
            <DataTable data={data} columns={columns} onDataChange={setData} />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
