self.onmessage = async (event) => {
  const { formula, cellMap } = event.data;

  try {
    const sanitizedFormula = formula.replace(/([A-Z]\d+)/g, (match) => {
      return cellMap[match] || "0";
    });

    const result = eval(sanitizedFormula);
    self.postMessage({ result });
  } catch (error) {
    console.error("Error evaluating formula:", error);
    self.postMessage({ result: "NaN" });
  }
};
