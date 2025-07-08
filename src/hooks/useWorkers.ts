import { useEffect, useRef } from 'react';

type RowData = {
  [key: string]: string;
};

export const useWorkers = (onDataUpdate: (data: RowData[]) => void) => {
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const formulaWorkerRef = useRef<Worker | null>(null);

  useEffect(() => {
    broadcastChannelRef.current = new BroadcastChannel("grid-sync");
    formulaWorkerRef.current = new Worker(
      new URL("../formulaWorker.ts", import.meta.url),
      { type: "module" }
    );

    const handleBroadcastMessage = (event: MessageEvent) => {
      if (event.data.type === "dataUpdate") {
        onDataUpdate(event.data.rowData);
      }
    };

    broadcastChannelRef.current.onmessage = handleBroadcastMessage;

    return () => {
      broadcastChannelRef.current?.close();
      formulaWorkerRef.current?.terminate();
    };
  }, [onDataUpdate]);

  const postToBroadcast = (data: { type: string; rowData: RowData[] }) => {
    broadcastChannelRef.current?.postMessage(data);
  };

  const postToWorker = (data: { formula: string; cellMap: { [key: string]: string } }) => {
    formulaWorkerRef.current?.postMessage(data);
  };

  const setWorkerMessageHandler = (handler: (e: MessageEvent) => void) => {
    if (formulaWorkerRef.current) {
      formulaWorkerRef.current.onmessage = handler;
    }
  };

  return {
    postToBroadcast,
    postToWorker,
    setWorkerMessageHandler
  };
};