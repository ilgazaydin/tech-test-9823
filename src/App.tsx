import { useState } from "react";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";

ModuleRegistry.registerModules([AllCommunityModule]);

const COLUMNS = ["A", "B", "C", "D", "E"];
const ROW_COUNT = 10;

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

  const columnDefs = COLUMNS.map((col) => ({
    field: col,
    editable: true,
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

  const calculateFormula = (
    formula: string,
    cellMap: { [key: string]: string }
  ) => {
    try {
      const sanitizedFormula = formula.replace(/([A-Z]\d+)/g, (match) => {
        return cellMap[match] || "0";
      });
      const result = eval(sanitizedFormula);
      return result;
    } catch (error) {
      console.error("Error evaluating formula:", error);
      return "NaN";
    }
  };

  const handleCellValueChange = (event: any) => {
    const updatedRowData = [...rowData];
    const { rowIndex, colDef, value } = event;
    console.log("rowIndex, colDef, value :>> ", rowIndex, colDef, value);

    if (value.startsWith("=")) {
      const cellMap = generateCellMap(updatedRowData);
      console.log("cellMap :>> ", cellMap);
      const formulaResult = calculateFormula(value.slice(1), cellMap);
      console.log("formulaResult :>> ", formulaResult);
      updatedRowData[rowIndex][colDef.field] = formulaResult.toString();
    } else {
      updatedRowData[rowIndex][colDef.field] = value;
    }

    setRowData(updatedRowData);
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
