export const getDashboardData = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        user: {
          name: "Alexis Johnson",
          avatar: "https://i.pravatar.cc/40"
        },

        stats: {
          greeting: "Welcome back to your health dashboard."
        },

        prescriptions: [
          { id: 1, name: "Amoxicillin_Refill.pdf", doctor: "Dr. Sarah Smith", status: "Processed" },
          { id: 2, name: "Blood_Work_Analysis.pdf", doctor: "City General Lab", status: "Analyzing" }
        ],

        schedule: [
          { id: 1, time: "08:00 AM", medicine: "Lisinopril 10mg" },
          { id: 2, time: "01:00 PM", medicine: "Vitamin D3" },
          { id: 3, time: "09:00 PM", medicine: "Atorvastatin" }
        ],

        insights: [
          { id: 1, title: "Interaction Warning", text: "Avoid grapefruit with Atorvastatin." },
          { id: 2, title: "Cost Saving Alert", text: "Generic option found." }
        ]
      });
    }, 500);
  });
};