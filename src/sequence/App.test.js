import {render, screen} from "@testing-library/react";
import App from "./App";
import {midif} from "./fixtures/song.mid.js"
import {readMidi} from "./midiread";

const midiInfo = readMidi(midif.arrayBuffer)
test("renders learn react link", () => {
  window.visualViewport = {height: 422};
  const timerWorker = {
    postMessage: console.log,
    addEventListener: () => { }
  }
  render(
    <App
      {...{
        timerWorker,
        midiInfo,
        eventPipe: {postMessage: console.log},
      }}
    />
  );
  const linkElement = screen.getByText(/tempo/i);
  expect(linkElement).toBeInTheDocument();
});
