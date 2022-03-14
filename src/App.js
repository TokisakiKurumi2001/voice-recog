import { useRef, useState } from "react";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import "./App.css";
import microPhoneIcon from "./logo.svg";
import {useSpeechSynthesis} from "react-speech-kit";
import axios from "axios";

function chatbot(user_input, speak_fn, bot_response_text_fn) {
  let place = "Ho Chi Minh City";
  let temp = 30;
  let humidity = 75;
  let wind_speed = 5.5;
  let time = "";
  let wt_cond = "Sunny";
  let item = "Sunglass";
  axios.post("https://simple-ml-deply.herokuapp.com/api/v3/", {"input": user_input})
    .then(response => {
      let raw_bot_response = response.data.response;
      console.log(raw_bot_response);
      let bot_response = raw_bot_response;
      
      // need to get the place and time in order to determine temperature, humidity
      // weather condition
      let place_regexp = RegExp("(?<=%%)([A-Za-z ]+)(?=%%)");
      if (raw_bot_response.match(place_regexp) != null) {
        place = raw_bot_response.match(place_regexp)[0];
      }

      let time_regexp = RegExp("(?<=@@)([A-Za-z0-9 ]+)(?=@@)");
      if (raw_bot_response.match(time_regexp) != null) {
        time = raw_bot_response.match(time_regexp)[0];
      }

      console.log(`Place: ${place}, Time: ${time}`);
      // do something to get all the data or just a few neccessary stuff
      
      // for user that ask about different feature such as temp, humidity, wind speed
      // and the response from chatbot is !!feature!! $$value$$
      let feature_regexp = RegExp("(?<=!!)([A-Za-z0-9 ]+)(?=!!)");
      let feature = "";
      if (raw_bot_response.match(feature_regexp) != null) {
        feature = raw_bot_response.match(feature_regexp)[0];
      }
      let value = 0;
      if (feature === "temperature") {
        value = temp;
      } else if (feature === "humidity") {
        value = humidity;
      } else if (feature === "wind speed") {
        value = wind_speed;
      }

      bot_response = 
      bot_response
        .replaceAll("$$wt_cond$$", wt_cond)
        .replaceAll("$$item$$", item)
        .replaceAll("$$temp$$", temp)
        .replaceAll("$$value$$", value)
        .replaceAll("@@", "")
        .replaceAll("!!", "")
        .replaceAll("%%", "");
      console.log(bot_response);

      bot_response_text_fn(bot_response);
      speak_fn({"text": bot_response});
    });
}

function App() {
  const {speak} = useSpeechSynthesis();
  const [bot_response, setBotReponse] = useState("");
  const commands = [
    {
      command: "*",
      callback: (input) => {
        if (input.length !== 0) {
          chatbot(input, speak, setBotReponse);
        }
      }
    },
  ];
  const { transcript, resetTranscript } = useSpeechRecognition({ commands });
  const [isListening, setIsListening] = useState(false);
  
  const microphoneRef = useRef(null);
  if (!SpeechRecognition.browserSupportsSpeechRecognition()) {
    return (
      <div className="mircophone-container">
        Browser is not Support Speech Recognition.
      </div>
    );
  }
  const handleListing = () => {
    setIsListening(true);
    microphoneRef.current.classList.add("listening");
    SpeechRecognition.startListening({
      continuous: false,
    });
  };
  const stopHandle = () => {
    setIsListening(false);
    microphoneRef.current.classList.remove("listening");
    SpeechRecognition.stopListening();
  };
  const handleReset = () => {
    stopHandle();
    resetTranscript();
    setBotReponse("");
  };
  return (
    <div className="microphone-wrapper">
      <div className="mircophone-container">
        <div
          className="microphone-icon-container"
          ref={microphoneRef}
          onClick={handleListing}
        >
          <img src={microPhoneIcon} className="microphone-icon" />
        </div>
        <div className="microphone-status">
          {isListening ? "Listening........." : "Click to start Listening"}
        </div>
        {isListening && (
          <button className="microphone-stop btn" onClick={stopHandle}>
            Stop
          </button>
        )}
      </div>
      {transcript && (
        <div className="microphone-result-container">
          <div className="microphone-result-text">{transcript}</div>
          {bot_response && (
            <div className="microphone-result-text">{bot_response}</div>
          )}
          <button className="microphone-reset btn" onClick={handleReset}>
            Reset
          </button>
        </div>
      )}
    </div>
  );
}
export default App;