import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import mkpath from 'sf2rend/src/mkpath'
import SF2Service from 'sf2-service'

mkpath(new OfflineAudioContext(2, 48000, 48000), {
  sf2Service: new SF2Service(),
}).then(path => {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      {JSON.stringify(path)}
    </React.StrictMode>
  );

})


// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
