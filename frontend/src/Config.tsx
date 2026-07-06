import axios from "axios";
import toast from "react-hot-toast";

const api = axios.create({
  //for local development
  // baseURL: "http://127.0.0.1:8000/api",

  //for hosting 
  baseURL: 'https://api2.ahasanhabibroxy.online/api',
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    //check cancelation - check if this is a canceled request
    if (axios.isCancel(error)) {
      console.log("Request canceled:", error.message);
      return Promise.reject(error); // don't show any toast, just reject
    }

    // others error handling
    if (error.response) {
      const { status, data } = error.response;

      if (status === 422) {
        // Laravel Validation Errors
        const errors = data.errors;
        Object.keys(errors).forEach((key) => {
          toast.error(errors[key][0]);
        });
      } else {
        // orthers server errors
        toast.error(data.message || "Something went wrong!");
      }
    } else {
      // if this is actually a network or server connection error
      toast.error("Network error, please check your server connection.");
    }

    return Promise.reject(error);
  },
);

export default api;
