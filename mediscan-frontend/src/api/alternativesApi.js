export const getAlternatives = async (query) => {
  if (!query) return [];

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: 1,
          name: "Amoxicillin 500mg",
          price: 12,
          originalPrice: 15,
          salts: "Amoxicillin",
          saltMatch: true,
          recommended: true,
        },
        {
          id: 2,
          name: "Mox 500mg",
          price: 13,
          originalPrice: 15,
          salts: "Amoxicillin",
          saltMatch: true,
          recommended: false,
        },
        {
          id: 3,
          name: "Cipmox 500",
          price: 10,
          originalPrice: 15,
          salts: "Amoxicillin",
          saltMatch: false,
          recommended: false,
        },
      ]);
    }, 400);
  });
};
