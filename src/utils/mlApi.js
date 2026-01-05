import axios from "axios";

export default {
  predict(features) {
    return axios
      .post("http://localhost:5000/predict", { features })
      .then(res => res.data);
  }
};
