import DemoClient from "../../components/DemoClient";

export default function TryPage() {
  return (
    <main className="min-h-screen px-6 py-10">
      <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>
      <p className="text-sm opacity-70 mb-6">
        Load the sample dataset, view your baseline, then run a “what if”
        scenario.
      </p>
      <DemoClient />
    </main>
  );
}
