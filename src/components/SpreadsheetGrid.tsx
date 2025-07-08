import { useState, useCallback, useMemo } from "react";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import type { CellValueChangedEvent, CellClassParams } from "ag-grid-community";
import { useWorkers } from "../hooks/useWorkers";

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

export const SpreadsheetGrid = () => {
  const [rowData, setRowData] = useState<RowData[]>(() => initRowData());
  const [lastUpdatedCell, setLastUpdatedCell] = useState<{
    row: number | null;
    col: string | null;
  }>({
    row: null,
    col: null,
  });

  const { postToBroadcast, postToWorker, setWorkerMessageHandler } =
    useWorkers(setRowData);

  const columnDefs = useMemo(
    () =>
      COLUMNS.map((col) => ({
        field: col,
        editable: true,
        flex: 1,
        cellClassRules: {
          "flash-red": (params: CellClassParams) => {
            const val = parseFloat(params.value);
            const isNegative = !isNaN(val) && val < 0;
            const isJustUpdated =
              lastUpdatedCell?.row === params.node.rowIndex &&
              lastUpdatedCell?.col === params.colDef.field;
            return isJustUpdated && isNegative;
          },
        },
      })),
    [lastUpdatedCell]
  );

  const generateCellMap = useCallback((data: RowData[]) => {
    const cellMap: { [key: string]: string } = {};
    data.forEach((row, rowIndex) => {
      Object.keys(row).forEach((col) => {
        const cellKey = `${col}${rowIndex + 1}`;
        cellMap[cellKey] = row[col];
      });
    });
    return cellMap;
  }, []);

  const dataUpdate = useCallback(
    (rowData: RowData[]) => {
      setRowData(rowData);
      postToBroadcast({ type: "dataUpdate", rowData });
    },
    [postToBroadcast]
  );

  const handleCellValueChange = useCallback(
    (event: CellValueChangedEvent) => {
      const updatedRowData = [...rowData];
      const { rowIndex, colDef, value } = event;

      if (rowIndex === null || !colDef.field) return;

      setLastUpdatedCell({
        row: rowIndex,
        col: colDef.field,
      });

      if (value.startsWith("=")) {
        const cellMap = generateCellMap(updatedRowData);
        const formula = value.slice(1);

        postToWorker({
          formula,
          cellMap,
        });

        setWorkerMessageHandler((e: MessageEvent) => {
          const result = e.data?.result;
          updatedRowData[rowIndex][colDef.field!] = result.toString();
          dataUpdate(updatedRowData);
        });
      } else {
        updatedRowData[rowIndex][colDef.field!] = value;
        dataUpdate(updatedRowData);
      }
    },
    [
      rowData,
      dataUpdate,
      postToWorker,
      setWorkerMessageHandler,
      generateCellMap,
    ]
  );

  return (
    <>
      <div style={{ width: "100%", height: "100vh" }}>
        <AgGridReact
          rowData={rowData}
          columnDefs={columnDefs}
          onCellValueChanged={handleCellValueChange}
        />
      </div>
    </>
  );
};

export default SpreadsheetGrid;
