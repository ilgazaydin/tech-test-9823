import { useState } from "react";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";

ModuleRegistry.registerModules([AllCommunityModule]);

const COLUMNS = ["A", "B", "C", "D", "E"];
const ROW_COUNT = 10;

const broadcastChannel = new BroadcastChannel("grid-sync");

type RowData = {
  [key: string]: string;
};

const initRowData = (): RowData[] => {
  return Array.from({ length: ROW_COUNT }, () => {
    const row: RowData = {};
    COLUMNS.forEach((col) => {
      row[col] = "";
    });
    return row;
  });
};

function App() {
  const [rowData, setRowData] = useState<RowData[]>(initRowData());
  console.log("rowData :>> ", rowData);
  const [lastUpdatedCell, setLastUpdatedCell] = useState<{
    row: number | null;
    col: string | null;
  }>({
    row: null,
    col: null,
  });

  broadcastChannel.onmessage = (event) => {
    console.log("broadcast event :>> ", event);
    if (event.data.type === "dataUpdate") {
      setRowData(event.data.rowData);
    }
  };

  const columnDefs = COLUMNS.map((col) => ({
    field: col,
    editable: true,
    cellClassRules: {
      "flash-red": (params: any) => {
        const val = parseFloat(params.value);
        const isNegative = !isNaN(val) && val < 0;
        const isJustUpdated =
          lastUpdatedCell?.row === params.node.rowIndex &&
          lastUpdatedCell?.col === params.colDef.field;
        return isJustUpdated && isNegative;
      },
    },
  }));

  const generateCellMap = (data: RowData[]) => {
    const cellMap: { [key: string]: string } = {};
    data.forEach((row, rowIndex) => {
      Object.keys(row).forEach((col) => {
        const cellKey = `${col}${rowIndex + 1}`;
        cellMap[cellKey] = row[col];
      });
    });
    return cellMap;
  };

  const formulaWorker = new Worker(
    new URL("./formulaWorker.ts", import.meta.url),
    { type: "module" }
  );

  const dataUpdate = (rowData: RowData[]) => {
    setRowData(rowData);
    broadcastChannel.postMessage({ type: "dataUpdate", rowData });
  };

  const handleCellValueChange = (event: any) => {
    const updatedRowData = [...rowData];
    const { rowIndex, colDef, value } = event;
    setLastUpdatedCell({
      row: rowIndex,
      col: colDef.field,
    });
    console.log("rowIndex, colDef, value :>> ", rowIndex, colDef, value);

    if (value.startsWith("=")) {
      const cellMap = generateCellMap(updatedRowData);
      const formula = value.slice(1);

      formulaWorker.postMessage({
        formula,
        cellMap,
      });

      formulaWorker.onmessage = (e) => {
        console.log("e :>> ", e);

        const result = e.data?.result;
        updatedRowData[rowIndex][colDef.field] = result.toString();
        dataUpdate(updatedRowData);
      };
    } else {
      updatedRowData[rowIndex][colDef.field] = value;
      dataUpdate(updatedRowData);
    }
  };

  return (
    <>
      <div style={{ width: "100%", height: "500px" }}>
        <AgGridReact
          rowData={rowData}
          columnDefs={columnDefs}
          onCellValueChanged={handleCellValueChange}
        />
      </div>
    </>
  );
}

export default App;
