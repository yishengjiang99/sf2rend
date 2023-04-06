import {useRef, useEffect, useReducer} from "react";

export function useChannel(name) {
  const [messageState, dispatch] = useReducer(
    (prevState, data) => {
      const newMsg = data;
      return {
        lastMessage: newMsg,
        messages: prevState.messages.concat(newMsg),
      };
    },
    {
      lastMessage: null,
      messages: [],
    }
  );

  let channel = useRef(new BroadcastChannel(name));
  function postMessage(msg) {
    channel.current.postMessage(msg);
  }

  useEffect(() => {
    channel.current.onmessage = function ({data}) {
      dispatch(data);
    };
    return function cleanup() {
      channel.current && channel.current.close();
      channel = null;
    };
  }, [name]);
  return [messageState, postMessage];
}
