import logo from './logo.svg';
import './App.css';

function App({path}) {
  return (
    <div className="App">
      {JSON.stringify(path.sf2.programNames)}
    </div>
  );
}

export default App;
