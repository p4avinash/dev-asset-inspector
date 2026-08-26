import { AssetInspector } from "./components/inspector/AssetInspector";
import { InspectorHost } from "./components/inspector/InspectorHost";

function App() {
  return (
    <>
      <main className="consumer-app">
        <h1>Consumer Application</h1>
        <p>This represents the user's application.</p>
      </main>

      <InspectorHost />
    </>
  );
}

export default App;
